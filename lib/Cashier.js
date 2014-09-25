var Promise = require('promise');
var Chance = require('chance');
var eve = require('evejs');
var babble = require('babble');

var util = require('./util');

var chance = new Chance('my seed');

/**
 * Cashier
 * @param {string} id  Name of the cashier
 * @param {{scanDuration: {mean: number, dev: number}}} [params]
 * @constructor
 */
function Cashier (id, params) {
  // execute super constructor function
  eve.Agent.call(this, id);

  // babblify this agent
  this.extend('babble');

  // connect to all configured transports
  this.connect(eve.system.transports.getAll());

  this.cashDesk = null;
  this.customer = null;

  this.scanDuration = {
    mean: 2 * 60 * 1000, // ms
    dev: 0.5 * 60 * 1000 // ms
  };

  // logger
  eve.system.logger.loggify(this, {prototype: 'Cashier', id: this.id});

  // optional parameters
  if (params) {
    if (params.scanDuration) {
      var sd = params.scanDuration;
      if ('mean' in sd) this.scanDuration.mean = sd.mean;
      if ('dev' in sd)  this.scanDuration.dev  = sd.dev;
    }
  }

  this.log({event: 'create', params: {scanDuration: this.scanDuration}});
}

// extend the eve.Agent prototype
Cashier.prototype = Object.create(eve.Agent.prototype);
Cashier.prototype.constructor = Cashier;

/**
 * Open a cash desk, start working
 * @param {CashDesk} cashDesk
 */
Cashier.prototype.open = function (cashDesk) {
  this.log({event: 'open', cashDesk: cashDesk.id});

  this.cashDesk = cashDesk;
  this.cashDesk.open(this);

  this.cashDesk.on('queue', this.next.bind(this));
};

/**
 * Close the cash desk, stop working
 */
Cashier.prototype.close = function () {
  if (this.cashDesk) {
    this.log({event: 'close', cashDesk: this.cashDesk.id});

    this.cashDesk.close();
    this.cashDesk = null;
  }
};

/**
 * Handle next client in the queue (if any)
 */
Cashier.prototype.next = function () {
  if (this.customer) {
    // we are currently handling a client
    return;
  }

  var customer = this.cashDesk.queue[0];
  if (customer) {
    this.checkout(customer);
  }
};

/**
 * Checkout a customer. The duration of checking out is determined by the time
 * it takes the cashier to scan all groceries and the time it takes the customer
 * to pay. There are some random factors in here to make it realistic.
 * @param {Customer} customer
 * @return {Promise} Returns a promise which resolves when the checkout is
 *                   finished
 */
Cashier.prototype.checkout = function (customer) {
  var me = this;

  return new Promise(function (resolve, reject) {
    me.customer = customer;
    me.log({event: 'checkout', customer: customer.id});

    // greet the customer
    me.tell(customer.id, 'hello')

        // scan the goods
        .then(function () {
          return me.scanGoods(customer);
        })

        // ask to pay
        .tell(function (response, context) {
          context.amount = 20; // TODO: calculate a realistic and dynamic amount to pay

          me.log({event: 'pay', customer: customer.id, amount: context.amount});

          return context.amount + ' bitcoin please';
        })

        // wait for pay response
        .listen(function (payedAmount, context) {
          me.log({
            event: 'payed',
            customer: customer.id,
            payedAmount: payedAmount,
            ok: payedAmount == context.amount
          });
        })

        // good bye message
        .tell('bye')

        // finish the checkout
        .then(function () {
          me.customer = null;

          me.log({event: 'bye', customer: customer.id});

          resolve();
        });
  })
};

/**
 * Simulate scanning goods
 * @param {Customer} customer
 * @return {Promise.<number>} returns a promise which resolves when scanning is finished
 */
Cashier.prototype.scanGoods = function (customer) {
  var me = this;
  var duration = Math.round(chance.normal(me.scanDuration)); // ms
  var start = eve.system.timer.getTime().toISOString();
  // TODO: reckon with the number of goods in calculating the duration

  me.log({event: 'scan-start', customer: customer.id, goods: customer.groceries});

  return util.delay(duration)
      .then(function () {
        me.log({event: 'scan-end', customer: customer.id, goods: customer.groceries, duration: duration});
        return duration;
      });
};

module.exports = Cashier;
