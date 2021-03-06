var Promise = require('promise');
var Emitter = require('emitter-component');
var moment = require('moment');
var eve = require('evejs');
var brain = require('brain');
var math = require('mathjs');
var Chance = require('chance');

var util = require('./util');

var chance = new Chance('my seed');

var SATURDAY = 6;

var now = eve.system.timer.now; // shortcut for convenience

/**
 * Create a customer. The customer will shop every saturday for a certain
 * number of groceries
 * @param {string} id   Name of the customer
 * @param {{weeks: number, strategy: string, payDuration: {mean: number, dev: number}, grabDuration: number, groceries: number, explorationRate: number}} [params]
 * @constructor
 */
function Customer (id, params) {
  // execute super constructor function
  eve.Agent.call(this, id);

  // babblify this agent
  this.extend('babble');

  // connect to all configured transports
  this.connect(eve.system.transports.getAll());

  this.strategy = 'random'; // Strategy for choosing a cashdesk 'random' or 'predict'
  this.explorationRate = 0.1;
  this.weeks = 8; // number of weeks to do shopping on saturday
  this.shopCount = 0;
  this.history = [];

  // properties
  this.groceries = 10; // number of groceries
  this.payDuration = {
    mean: 20 * 1000, // ms
    dev: 10 * 1000   // ms
  };

  // logger
  eve.system.logger.loggify(this, {prototype: 'Customer', id: this.id});

  // optional parameters
  if (params) {
    if (params.payDuration) {
      var sd = params.payDuration;
      if (sd.mean != undefined) this.payDuration.mean = sd.mean;
      if (sd.dev  != undefined) this.payDuration.dev  = sd.dev;
    }
    if (params.groceries != undefined) this.groceries = params.groceries;
    if (params.weeks != undefined)     this.weeks     = params.weeks;
    if (params.strategy != undefined)  {
      var chooseCashDesk = STRATEGIES[params.strategy];
      if (!chooseCashDesk) {
        throw new Error('Unknown strategy "' + params.strategy + '". ' +
            'Choose from: ' + Object.keys(STRATEGIES));
      }
      this.strategy  = params.strategy;
      this.chooseCashDesk = chooseCashDesk;
    }
    if(params.explorationRate != undefined) this.explorationRate = params.explorationRate;
  }

  this.log({event: 'create', params: {weeks: this.weeks, groceries: this.groceries, payDuration: this.payDuration}});
}

// extend the eve.Agent prototype
Customer.prototype = Object.create(eve.Agent.prototype);
Customer.prototype.constructor = Customer;

Emitter(Customer.prototype);

/**
 * Plan to go shopping the first next Saturday at 11:00
 * @param {Supermarket} supermarket
 */
Customer.prototype.planShopping = function (supermarket) {
  var me = this;
  var today = moment(now());
  var nextSaturday;
  if (today.weekday() === SATURDAY) {
    nextSaturday = today.add(7, 'day');
  }
  else {
    nextSaturday = today.weekday(SATURDAY);
  }
  nextSaturday.hour(11);
  nextSaturday.minute(0);
  nextSaturday.second(0);
  nextSaturday.millisecond(0);

  this.log({event: 'plan', date: nextSaturday.toISOString(), supermarket: supermarket.id});

  eve.system.timer.setTrigger(function () {
    me.shop(supermarket)
        .then(function () {
          me.shopCount++;
          if (me.shopCount < me.weeks) {
            me.planShopping(supermarket);
          }
          else {
            me.log({event: 'done', stats: me.getStats()});
            me.emit('done');
          }
        })
        .catch(function (err) {
          console.log('Error', err);
        });
  }, nextSaturday.toDate())
};

// strategies for selecting a cashDesk
var STRATEGIES = {
  /**
   * Randomly pick a CashDesk
   * @param {Array.<CashDesk>} cashDesks
   * @returns {CashDesk} The chosen cash desk
   */
  random: function (cashDesks) {
    return util.pickRandom(cashDesks);
  },

  /**
   * Pick the CashDesk with the shortest queue
   * @param {Array.<CashDesk>} cashDesks
   * @returns {CashDesk} The chosen cash desk
   */
  queueLength: function (cashDesks) {
    var sorted = [].concat(cashDesks);
    sorted.sort(function (a, b) {
      return a.queue.length > b.queue.length;
    });

    return sorted[0];
  },

  // FIXME: predict doesn't work (it does something but not what it should do)
  predict: function (cashDesks) {
    // create a map with the names of all cashiers, each having a value between 0 and 1
    var cashierValues = {};
    this.history.forEach(function (entry) {
      cashierValues[entry.cashier] = 0;
    });
    var ids = Object.keys(cashierValues);
    if (ids.length) {
      ids.forEach(function (id, index) {
        cashierValues[id] = index / ids.length
      });
    }

    // calculate normalized durations
    var durationNormalizer = util.normalizer(this.history.map(function (entry) {
      return entry.durations.queue + entry.durations.scan;
    }));

    // calculate normalized queue lengths
    var queueNormalizer = util.normalizer(this.history.map(function (entry) {
      return entry.queue;
    }));

    // normalize the history data
    var history = this.history.map(function (entry) {
      return {
        input: {
          cashier: cashierValues[entry.cashier],
          queue: queueNormalizer.normalize(entry.queue)
        },
        output: {
          duration: durationNormalizer.normalize(
              entry.durations.queue + entry.durations.scan)
        }
      };
    });

    if (history.length > 2 && eve.system.random() > this.explorationRate) {
      // train the network with all history
      var net = new brain.NeuralNetwork();
      net.train(history);

      // predict duration of each of the cashdesks, choose the shortest one
      var best = cashDesks.reduce(function (best, cashDesk, index) {
        var id = cashDesk.cashier.id;
        var prediction = net.run({
          cashier: cashierValues[id] || 0,
          queue: queueNormalizer.normalize(cashDesk.queue.length)
        });
        var duration = durationNormalizer.denormalize(prediction.duration);

        if (!best || duration < best.duration) {
          // we have a new best
          return {
            id: id,
            index: index,
            duration: duration,
            cashDesk: cashDesk
          }
        }
        else {
          return best;
        }
      }, null);

      return best.cashDesk;
    }
    else {
      // no history, choose a random CashDesk
      return STRATEGIES.random(cashDesks);
    }
  }
};

