var CashDesk = require('./CashDesk');
var eve = require('evejs');

/**
 * A Supermarket contains a series of cash desks.
 * @param {string} id     Name of the supermarket
 * @param {Object} params   Available params:
 *                          - `cashDesks` the number of cash desks
 *                            in the supermarket. Optional, 6 by default.
 *                          - `logger` a Logger.
 * @constructor
 */
function Supermarket(id, params) {
  this.id = id;
  this.cashDesks = [];

  // make the Supermarket loggable
  eve.system.logger.loggify(this, {prototype: 'Supermarket', id: this.id});

  // create cash desks
  var num = params.cashDesks || 6;
  for (var i = 0; i < num; i++) {
    this.cashDesks.push(new CashDesk(i + 1, {logger: params.logger}));
  }

  this.log({event: 'create', cashDesks: this.cashDesks.length});
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
