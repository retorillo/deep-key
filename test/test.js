'use strict';
const DeepKey = require('../');
const should = require('should');

// JSON.stringify cannnot output:
// - Members which value is undefined although its key exists.
// - Extended members of array.
// Use the following method alternatively, not a JSON,
// but useful for diagnose entire object keys and values.
// NOTE: should.be.deepEql cannot check unenumerable members
// eg.
// var a = [], b = [];
// Object.defineProperty(a, ...); 
// should(a).eql(b)
function exactStringify(obj) {
  if (obj === undefined) return 'undefined';
  else if (obj === null) return 'null';
  else if (typeof(obj) === 'number') return obj.toString();
  else if (typeof(obj) === 'object') {
    var str = [ '{' ];
    for (var k of Object.getOwnPropertyNames(obj)) {
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

const sources = {
  'keys()' : {
    'Without any options': {
      method: DeepKey.keys,
      input: [{ shallow: { deep: { deeper1: {}, deeper2: { deepest: undefined } } } }],
      expect: [
         ['shallow'],
         ['shallow', 'deep'],
         ['shallow', 'deep', 'deeper1'],
         ['shallow', 'deep', 'deeper2'],
         ['shallow', 'deep', 'deeper2', 'deepest'],
      ],
    },
    'With "all" option': {
      method: () => {
        var obj = {};
        Object.defineProperty(obj, 'p1', { value: {} });
        Object.defineProperty(obj.p1, 'p2', { value: 'test' });
        return DeepKey.keys(obj, { all: true });
      },
      input: [ ],
      expect: [
         ['p1'],
         ['p1', 'p2'],
      ],
    },
    'With "depth" option': {
      method: DeepKey.keys,
      input: [{ shallow: { deep: { deeper1: {}, deeper2: { deepest: 0 } } } }, 2],
      expect: [
         ['shallow'],
         ['shallow', 'deep'],
         // ['shallow', 'deep', 'deeper1'],
         // ['shallow', 'deep', 'deeper2'],
         // ['shallow', 'deep', 'deeper2', 'deepest'],
      ],
    },
    'With "filter" option' : {
      method: DeepKey.keys,
      input: [{ shallow: { deep: { exclude: {}, deeper: { exclude: { deepest: 1 } } } } }, {
      filter: (deepkey, value) => { return !/exclude/.test(deepkey.join('.'));  } }],
      expect: [
         ['shallow'],
         ['shallow', 'deep'],
         ['shallow', 'deep', 'deeper'],
      ],
    },
    'With "filter" an "all" options': {
      method: (obj, option) => {
        Object.defineProperty(obj, 'unenum', { value: 'u' });
        return DeepKey.keys(obj, option);
      },
      input: [ { enumerable: 'e' }, {
          all: true,
          filter: (deepkey, value, enumerable) => { return !enumerable },
        }],
      expect: [ ['unenum'], ],
    },
    'With "noindex" option' : {
      it: 'With "noindex" option',
      method: (obj, option) => {
        obj.shallow.deep.array1.memberOfArray = 0;
        return DeepKey.keys(obj, option);
      },
      input: [{ shallow: { deep: { array1: [1,2,3], deeper: { array2: [1,2,3]} } } },
        { noindex: true  }],
      expect: [
         ['shallow'],
         ['shallow', 'deep'],
         ['shallow', 'deep', 'array1'],
         ['shallow', 'deep', 'array1', 'memberOfArray'],
         ['shallow', 'deep', 'deeper'],
         ['shallow', 'deep', 'deeper', 'array2'],
      ],
    },
  },
  'set()' : {
    'Set value via deep-key': {
      method: (obj, deepkey, val) => { DeepKey.set(obj, deepkey, val); return obj; },
      input: [ {}, ['shallow', 'deep'], undefined ],
      expect: { shallow: { deep: undefined } },
    },
    'Set value via accessor': {
      method: (obj, deepkey, val) => { DeepKey.accessor(obj, deepkey).set(val); return obj;  },
      input: [ {}, ['shallow', 'deep'], 'value' ],
      expect: { shallow: { deep: 'value' } },
    },
  },
  'get()' : {
    'Get value via deep key': {
      method: DeepKey.get,
      input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
      expect: 'value',
    },
    'Get value via accessor': {
      method: (obj, deepkey) => { return DeepKey.accessor(obj, deepkey).get();  },
      input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
      expect: 'value',
    },
  },
  'touch()': {
    'For non-empty object': {
      method: (obj, deepkeys) => { for (var k of deepkeys) DeepKey.touch(obj, k); return obj  },
      input: [ { s1: { d1: 'd1' }  }, [
        [ 's1' ],
        [ 's1', 'd1' ],
        [ 's1', 'd2' ],
        [ 's2', 'd3' ]
      ]],
      expect: { s1: { d1: 'd1', d2: undefined }, s2: { d3: undefined } },
    },
    'For empty object': {
      input: [ { }, [
        [ 's1' ],
        [ 's1', 'd1' ],
        [ 's1', 'd2' ],
        [ 's2', 'd3' ]
      ]],
      expect: { s1: { d1: undefined, d2: undefined }, s2: { d3: undefined } },
    },
    'Never overwrite': {
      method: (obj, deepkey, value) => { DeepKey.touch(obj, deepkey, value); return obj; },
      input: [ { s1: { d1: { d2: { d3: 'poor' } } } },
         ['s1', 'd1', 'd2', 'd3' ] , 'awesome'],
      expect: { s1: { d1: { d2: { d3: 'poor' } } } },
    },
    'Must overwrite': {
      input: [ { s1: { d1: { d2: {} } } },
         ['s1', 'd1', 'd2', 'd3' ] , 'awesome'],
      expect: { s1: { d1: { d2: { d3: 'awesome' } } } },
    },
  },
  'exists()': {
    'Check existence': {
      method: DeepKey.exists,
      input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
      expect: true,
    },
    'Check non-existence': {
      method: DeepKey.exists,
      input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'none'] ],
      expect: false,
    },
  },
  'delete()': {
    'Delete key': {
      method: (obj, deepkey) => { DeepKey.delete(obj, deepkey); return obj; },
      input: [ { shallow: { deep: { deepest: 'value' } } } , ['shallow', 'deep', 'deepest'] ],
      expect: { shallow: { deep: { } } },
    },
  },
  'rename()': {
    'Rename key': {
      method: (obj, curkey, newkey) => { DeepKey.rename(obj, curkey, newkey); return obj; },
      input: [ { shallow: { deep: { deepest: 'value' } } } ,
        ['shallow', 'deep'], [ 'shallow', 'newdeep'] ],
      expect: { shallow: { newdeep: { deepest: 'value' } } },
    },
  },
  'misc': {
    'Handling inextensible object': {
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
      expect: 'Inextensible object: shallow.deep',
    },
    'Existing members of sealed object must be readable and writable': {
      method: () => {
        var obj = { };
        obj.shallow = { };
        obj.shallow.sealedObj = { read: 'unexpect' };
        Object.seal(obj.shallow);
        Object.seal(obj.shallow.sealedObj);
        DeepKey.set(obj, [ 'shallow', 'sealedObj', 'read' ], 'valueOfSealedObject');
        return DeepKey.get(obj, [ 'shallow', 'sealedObj', 'read' ]);
      },
      input: [],
      expect: 'valueOfSealedObject',
    },
    'Sealed object must throw error when trying to extend': {
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
      expect: 'Inextensible object: shallow.sealedObj',
    },
    'Readonly property must throw error': {
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
      expect: /^TypeError:/,
    },
  }
}

for (let d in sources) {
  let T = sources[d];
  let lastm = null;
  describe(d, () => {
    for (let i in T) {
      let t = T[i];
      it(i, () => {
        lastm = t.method || lastm;
        if (!lastm)
          throw new Error('Test method is undefined');
        t.output = lastm.apply(this, t.input);
        if (typeof(t.output) === 'string' && t.expect instanceof RegExp)
          should(t.output).be.match(t.expect);
        else
          should(exactStringify(t.output)).be.eql(exactStringify(t.expect));
      });
    }
  });
}
