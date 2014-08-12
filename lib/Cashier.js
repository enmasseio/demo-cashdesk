var Promise = require('promise');
var chance = require('chance');
var loggify = require('./loggify');
var timer = require('./timer');

/**
 * Cashier
 * @param {string} name
 * @param {{scanDuration: {mean: number, dev: number}}} options
 * @constructor
 */
function Cashier (name, options) {
  this.name = name;
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

  loggify(this, {prototype: 'Cashier', name: this.name});
  this.log({event: 'create', options: options});
}

/**
 * Open a cash desk, start working
 * @param {CashDesk} cashDesk
 */
Cashier.prototype.open = function (cashDesk) {
  this.log({event: 'open', cashDesk: cashDesk.name});

  this.cashDesk = cashDesk;
  this.cashDesk.open(this);

  this.cashDesk.on('queue', this.next.bind(this));
};

/**
 * Close the cash desk, stop working
 */
Cashier.prototype.close = function () {
  if (this.cashDesk) {
    this.log({event: 'close', cashDesk: this.cashDesk.name});

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
    me.log({event: 'checkout', customer: customer.name});

    var scanDuration = chance.normal(me.scanDuration);
    // TODO: reckon with the number of goods in calculating the duration

    // start scanning...
    timer.setTimeout(function () {
      var amount = 0; // TODO: calculate a realistic amount to pay

      // TODO: solve this by sending messages between two Actors, much more fun!
      customer.pay(amount, function () {
        me.customer = null;
        resolve();
      });
    }, scanDuration);
  })
};

module.exports = Cashier;
