# deep-key

[![Build Status](https://travis-ci.org/retorillo/deep-key.svg?branch=master)](https://travis-ci.org/retorillo/deep-key)
[![NPM](https://img.shields.io/npm/v/deep-key.svg)](https://www.npmjs.com/package/deep-key)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

"Deep Key" is single dimentional array of keys that represents full path of
object member. Similar to key of object (Object.keys) but "deep" key. Provides
recursive access to object member.

```javascript
const DeepKey = require('deep-key');
var obj = { shallow: { deep: { deeper: { deepest: 0 } } } };
console.log(DeepKey.keys(obj));
// [['shallow'], ['shallow', 'deep'], ['shallow', 'deep', 'deeper'] ... ]
```

## Install

```
npm install --save deep-key
```

## Functions


### keys

Get all deep keys recursively.

```
DeepKey.keys(obj);
DeepKey.keys(obj, depth);
```

Specify `depth` to limit enumeration by depth.

```javascript
var obj = { depth1: { depth2: { depth3: { } } } }
console.log(DeepKey.keys(obj, 2));
// [ ['depth1'], ['depth1', 'depth2'] ]
```

Note that all keys will be enumerated if zero or negative value is specified for
`depth`.


### get

Get value of object member that is pointed by deep key.

```
DeepKey.get(obj, deepkey);
```

### set

Set value for object member that is pointed by deep key.

```
DeepKey.set(obj, deepkey, value);
```

Whether such a member exits or not, member is always overwritten or created. To
prevent this, use `exists` to check its existence.

### touch

Create object member that is pointed by deep key if does not exist, and set
`undefined` for its value. If already exists, value never be changed.

```
DeepKey.touch(obj, deepkey);
```

Returns value of object member.

### accessor

Get accessor of object member that is pointed by deep key.
Accessor has `get` and `set` methods.

```
DeepKey.accessor(obj, deepkey);
```

Caching accessor may be able to reduce computing cost that relates with object
tree traversing.

If there are no member that is pointed by deep key, member is automatically
created. (Initial value is `undefined`).


### delete

Remove object member that is pointed by deep key.
Equivalent to using `delete` keyword.

```
DeepKey.delete(obj, deepkey);
```

Returns value of object member that is pointed by deep key.

### rename

Rename key of object member by using current and new deep keys.

```
DeepKey.rename(obj, src, dest);
```

If member that is pointed by `src` does not exist, `undefined` is set for one of
`dest`. And, whether one of `dest` already exists or not, it will be overwritten
by one of `src`. To prevent those, use `exists` to check their existence.

Returns value of object member that is pointed by deep key.

### exists

Check existence of object member that is pointed by deep key.

```
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
var obj = { shallow: { deep: 1 } };

DeepKey.set(obj, [ 'shallow', 'deep' ], 2);
// Of course, success

DeepKey.set(obj, [ 'shallow', 'deep', 'deeper' ], 3);
// 'Inextensible object: shallow.deep' is thrown.
// Because value 2 of shallow.deep is inextensible.
// Note that Object.isExtensible(2) returns false.
```

## License

Distributed under the MIT license.

Copyright (C) 2016 Retorillo
