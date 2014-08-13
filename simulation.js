var actors = require('simple-actors');
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
logger.on('log', function (log) {
  console.log(JSON.stringify(log))
});

var host = new distribus.Host();
var messagebus = new actors.DistribusMessageBus({
  host: host
});

var supermarket = new Supermarket('Super & co', {logger: logger, cashDesks: 4});

var cashier = new Cashier('Tamara', {logger: logger, timer: timer});
cashier.connect(messagebus);
cashier.open(supermarket.cashDesks[0]);

var customer = new Customer('Thomas', {logger: logger, timer: timer});
customer.connect(messagebus);

customer.planShopping(supermarket);
