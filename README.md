# deep-key

[![Build Status](https://travis-ci.org/retorillo/deep-key.svg?branch=master)](https://travis-ci.org/retorillo/deep-key)
[![Coverage Status](https://coveralls.io/repos/github/retorillo/deep-key/badge.svg?branch=master)](https://coveralls.io/github/retorillo/deep-key?branch=master)
[![Dependency Status](https://gemnasium.com/badges/github.com/retorillo/deep-key.svg)](https://gemnasium.com/github.com/retorillo/deep-key)
[![NPM](https://img.shields.io/npm/v/deep-key.svg)](https://www.npmjs.com/package/deep-key)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

"Deep Key" is single dimentional array of keys that represents full path of
object member. Similar to key of object (Object.keys) but "deep" key. Provides
recursive access to object member.

```javascript
const DeepKey = require('deep-key');
var obj = { p1: { p2: { p3: { p4: 0 } } } };
DeepKey.keys(obj);
// [ ['p1'], ['p1', 'p2'], ['p1', 'p2', 'p3'] ... ]
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

##### all

`all` option allows to get all member enumeration including unenumerable members. 

```javascript
var obj = { enum: 'e', };
Object.defineProperty(obj, 'unenum', { value: 'u' });
obj.propertyIsEnumerable('unenum');
// false
DeepKeys.keys(obj);
// [ ['enum'] ]
DeepKeys.keys(obj, { all: true });
// [ ['enum'], ['unenum'] ]
```

##### depth

`depth` option allows to limit enumeration by depth.

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

`filter` option allows to limit enumeration by your custom function.

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

For each member, `filter` function is called back by passing the following three arguments:

- `deepkey` : deep key of member
- `value` : value of member that is pointed by `deepkey`
- `enumerable` : whether member is enumerable (`propertyIsEnumerable`)

`filter` function must return `true` in order to include in enumeration,
`false` otherwise.

If merely want to specify `filter` option, can directly pass into second
argument in place of `option`.

```javascript
DeepKey.keys(obj, filter);
```

##### noindex

`noindex` option allows to suppress index-enumeration of `Array`.

In JavaScript world, `Array` is also object-type and its indexes are `keys` of object. 

> An Array object is an exotic object that gives special treatment to array index property keys
> ([ES6 9.4.2](http://www.ecma-international.org/ecma-262/6.0/#sec-array-exotic-objects))

Try the following code:

```javascript
typeof [];
// 'object'
Object.keys(['one', 'two', 'three']);
// [ '0', '1', '2' ]
```

Therefore, `keys` of this package also enumerate keys of `Array` by default.
In most case, this behavior is an undesirable overboundance.
`noindex` option can suppress this.

**NOTE:** `Array` is also extensible. Note that its extended member will be
always enumerated, regardless of `noindex` option.

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

Create object member that is pointed by deep key if does not exist. Similar to
`set` method, but value never be changed if member already exist.

For initial value of new member, third argument `value` is used if present,
otherwise `undefined` is used.

```javascript
DeepKey.touch(obj, deepkey);
DeepKey.touch(obj, deepkey, value);
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

Whether specified member is present or not, `DeepKey` automatically overwrite
or create member recursively, therefore exception handing is not required in
most cases.

But, there are an exception that is thrown in special case.

On object tree traversing, if intermediate inextensible object is found (null,
number, string, seald object, and so on), an error `/^Inextensible object:/` be
thrown. Because such an inextensible object cannot have new extended members.

```javascript
var obj = { prop1: { prop2: 1 } };

DeepKey.set(obj, [ 'prop1', 'prop2' ], 2);
// Of course, success

DeepKey.set(obj, [ 'prop1', 'prop2', 'prop3' ], 3);
// 'Inextensible object: prop1.prop2' is thrown.
// Because value 2 of prop1.prop2 is inextensible.
```

**NOTE:** Members of exsisting intermediate sealed object can be readable and
writable because "seal" does not prevent to change value of its member.

```javascript
var obj = { { sealed: { present: false } } };
Object.seal(obj.sealed);
DeepKey.set(obj, ['sealed', 'present'], true);
DeepKey.get(obj, ['sealed', 'present']);
// true
```

## License

Distributed under the MIT license.

Copyright (C) 2016 Retorillo
