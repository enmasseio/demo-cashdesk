var Emitter = require('emitter-component');
var loggify = require('./loggify');

/**
 * CashDesk
 * @param {string} name  A name or number for the cashdesk
 * @constructor
 */
function CashDesk(name) {
  this.name = name;

  /** @type Cashier */
  this.cashier = null;

  /** @type {Array.<Customer>} */
  this.queue = [];

  // make the CashDesk loggable
  loggify(this, {prototype: 'CashDesk', name: this.name});
  this.log({event: 'create'});
}

// turn the CashDesk into an event emitter
// TODO: use pubsub instead of an event emitter?
Emitter(CashDesk.prototype);

/**
 * Open the cash desk
 * @param {Cashier} cashier
 */
CashDesk.prototype.open = function (cashier) {
  this.cashier = cashier;

  this.emit('open');
  this.log({event: 'open', cashier: cashier.name});
};

/**
 * Close the cash desk
 */
CashDesk.prototype.close = function() {
  this.cashier = null;

  this.emit('close');
  this.log({event: 'close'});
};

/**
 * Check whether the cash desk is open
 * @returns {boolean} Returns true when open, else returns false
 */
CashDesk.prototype.isOpen = function () {
  return (this.cashier != null);
};

/**
 * Add a customer to the queue
 * @param {Customer} customer
 */
CashDesk.prototype.enter = function (customer) {
  this.queue.push(customer);

  this.emit('queue');

  this.log({
    event: 'queue',
    action: 'enter',
    customer: customer.name,
    queue: this.queue.map(function (customer) {
      return customer.name;
    })
  });
};

/**
 * Remove a customer from the queue
 * @param {Customer} customer
 */
CashDesk.prototype.leave = function (customer) {
  console.log('leave')
  var index = this.queue.indexOf(customer);
  if (index !== -1) {
    this.queue.splice(index, 1);
    this.emit('queue');

    this.log({
      event: 'queue',
      action: 'leave',
      customer: customer.name,
      queue: this.queue.map(function (customer) {
        return customer.name;
      })
    });
  }
};

module.exports = CashDesk;
