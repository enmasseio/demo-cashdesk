var fs = require('fs');

var eve = require('evejs');
var hypertimer = require('hypertimer');
var Emitter = require('emitter-component');
var seed = require('seed-random');

var Logger = require('./lib/Logger');
var CashDesk = require('./lib/CashDesk');
var Cashier = require('./lib/Cashier');
var Customer = require('./lib/Customer');
var Supermarket = require('./lib/Supermarket');

// names collected from http://listofrandomnames.com/
var NAMES = String(fs.readFileSync('./data/FakeNameGenerator.com_06f4692d.csv'))
    .split('\n')
    .map(function (name) {
      return name.trim();
    });
NAMES.shift(); // first entry is the header "GivenName"

var random = seed('some seed');
var simulation = {};

Emitter(simulation);

// configure eve
eve.system.init ({
  timer: {rate: 'discrete'}
});

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
 * Create a unique name
 * @param {Object} existing  An object with the existing names as key of the object.
 */
function getUniqueName(existing) {
  var name = NAMES[Math.floor(random() * NAMES.length)];
  var nameIndexed = name;
  var index = 1;
  while (nameIndexed in existing) {
    nameIndexed = name + index;
    index++;
  }
  return nameIndexed;
}

/**
 * Start the simulation
 * @param {{cashiers: number, customers: number}} config
 */
simulation.start = function (config) {
  simulation.emit('start');

  var customerCount = config && config.customers || 10;
  var cashierCount  = config && config.cashiers  || 2;

  eve.system.logger.log({
    event: 'start',
    cashiers: cashierCount,
    customers: customerCount
  });

  // create a supermarket with cashdesks
  var supermarket = new Supermarket('Super & co', {cashDesks: cashierCount});

  // create cashiers
  var i;
  var name;
  var all = {};
  var cashiers = {};
  for (i = 0; i < cashierCount; i++) {
    name = getUniqueName(all);
    var cashier = new Cashier(name);
    cashiers[name] = cashier;
    all[name] = cashier;

    cashier.open(supermarket.cashDesks[0]);
  }

  // create customers
  var customers = {};
  for (i = 0; i < customerCount; i++) {
    name = getUniqueName(all);
    var customer = new Customer(name, {
      groceries: Math.round(10 + 10 * random())
    });
    customers[name] = customer;
    all[name] = customer;

    customer.planShopping(supermarket);
  }
};

/**
 * Retrieve all logs
 * @returns {Array}
 */
simulation.logs = function () {
  return eve.system.logger.logs;
};

module.exports = simulation;