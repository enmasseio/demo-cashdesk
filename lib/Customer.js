var Promise = require('promise');
var moment = require('moment');
var actors = require('simple-actors');
var babble = require('babble');
var Chance = require('chance');

var timer = require('./timer');
var loggify = require('./loggify');
var util = require('./util');

var chance = new Chance();

var SATURDAY = 6;
var MAX_SHOP_COUNT = 0; // TODO: repeated shopping

/**
 * Create a customer. The customer will shop every saturday for a certain
 * number of groceries
 * @param {string} id   Name of the customer
 * @param {{payDuration: {mean: number, dev: number}, grabDuration: number, groceries: number}} options
 * @constructor
 */
function Customer (id, options) {
  // execute super constructor function
  actors.Actor.call(this, id);

  // babblify this Actor
  babble.babblify(this);

  this.shopCount = 0;

  // properties
  this.groceries = 10; // number of groceries
  this.payDuration = {
    mean: 20 * 1000, // ms
    dev: 10 * 1000   // ms
  };

  if (options) {
    if (options.payDuration) {
      var sd = options.payDuration;
      if ('mean' in sd) this.payDuration.mean = sd.mean;
      if ('dev' in sd)  this.payDuration.dev  = sd.dev;
    }
    if ('groceries' in options) this.groceries  = options.groceries;
  }

  loggify(this, {prototype: 'Customer', id: this.id});
  this.log({event: 'create', options: options});
}

// extend the actors.Actor prototype
Customer.prototype = Object.create(actors.Actor.prototype);
Customer.prototype.constructor = Customer;

/**
 * Plan to go shopping the first next Saturday at 11:00
 * @param {Supermarket} supermarket
 */
Customer.prototype.planShopping = function (supermarket) {
  var me = this;
  var today = moment(timer.now());
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

  timer.setTrigger(function () {
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
            .tell(function (response, context) {
              me.log({event: 'pay', amount: context.amount});

              var payDuration = chance.normal(me.payDuration);
//              return util.delay(payDuration, timer) // TODO: delay
//                  .then(function () {
//                    return context.amount;
//                  });
              return context.amount;
            })

            // await a bye message, then leave the cash desk
            .listen(function () {
              me.log({event: 'queue', action: 'leave', cashDesk: cashDesk.id});
              cashDesk.leave(me);
            });

        me.log({event: 'queue', action: 'enter', cashDesk: cashDesk.id});
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
  var grabDuration = this.groceries * 50 * 1000; //ms

  return new Promise(function (resolve, reject) {
    me.log({event: 'collect', groceries: me.groceries});

    timer.setTimeout(resolve, grabDuration);
  });
};

/**
 * Simulate paying for the groceries
 * @param {number} amount
 * @return {Promise} returns a promise which resolves when paying is finished.
 */
Customer.prototype.pay = function (amount) {
  var me = this;
  var payDuration = chance.normal(this.payDuration);

  return new Promise(function (resolve, reject) {
    me.log({event: 'pay', amount: amount});

    timer.setTimeout(resolve, payDuration);
  });
};


module.exports = Customer;
