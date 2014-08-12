var moment = require('moment');
var timer = require('./lib/timer');
var CashDesk = require('./lib/CashDesk');
var Cashier = require('./lib/Cashier');
var Customer = require('./lib/Customer');
var Supermarket = require('./lib/Supermarket');

var supermarket = new Supermarket('Super & co', {cashDesks: 4});

var cashier = new Cashier('Tamara');
cashier.open(supermarket.cashDesks[0]);

var customer = new Customer('Thomas');

customer.planShopping(supermarket);
