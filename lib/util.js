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
 * Resolve a promise after a delay
 * @param {hypertimer} timer
 * @param {number} duration   Duration of the delay in milliseconds
 * @returns {Promise} Returns a promise
 */
exports.delay = function (timer, duration) {
  return new Promise(function (resolve, reject) {
    timer.setTimeout(function () {
      resolve();
    }, duration);
  });
};