/**
 * Randomly select a CashDesk from a list of CashDesks.
 * @param {CashDesk[]} cashDesks
 * @returns {CashDesk} Returns the chosen CashDesk
 */
Customer.prototype.chooseCashDesk = STRATEGIES.random;

var actionCount = 0;

/**
 * Go shopping:
 * - collect the groceries
 * - enter the queue of one of the cash desks
 * - wait until the groceries are scanned
 * - pay for the groceries
 * - leave the cash desk
 * @param {Supermarket} supermarket
 * @return {Promise} returns a promise which resolves when shopping is finished.
 */
Customer.prototype.shop = function (supermarket) {
  var me = this;
  var start = now();
  var durations = {};
  var actionId = actionCount++;

  this.log({event: 'shop-start', supermarket: supermarket.id, actionId: actionId});

  return this.grabGroceries()
      .then(function () {
        return new Promise(function (resolve, reject) {
          durations.collect = now() - start;

          // pick one of the open cash desks and enter the queue
          var cashDesk = me.chooseCashDesk(supermarket.openCashDesks());
          var queueStart = now();
          var queueLength = cashDesk.queue.length; // queue length on enter
          var scanStart;
          var payStart;
          var amount;

          // start listening for a greeting from the cashier
          me.listenOnce('hello', function (message, context) {
                me.log({'event': 'checkout'});
                durations.queue = now() - queueStart;
                scanStart = now();
              })

              // wait until the cashier has finished scanning
              .listen(function (response, context) {
                // FIXME: scan duration is almost always zero
                durations.scan = now() - scanStart;

                // response is something like '20 bitcoin please'
                amount = parseFloat(response);
              })

              // do the payment
              .then(function (response, context) {
                payStart = now();
                return me.pay(amount);
              })
              .tell(function (response, context) {
                durations.pay = now() - payStart;

                // respond with the amount, simulating handing over the money
                return amount;
              })

              // await a bye message, then leave the cash desk
              .listen(function (message, context) { // message will be 'bye'
                me.log({event: 'queue-leave', cashDesk: cashDesk.id});
                cashDesk.leave(me);
                durations.total = now() - start;

                me.history.push({
                  cashier: cashDesk.cashier.id,
                  queue: queueLength,
                  durations: durations
                });

                me.log({event: 'shop-end', actionId: actionId, durations: durations});

                resolve(); // end shopping
              });

          me.log({event: 'queue-enter', cashDesk: cashDesk.id});
          cashDesk.enter(me);
        });
      });
};

/**
 * Simulate collecting the groceries
 * @return {Promise} returns a promise which resolves when collecting is finished.
 */
Customer.prototype.grabGroceries = function () {
  var me = this;
  var duration = this.groceries * 50 * 1000; //ms
  me.log({event: 'collect-start', groceries: me.groceries});

  return util.delay(duration)
      .then(function () {
        me.log({event: 'collect-end', groceries: me.groceries, duration: duration});
      })
};

/**
 * Simulate paying for the groceries
 * @param {number} amount
 * @return {Promise} returns a promise which resolves when paying is finished.
 */
Customer.prototype.pay = function (amount) {
  var me = this;
  var duration = Math.max(Math.round(chance.normal(me.payDuration)), 30000); // ms
  me.log({event: 'pay-start', amount: amount});

  return util.delay(duration)
      .then(function () {
        me.log({event: 'pay-end', amount: amount, duration: duration});
      })
};

/**
 * Calculate shopping stats
 * @return {Object}
 */
Customer.prototype.getStats = function () {
  var stats = {
    props: this.toJSON()
  };

  stats.cashiers = this.history.reduce(function (cashiers, entry) {
    cashiers[entry.cashier] = cashiers[entry.cashier] + 1 || 1;
    return cashiers;
  }, {});

  stats.durations = util.stats(this.history.map(function (entry) {
    return entry.durations;
  }));

  stats.history = this.history;

  return stats;
};

/**
 * Get a JSON representation of the customer
 */
Customer.prototype.toJSON = function () {
  return {
    id: this.id,
    strategy: this.strategy,
    shopCount: this.shopCount,
    groceries: this.groceries,
    payDuration: this.payDuration
  };
};

module.exports = Customer;
