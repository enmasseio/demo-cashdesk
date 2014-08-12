var lodash = require('lodash');
var timer = require('./timer');

/**
 * Extend an object with loggable functions
 * @param {Object} object
 * @param {Object} [staticParams] Optional static fields added to the logs
 * @constructor
 */
function loggify(object, staticParams) {
  object.log = function (params) {
    try {
      var log = lodash.merge({
        realTime: new Date().toISOString(),
        simTime: timer.getTime().toISOString()
      }, staticParams, params);

      loggify.logs.push(log);

      console.log(JSON.stringify(log));
    }
    catch (err) {
      console.log('Error', err);
    }
  }
}

loggify.logs = []; // all gathered logs

module.exports = loggify;
