var eve = require('evejs');
var hypertimer = require('hypertimer');

var Logger = require('./lib/Logger');
var CashDesk = require('./lib/CashDesk');
var Cashier = require('./lib/Cashier');
var Customer = require('./lib/Customer');
var Supermarket = require('./lib/Supermarket');

// TODO: use default eve.system.timer as soon as it's implemented in eve itself
eve.system.timer = hypertimer({rate: 'discrete'});

// TODO: use default eve.system.logger as soon as eve supports logging itself
eve.system.logger = new Logger({
  realTime: function () {
    return new Date().toISOString();
  },
  simTime: function () {
    return eve.system.timer.getTime().toISOString();
  }
});

var supermarket = new Supermarket('Super & co', {cashDesks: 4});

var cashier = new Cashier('Tamara');
cashier.open(supermarket.cashDesks[0]);

var customer = new Customer('Thomas');

/**
 * Start the simulation
 */
exports.start = function () {
  eve.system.logger.log({event: 'start'});

  customer.planShopping(supermarket);
};

/**
 * Register a listener for log messages
 * @param {string} event Available events: 'log'
 * @param {function} callback
 */
exports.on = eve.system.logger.on.bind(eve.system.logger);

/**
 * Retrieve all logs
 * @returns {Array}
 */
exports.logs = function () {
  return eve.system.logger.logs;
};