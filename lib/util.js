/**
 * Randomly pick one element value an array
 * @param array
 */
exports.pickRandom = function (array) {
  var index = Math.floor(Math.random() * array.length);
  return array[index];
};
