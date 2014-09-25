var Promise = require('promise');
var eve = require('evejs');

/**
 * Randomly pick one element value an array.
 * The random function of eve.system is used.
 * @param {Array} array
 * @return {*} Returns the picked entry
 */
exports.pickRandom = function (array) {
  var index = Math.floor(eve.system.random() * array.length);
  return array[index];
};

/**
 * Resolve a promise after a delay. The timer of eve.system is used.
 * @param {number} duration   Duration of the delay in milliseconds
 * @returns {Promise} Returns a promise
 */
exports.delay = function (duration) {
  return new Promise(function (resolve, reject) {
    eve.system.timer.setTimeout(function () {
      resolve();
    }, duration);
  });
};
