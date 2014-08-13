var Promise = require('promise');
var Chance = require('chance');
var actors = require('simple-actors');
var babble = require('babble');

var loggify = require('./loggify');
var timer = require('./timer');
var util = require('./util');

var chance = new Chance();

/**
 * Cashier
 * @param {string} id  Name of the cashier
 * @param {{scanDuration: {mean: number, dev: number}}} options
 * @constructor
 */
function Cashier (id, options) {
  // execute super constructor function
  actors.Actor.call(this, id);

  // babblify this Actor
  babble.babblify(this);

  this.cashDesk = null;
  this.customer = null;

  this.scanDuration = {
    mean: 2 * 60 * 1000, // ms
    dev: 0.5 * 60 * 1000 // ms
  };

  if (options && options.scanDuration) {
    var sd = options.scanDuration;
    if ('mean' in sd) this.scanDuration.mean = sd.mean;
    if ('dev' in sd)  this.scanDuration.dev  = sd.dev;
  }

  loggify(this, {prototype: 'Cashier', id: this.id});
  this.log({event: 'create', options: options});
}

// extend the actors.Actor prototype
Cashier.prototype = Object.create(actors.Actor.prototype);
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

    me.tell(customer.id, 'hello')
        // scan the goods
        .then(function () {
          var scanDuration = chance.normal(me.scanDuration);
          // TODO: reckon with the number of goods in calculating the duration

          me.log({event: 'scan', customer: customer.id, goods: customer.groceries});
          //return util.delay(scanDuration, timer) // TODO: delay
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

        .tell('bye')

        .then(function () {
          me.customer = null;

          me.log({event: 'bye', customer: customer.id});

          resolve();
        });
  })
};

module.exports = Cashier;
