const DeepKey = require('../');
const assert = require('assert');

function assertObject(object, expected, desc) {
   try {
      assert(JSON.stringify(object) == JSON.stringify(expected));
   }
   catch (e) {
      console.log(`\x1b[31m[FAILED] ${desc}\x1b[0m`)
      console.log(`\x1b[31m   RESULT: ${JSON.stringify(object)}\x1b[0m`)
      console.log(`\x1b[31m EXPECTED: ${JSON.stringify(expected)}\x1b[0m`)
      throw e;
   }
}

var lastMethod;
[
   {
      desc: 'enumeration deep keys',
      method: DeepKey.keys,
      input: [{ shallow: { deep: { deeper1: {}, deeper2: { deepest: 0 } } } }],
      expected: [ 
          ['shallow'],
          ['shallow', 'deep'],
          ['shallow', 'deep', 'deeper1'],
          ['shallow', 'deep', 'deeper2'],
          ['shallow', 'deep', 'deeper2', 'deepest'],
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
].forEach((testSource) =>{
   assertObject((lastMethod = testSource.method || lastMethod).apply(this,
   testSource.input), testSource.expected, testSource.desc); 
   console.log(`\x1b[36m[PASSED] ${testSource.desc}\x1b[0m`);
});
