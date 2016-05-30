const DeepKey = require('../');

var array = [];
array[1] = 'item1';

var keys = DeepKey.keys(array);

console.log(keys);
