var Promise = require('promise');

/**
 * Randomly pick one element value an array
 * @param array
 */
exports.pickRandom = function (array) {
  var index = Math.floor(Math.random() * array.length);
  return array[index];
};

/**
 * Returns a promise which resolves after the configured number of milliseconds
 * @param {hypertimer} timer  A hypertimer
 * @param {number} millis     Number of milliseconds for the delay
 */
exports.delay = function(timer, millis) {
  return new Promise(function (resolve, reject) {
    timer.setTimeout(resolve, millis);
  });
};
