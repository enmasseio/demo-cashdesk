var loggify = require('./loggify');
var CashDesk = require('./CashDesk');

/**
 * A SuperMarket contains a series of cash desks.
 * @param {string} id     Name of the supermarket
 * @param {{cashDesks: number}} [options] Available options:
 *                                        - `cashDesks` the number of cash desks
 *                                          in the supermarket. 6 by default.
 * @constructor
 */
function Supermarket(id, options) {
  this.id = id;
  this.cashDesks = [];

  // make the CashDesk loggable
  loggify(this, {prototype: 'Supermarket', id: this.id});
  this.log({event: 'create'});

  var num = options && options.cashDesks || 6;
  for (var i = 0; i < num; i++) {
    this.cashDesks.push(new CashDesk(i + 1));
  }
}

/**
 * Get a list with all open cash desks
 * @return {CashDesk[]} Returns an Array with open cash desks
 */
Supermarket.prototype.openCashDesks = function () {
  return this.cashDesks.filter(function (cashDesk) {
    return cashDesk.isOpen();
  })
};

module.exports = Supermarket;
