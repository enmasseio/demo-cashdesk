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
 * @param {number} millis   Number of milliseconds for the delay
 * @param {Object} timer    An optional hypertimer
 */
exports.delay = function(millis, timer) {
  console.log('delay', millis, timer)
  return new Promise(function (resolve, reject) {
    if (timer) {
      timer.setTimeout(resolve, millis);
    }
    else {
      setTimeout(resolve, millis)
    }
  });
};
