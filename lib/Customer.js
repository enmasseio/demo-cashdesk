var Promise = require('promise');
var moment = require('moment');
var eve = require('evejs');
var babble = require('babble');
var Chance = require('chance');

var util = require('./util');

var chance = new Chance();

var SATURDAY = 6;
var MAX_SHOP_COUNT = 1;

/**
 * Create a customer. The customer will shop every saturday for a certain
 * number of groceries
 * @param {string} id   Name of the customer
 * @param {{payDuration: {mean: number, dev: number}, grabDuration: number, groceries: number}} [params]
 * @constructor
 */
function Customer (id, params) {
  // execute super constructor function
  eve.Agent.call(this, id);

  // babblify this agent
  this.extend('babble');

  // connect to all configured transports
  this.connect(eve.system.transports.getAll());

  this.shopCount = 0;

  // properties
  this.groceries = 10; // number of groceries
  this.payDuration = {
    mean: 20 * 1000, // ms
    dev: 10 * 1000   // ms
  };

  // logger
  eve.system.logger.loggify(this, {prototype: 'Customer', id: this.id});

  // optional parameters
  if (params) {
    if (params.payDuration) {
      var sd = params.payDuration;
      if ('mean' in sd) this.payDuration.mean = sd.mean;
      if ('dev' in sd)  this.payDuration.dev  = sd.dev;
    }
    if ('groceries' in params) this.groceries  = params.groceries;
  }

  this.log({event: 'create', params: {groceries: this.groceries, payDuration: this.payDuration}});
}

// extend the eve.Agent prototype
Customer.prototype = Object.create(eve.Agent.prototype);
Customer.prototype.constructor = Customer;

/**
 * Plan to go shopping the first next Saturday at 11:00
 * @param {Supermarket} supermarket
 */
Customer.prototype.planShopping = function (supermarket) {
  var me = this;
  var today = moment(eve.system.timer.now());
  var nextSaturday;
  if (today.weekday() === SATURDAY) {
    nextSaturday = today.add(7, 'day');
  }
  else {
    nextSaturday = today.weekday(SATURDAY);
  }
  nextSaturday.hour(11);
  nextSaturday.minute(0);
  nextSaturday.second(0);
  nextSaturday.millisecond(0);

  this.log({event: 'plan', date: nextSaturday.toISOString(), supermarket: supermarket.id});

  eve.system.timer.setTrigger(function () {
    me.shop(supermarket)
        .then(function () {
          me.shopCount++;
          if (me.shopCount < MAX_SHOP_COUNT) {
            setTimeout(function () {
              me.planShopping(supermarket);
            }, 0)
          }
        });
  }, nextSaturday.toDate())
};

/**
 * Go shopping:
 * - collect the groceries
 * - enter the queue of one of the cash desks
 * - wait until the groceries are scanned
 * - pay for the groceries
 * - leave the cash desk
 * @param {Supermarket} supermarket
 * @return {Promise} returns a promise which resolves when shopping is finished.
 */
Customer.prototype.shop = function (supermarket) {
  var me = this;
  this.log({event: 'shop', supermarket: supermarket.id});

    // TODO: implement shopping
  return this.grabGroceries()
      .then(function () {
        // pick one of the open cash desks and enter the queue
        // TODO: smartly select one based on the queue etc.
        var openCashDesks = supermarket.openCashDesks();
        var cashDesk = util.pickRandom(openCashDesks);

        // start listening for a greeting from the cashier
        me.listenOnce('hello')

            // wait until the cashier
            .listen(function (amount, context) {
              context.amount = parseFloat(amount);
            })

            // do the payment
            .then(function (response, context) {
              return me.pay(context.amount);
            })
            .tell(function (response, context) {
              return context.amount;
            })

            // await a bye message, then leave the cash desk
            .listen(function (message) { // message will be 'bye'
              me.log({event: 'queue-leave', cashDesk: cashDesk.id});
              cashDesk.leave(me);
            });

        me.log({event: 'queue-enter', cashDesk: cashDesk.id});
        cashDesk.enter(me);
      });
    // TODO: pay
};

/**
 * Simulate collecting the groceries
 * @return {Promise} returns a promise which resolves when collecting is finished.
 */
Customer.prototype.grabGroceries = function () {
  var me = this;
  var duration = this.groceries * 50 * 1000; //ms
  me.log({event: 'collect-start', groceries: me.groceries});

  return util.delay(eve.system.timer, duration)
      .then(function () {
        me.log({event: 'collect-end', groceries: me.groceries, duration: duration});
      })
};

/**
 * Simulate paying for the groceries
 * @param {number} amount
 * @return {Promise} returns a promise which resolves when paying is finished.
 */
Customer.prototype.pay = function (amount) {
  var me = this;
  var duration = Math.round(chance.normal(me.payDuration)); // ms
  me.log({event: 'pay-start', amount: amount});

  return util.delay(eve.system.timer, duration)
      .then(function () {
        me.log({event: 'pay-end', amount: amount, duration: duration});
      })
};

module.exports = Customer;
