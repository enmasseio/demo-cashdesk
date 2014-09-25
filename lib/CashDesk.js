var Emitter = require('emitter-component');
var eve = require('evejs');

/**
 * CashDesk
 * @param {string} id  A name or number for the cashdesk
 * @constructor
 */
function CashDesk(id) {
  this.id = id;

  /** @type Cashier */
  this.cashier = null;

  /** @type {Array.<Customer>} */
  this.queue = [];

  // make the CashDesk loggable
  eve.system.logger.loggify(this, {prototype: 'CashDesk', id: this.id});
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

  this.log({event: 'open', cashier: cashier.id});

  this.emit('open');
};

/**
 * Close the cash desk
 */
CashDesk.prototype.close = function() {
  this.cashier = null;

  this.log({event: 'close'});

  this.emit('close');
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

  this.log({
    event: 'queue-enter',
    customer: customer.id,
    queue: this.queue.map(function (customer) {
      return customer.id;
    })
  });

  this.emit('queue');
};

/**
 * Remove a customer from the queue
 * @param {Customer} customer
 */
CashDesk.prototype.leave = function (customer) {
  var index = this.queue.indexOf(customer);
  if (index !== -1) {
    this.queue.splice(index, 1);

    this.log({
      event: 'queue-leave',
      customer: customer.id,
      queue: this.queue.map(function (customer) {
        return customer.id;
      })
    });

    this.emit('queue');
  }
};

module.exports = CashDesk;
