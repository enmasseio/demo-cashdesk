var fs = require('fs');

var eve = require('evejs');
var Emitter = require('emitter-component');

var Logger = require('./lib/Logger');
var CashDesk = require('./lib/CashDesk');
var Cashier = require('./lib/Cashier');
var Customer = require('./lib/Customer');
var Supermarket = require('./lib/Supermarket');
var util = require('./lib/util');

// names collected from http://fakenamegenerator.com/
var NAMES = String(fs.readFileSync('./data/names.txt'))
    .split('\n')
    .map(function (name) {
      return name.trim();
    });
NAMES.shift(); // first entry is the header "GivenName"

var simulation = {};

Emitter(simulation);

// configure eve
eve.system.init ({
  transports: [
    {type: 'local'}
  ],
  timer: {
    rate: 'discrete',
    deterministic: true
  },
  random: {
    deterministic: true
  }
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
  var name = NAMES[Math.floor(eve.system.random() * NAMES.length)];
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

  var startTime = new Date().toISOString();
  var customerCount = config && config.customers  || 10;
  var cashierCount  = config && config.cashiers   || 2;
  var weeks         = config && config.weeks      || 8;
  var strategy      = config && config.strategy   || 'random';

  eve.system.logger.log({
    event: 'start',
    cashiers: cashierCount,
    customers: customerCount,
    weeks: weeks,
    strategy: strategy
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
    var mean = Math.round(2 + 8 * eve.system.random()) * 1000; // ms
    var cashier = new Cashier(name, {
      scanDuration: {
        mean: mean,   // ms
        dev: mean / 2 // ms
      }
    });
    cashiers[name] = cashier;
    all[name] = cashier;

    cashier.open(supermarket.cashDesks[i]);
  }

  // keep track on how many customers are still running
  var busyCustomers = customerCount;
  function done() {
    busyCustomers--;
    if (busyCustomers <= 0) {
      eve.system.logger.log({event: 'end'});

      if (config.results !== false) {
        // write a document with the simulation results
        mkdirSync('results');
        var results = {
          startTime: startTime,
          cashierCount: cashierCount,
          customerCount: customerCount,
          weeks: weeks,
          strategy: strategy,
          summary: null,
          cashiers: Object.keys(cashiers).map(function (id) {
            return cashiers[id].toJSON()
          }),
          customers: []
        };
        for (var id in customers) {
          if (customers.hasOwnProperty(id)) {
            results.customers.push(customers[id].getStats());
          }
        }

        results.summary = util.stats(results.customers.map(function (customer) {
          return {
            collect: customer.durations.collect.mean,
            queue: customer.durations.queue.mean,
            scan: customer.durations.scan.mean,
            pay: customer.durations.pay.mean,
            total: customer.durations.total.mean
          }
        }));

        var name = './results/' + startTime + '.json';
        fs.writeFileSync(name, JSON.stringify(results, null, 2));
      }
    }
  }

  // create customers
  var customers = {};
  for (i = 0; i < customerCount; i++) {
    name = getUniqueName(all);
    var customer = new Customer(name, {
      weeks: weeks,
      //groceries: Math.round(10 + 10 * eve.system.random())
      groceries: 10,
      strategy: config.strategy,
      explorationRate: 0.1
    });
    customer.on('done', done);
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

// http://stackoverflow.com/a/24311711/1262753
function mkdirSync(path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}

module.exports = simulation;
