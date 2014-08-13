var actors = require('simple-actors');
var distribus = require('distribus');

var timer = require('./lib/timer');
var CashDesk = require('./lib/CashDesk');
var Cashier = require('./lib/Cashier');
var Customer = require('./lib/Customer');
var Supermarket = require('./lib/Supermarket');

var host = new distribus.Host();
var messagebus = new actors.DistribusMessageBus({
  host: host
});

var supermarket = new Supermarket('Super & co', {cashDesks: 4});

var cashier = new Cashier('Tamara');
cashier.connect(messagebus);
cashier.open(supermarket.cashDesks[0]);

var customer = new Customer('Thomas');
customer.connect(messagebus);

customer.planShopping(supermarket);
