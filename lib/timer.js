var hypertimer = require('hypertimer');

// TODO: instead of referring everywhere to this timer, pass it as a parameter to all actors

// create a hypertimer
module.exports = hypertimer({rate: 'discrete'});
