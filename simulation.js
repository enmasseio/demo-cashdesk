var eve = require('evejs');
var hypertimer = require('hypertimer');
var Emitter = require('emitter-component');

var Logger = require('./lib/Logger');
var CashDesk = require('./lib/CashDesk');
var Cashier = require('./lib/Cashier');
var Customer = require('./lib/Customer');
var Supermarket = require('./lib/Supermarket');

var simulation = {};

Emitter(simulation);

// TODO: use default eve.system.timer as soon as it's implemented in eve itself
eve.system.timer = hypertimer({rate: 'discrete'});

// TODO: use default eve.system.logger as soon as eve supports logging itself
var seq = 0;
eve.system.logger = new Logger({
  seq: function () {
    return seq++;
  },
  timestamp: function () {
    return new Date().toISOString();
  },
  simTime: function () {
    return eve.system.timer.getTime().toISOString();
  }
});

// re-emit events of the logger
eve.system.logger.on('log', function (data) {
  simulation.emit('log', data);
});

/**
 * Start the simulation
 */
simulation.start = function () {
  simulation.emit('start');
  eve.system.logger.log({event: 'start'});

  var supermarket = new Supermarket('Super & co', {cashDesks: 4});

  var cashier = new Cashier('Tamara');
  cashier.open(supermarket.cashDesks[0]);

  var customer = new Customer('Thomas');

  customer.planShopping(supermarket);
};

/**
 * Retrieve all logs
 * @returns {Array}
 */
simulation.logs = function () {
  return eve.system.logger.logs;
};

module.exports = simulation;