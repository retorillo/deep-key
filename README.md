# deep-key

[![Build Status](https://travis-ci.org/retorillo/deep-key.svg?branch=master)](https://travis-ci.org/retorillo/deep-key)
[![NPM](https://img.shields.io/npm/v/deep-key.svg)](https://www.npmjs.com/package/deep-key)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

"Deep Key" is single dimentional array of keys that represents full path of
object member. Similar to key of object (Object.keys) but "deep" key. Provides
recursive access to object member.

```javascript
const DeepKey = require('deep-key');
var obj = { p1: { p2: { p3: { p4: 0 } } } };
DeepKey.keys(obj);
// [['p1'], ['p1', 'p2'], ['p1', 'p2', 'p3'] ... ]
```

## Install

```
npm install --save deep-key
```

## Functions

### keys

Get all deep keys recursively.

```javascript
DeepKey.keys(obj);
DeepKey.keys(obj, option); 
```

#### options

##### depth

Specify `depth` to limit enumeration by depth.

```javascript
var obj = { prop1: { prop2: { prop3: { } } } }
console.log(DeepKey.keys(obj, { depth: 2 }));
// [ ['prop1'], ['prop1', 'prop2'] ]
```

If merely want to specify `depth` option, can directly pass into second argument
in place of `option`.

```javascript
DeepKey.keys(obj, depth);
```

Note that all keys will be enumerated if zero or negative value is specified for
`depth`.

##### filter

Specify `filter` to limit enumeration by your custom function.

```javascript
var obj = {
  prop1: { prop2: {} }
  prop3: { skip1: {} }, 
  prop4: 'p4', 
  skip2: 'e2' 
}

console.log(DeepKey.keys(obj, {
  filter: (deepkey, value) => { 
    return !/skip\d+/.test(deepkey.join('.'));
  }
});
// [ ['prop1'], ['prop1', 'prop2'], ['prop3'], ['prop4'] ]
```

For each member, `filter` function is called back by passing two arguments:

- `deepkey` : deep key of member
- `value` : value of member that is pointed by `deepkey`

`filter` function must return `true` in order to include in enumeration,
`false` otherwise.

If merely want to specify `filter` option, can directly pass into second
argument in place of `option`.

```javascript
DeepKey.keys(obj, filter);
```

##### noindex

Specify `noarray` to suppress index-enumeration of `Array`.

In JavaScript world, `Array` is also an object and its index is the kind of
object-key. Try the following code:

```javascript
Object.keys(['one', 'two', 'three']);
// [ '0', '1', '2' ]
```

Therefore, `keys` of this package also enumerate keys of `Array` by default.
In most case, this behavior is an undesirable overboundance.

**NOTE:** `Array` is also an extensible object. Note that its extended member,
regardless of `noindex`, will be always enumerated in constrast with index.

```javascript
var obj = { array: [1,2,3], val: 4 };
obj.array.five = 5;
DeepKey.keys(obj, { noindex: true });
// [ ['array'], ['array', 'five'], ['val'] ]
```

### get

Get value of object member that is pointed by deep key.

```javascript
DeepKey.get(obj, deepkey);
```

### set

Set value for object member that is pointed by deep key.

```javascript
DeepKey.set(obj, deepkey, value);
```

Whether such a member exits or not, member is always overwritten or created. To
prevent this, use `exists` to check its existence.

### touch

Create object member that is pointed by deep key if does not exist, and set
`undefined` for its value. If already exists, value never be changed.

```javascript
DeepKey.touch(obj, deepkey);
```

Returns value of object member.

### accessor

Get accessor of object member that is pointed by deep key.
Accessor has `get` and `set` methods.

```javascript
DeepKey.accessor(obj, deepkey);
```

Caching accessor may be able to reduce computing cost that relates with object
tree traversing.

If there are no member that is pointed by deep key, member is automatically
created. (Initial value is `undefined`).


### delete

Remove object member that is pointed by deep key.
Equivalent to using `delete` keyword.

```javascript
DeepKey.delete(obj, deepkey);
```

Returns value of object member that is pointed by deep key.

### rename

Rename key of object member by using current and new deep keys.

```javascript
DeepKey.rename(obj, src, dest);
```

If member that is pointed by `src` does not exist, `undefined` is set for one of
`dest`. And, whether one of `dest` already exists or not, it will be overwritten
by one of `src`. To prevent those, use `exists` to check their existence.

Returns value of object member that is pointed by deep key.

### exists

Check existence of object member that is pointed by deep key.

```javascript
DeepKey.exists(obj, deepkey);
```

## Handling inextensible object

Whether specified deep key is exists or not, `DeepKey` automatically overwrite
or create member recursively, therefore exception handing is not required in
most cases.

But, there are an exception that is thrown in special case.

On object tree traversing, if intermediate inextensible object is found (number,
string, seald object and so on) exception `/^Inextensible object:/` be thrown.
Because such a inextensible object cannot have its member.

```javascript
var obj = { prop1: { prop2: 1 } };

DeepKey.set(obj, [ 'prop1', 'prop2' ], 2);
// Of course, success

DeepKey.set(obj, [ 'prop1', 'prop2', 'prop3' ], 3);
// 'Inextensible object: prop1.prop2' is thrown.
// Because value 2 of prop1.prop2 is inextensible.
// Note that Object.isExtensible(2) returns false.
```

## License

Distributed under the MIT license.

Copyright (C) 2016 Retorillo
