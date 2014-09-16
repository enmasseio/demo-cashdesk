var eve = require('evejs');
var distribus = require('distribus');
var hypertimer = require('hypertimer');

var Logger = require('./lib/Logger');
var CashDesk = require('./lib/CashDesk');
var Cashier = require('./lib/Cashier');
var Customer = require('./lib/Customer');
var Supermarket = require('./lib/Supermarket');

var timer = hypertimer({rate: 'discrete'});

var logger = new Logger({
  realTime: function () {
    return new Date().toISOString();
  },
  simTime: function () {
    return timer.getTime().toISOString();
  }
});

var supermarket = new Supermarket('Super & co', {logger: logger, cashDesks: 4});

var cashier = new Cashier('Tamara', {logger: logger, timer: timer});
cashier.open(supermarket.cashDesks[0]);

var customer = new Customer('Thomas', {logger: logger, timer: timer});

/**
 * Start the simulation
 */
exports.start = function () {
  logger.log({event: 'start'});

  customer.planShopping(supermarket);
};

/**
 * Register a listener for log messages
 * @param {string} event Available events: 'log'
 * @param {function} callback
 */
exports.on = logger.on.bind(logger);

/**
 * Retrieve all logs
 * @returns {Array}
 */
exports.logs = function () {
  return logger.logs;
};