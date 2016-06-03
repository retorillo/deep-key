const DeepKey = require('../');
const assert = require('assert');

// JSON.stringify cannnot output:
// - Members which value is undefined although its key exists. 
// - Extended members of array.
// Use the following method alternatively, not a JSON, 
// but useful for diagnose entire object keys and values.
function keyBasedStringify(obj) {
  if (obj === undefined) return 'undefined';
  else if (obj === null) return 'null';
  else if (typeof(obj) === 'number') return obj.toString();
  else if (Object.isExtensible(obj)) {
    var str = [ '{' ];
    for (var k of Object.keys(obj)) {
      if (str.length > 1)
        str.push(',')
      str.push(`${k}:${keyBasedStringify(obj[k])}`);
    }
    str.push('}');
    return str.join('');
  }
  else return ["'", obj.toString().replace(/'/g, "\\'"), "'"].join('');
  // TODO: handle another metacharacters:  \n \r \t ...
}

function assertObject(object, expected, desc) {
  try {
    if (typeof(object) === 'string' && expected instanceof RegExp)
      assert(expected.test(object));
    else
      assert(keyBasedStringify(object) === keyBasedStringify(expected));

    console.log(`\x1b[36m[PASSING] ${desc}\x1b[0m`);
    console.log(`\x1b[33m RESULT: ${keyBasedStringify(object)}\x1b[0m`)
  }
  catch (e) {
    console.log(`\x1b[31m[FAILING] ${desc}\x1b[0m`)
    console.log(`\x1b[31m RESULT: ${keyBasedStringify(object)}\x1b[0m`)
    console.log(`\x1b[31m EXPECTED: ${keyBasedStringify(expected)}\x1b[0m`)
    throw e;
  }
}

console.log([`\x1b[31m`,
`NOTE: Test result is key-based non-standard format to`,
` diagnose exactly object structure.\x1b[0m`,].join(''));

var lastMethod;
[
  {
    desc: 'enumeration deep keys',
    method: DeepKey.keys,
    input: [{ shallow: { deep: { deeper1: {}, deeper2: { deepest: undefined } } } }],
    expected: [
       ['shallow'],
       ['shallow', 'deep'],
       ['shallow', 'deep', 'deeper1'],
       ['shallow', 'deep', 'deeper2'],
       ['shallow', 'deep', 'deeper2', 'deepest'],
    ],
  },
  {
    desc: 'enumeration deep keys (with depth)',
    method: DeepKey.keys,
    input: [{ shallow: { deep: { deeper1: {}, deeper2: { deepest: 0 } } } }, 2],
    expected: [
       ['shallow'],
       ['shallow', 'deep'],
       // ['shallow', 'deep', 'deeper1'],
       // ['shallow', 'deep', 'deeper2'],
       // ['shallow', 'deep', 'deeper2', 'deepest'],
    ],
  },
  {
    desc: 'enumeration deep keys (with filter)',
    method: DeepKey.keys,
    input: [{ shallow: { deep: { exclude: {}, deeper: { exclude: { deepest: 1 } } } } }, {
    filter: (deepkey, value) => { return !/exclude/.test(deepkey.join('.'));  } }],
    expected: [
       ['shallow'],
       ['shallow', 'deep'],
       ['shallow', 'deep', 'deeper'],
    ],
  },
  {
    desc: 'enumeration deep keys (with noindex)',
    method: (obj, option) => {
      obj.shallow.deep.array1.memberOfArray = 0;
      return DeepKey.keys(obj, option);
    },
    input: [{ shallow: { deep: { array1: [1,2,3], deeper: { array2: [1,2,3]} } } },
      { noindex: true  }],
    expected: [
       ['shallow'],
       ['shallow', 'deep'],
       ['shallow', 'deep', 'array1'],
       ['shallow', 'deep', 'array1', 'memberOfArray'],
       ['shallow', 'deep', 'deeper'],
       ['shallow', 'deep', 'deeper', 'array2'],
    ],
  },
  {
    desc: 'setting value via deep key',
    method: (obj, deepkey, val) => { DeepKey.set(obj, deepkey, val); return obj; },
    input: [ {}, ['shallow', 'deep'], undefined ],
    expected: { shallow: { deep: undefined } },
  },
  {
    desc: 'setting value via accessor',
    method: (obj, deepkey, val) => { DeepKey.accessor(obj, deepkey).set(val); return obj;  },
    input: [ {}, ['shallow', 'deep'], 'value' ],
    expected: { shallow: { deep: 'value' } },
  },
  {
    desc: 'getting value via deep key',
    method: DeepKey.get,
    input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
    expected: 'value',
  },
  {
    desc: 'getting value via accessor',
    method: (obj, deepkey) => { return DeepKey.accessor(obj, deepkey).get();  },
    input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
    expected: 'value',
  },
  {
    desc: 'touching members (non-empty object)',
    method: (obj, deepkeys) => { for (var k of deepkeys) DeepKey.touch(obj, k); return obj  },
    input: [ { s1: { d1: 'd1' }  }, [
      [ 's1' ],
      [ 's1', 'd1' ],
      [ 's1', 'd2' ],
      [ 's2', 'd3' ]
    ]],
    expected: { s1: { d1: 'd1', d2: undefined }, s2: { d3: undefined } },
  },
  {
    desc: 'touching members (empty object)',
    input: [ { }, [ 
      [ 's1' ], 
      [ 's1', 'd1' ],
      [ 's1', 'd2' ],
      [ 's2', 'd3' ]
    ]],
    expected: { s1: { d1: undefined, d2: undefined }, s2: { d3: undefined } },
  },
  {
    desc: 'touching member (never overwrite)',
    method: (obj, deepkey, value) => { DeepKey.touch(obj, deepkey, value); return obj; },
    input: [ { s1: { d1: { d2: { d3: 'poor' } } } },
       ['s1', 'd1', 'd2', 'd3' ] , 'awesome'],
    expected: { s1: { d1: { d2: { d3: 'poor' } } } },
  },
  {
    desc: 'touching member (must overwrite)',
    input: [ { s1: { d1: { d2: {} } } },
       ['s1', 'd1', 'd2', 'd3' ] , 'awesome'],
    expected: { s1: { d1: { d2: { d3: 'awesome' } } } },
  },
  {
    desc: 'checking existence',
    method: DeepKey.exists,
    input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
    expected: true,
  },
  {
    desc: 'checking non-existence',
    method: DeepKey.exists,
    input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'none'] ],
    expected: false,
  },
  {
    desc: 'deleting key',
    method: (obj, deepkey) => { DeepKey.delete(obj, deepkey); return obj; },
    input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
    expected: { shallow: { deep: { } } },
  },
  {
    desc: 'renaming key',
    method: (obj, curkey, newkey) => { DeepKey.rename(obj, curkey, newkey); return obj; },
    input: [ { shallow: { deep: { deepest: 'value' } } } ,
      ['shallow', 'deep'], [ 'shallow', 'newdeep'] ],
    expected: { shallow: { newdeep: { deepest: 'value' } } },
  },
  {
    desc: 'handling inextensible object',
    method: (obj, deepkey, val) => {
      try {
        DeepKey.set(obj, deepkey, val);
        return 'success'
      }
      catch (e) {
        return e;
      }
    },
    input: [ { shallow: { deep: 1 } }, ['shallow', 'deep', 'deeper'], undefined ],
    expected: 'Inextensible object: shallow.deep',
  },
  {
    desc: 'existing members of sealed object must be readable and writable',
    method: () => {
      var obj = { };
      obj.shallow = { };
      obj.shallow.sealedObj = { read: 'unexpected' };
      Object.seal(obj.shallow);
      Object.seal(obj.shallow.sealedObj);
      DeepKey.set(obj, [ 'shallow', 'sealedObj', 'read' ], 'valueOfSealedObject');
      return DeepKey.get(obj, [ 'shallow', 'sealedObj', 'read' ]);
    },
    input: [], 
    expected: 'valueOfSealedObject',
  },
  {
    desc: 'sealed object must throw error when trying to extend',
    method: () => {
      var obj = { };
      obj.shallow = { };
      obj.shallow.sealedObj = { };
      Object.seal(obj.shallow);
      Object.seal(obj.shallow.sealedObj);
      try {
        DeepKey.touch(obj, [ 'shallow', 'sealedObj', 'write' ]);
        return 'success';
      }
      catch (e) {
        return e;
      }
    },
    input: [], 
    expected: 'Inextensible object: shallow.sealedObj',
  },
  {
    desc: 'readonly property must throw error',
    method: () => {
      var obj = { };
      Object.defineProperty(obj, 'read', { value: 'read', writable: false });
      try {
        DeepKey.set(obj, [ 'read' ], 'write');
        return false;
      }
      catch (e) {
        return e.toString();
      }
    },
    input: [], 
    expected: /^TypeError:/,
  },
].forEach((testSource) =>{
  assertObject((lastMethod = testSource.method || lastMethod).apply(this,
  testSource.input), testSource.expected, testSource.desc);
});
