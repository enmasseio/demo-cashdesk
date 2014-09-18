var lodash = require('lodash');
var Emitter = require('emitter-component');

/**
 * Logger
 * @param {Object} [defaultParams]   An object with fields which will be added
 *                                   to every log. When a field is a function,
 *                                   the function is executed and the output
 *                                   is logged (for example current time)
 * @constructor
 */
function Logger(defaultParams) {
  this.defaultParams = defaultParams || {};
  this.logs = [];
}

Emitter(Logger.prototype);

/**
 * Log an event.
 * @param {Object} params
 */
Logger.prototype.log = function (params) {
  try {
    var log = {};
    for (var key in this.defaultParams) {
      if (this.defaultParams.hasOwnProperty(key)) {
        var param = this.defaultParams[key];
        log[key] = (typeof param === 'function') ? param() : param;
      }
    }

    lodash.merge(log, params);

    this.logs.push(log);

    this.emit('log', log);
  }
  catch (err) {
    console.log('Error', err);
  }
};

/**
 * Extend an object with loggable functions
 * @param {Object} object
 * @param {Object} [defaultParams] Optional default parameters added to the logs
 * @constructor
 */
Logger.prototype.loggify = function (object, defaultParams) {
  var me = this;
  var _staticParams = defaultParams || {};
  object.log = function (params) {
    me.log(lodash.merge({}, _staticParams, params));
  }
};

// TODO: allow all parameters to be a function

module.exports = Logger;
