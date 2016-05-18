'use strict';

function* iterateKeys(obj, depth) {
   if (depth == 0) return;
   for (var key of Object.keys(obj)) {
      yield [ key ];
      for (var subkeys of iterateKeys(obj[key], depth - 1)) {
         subkeys.splice(0, 0, key);
         yield subkeys;
      }
   }
}
function traverse(obj, deepkey, force) {
   var leaf = obj;
   for (var c = 0; c < deepkey.length; c++)
      if (c == deepkey.length - 1) {
         return [leaf, deepkey[c]];
      }
      else {
         if (!leaf.propertyIsEnumerable(deepkey[c]))
            if (force)
               leaf[deepkey[c]] = { };
            else
               return undefined;
         leaf = leaf[deepkey[c]];
         if (!Object.isExtensible(leaf))
            throw `Inextensible object: ${ deepkey.slice(0, c + 1).join('.') }`
      }
   return undefined;
}
function accessor(obj, deepkey) {
   var t = traverse(obj, deepkey, true);
   if (!t) return undefined;
   return {
      get: () => { return (t[0])[t[1]]; },
      set: v => { return (t[0])[t[1]] = v;  },
   }
}
function keys(obj, depth) {
   var array = [];
   for (var path of iterateKeys(obj, depth || -1))
      array.push(path);
   return array;
}
function rename(obj, src, dest) {
   return set(obj, dest, del(obj, src));
}
function del(obj, deepkey) {
   var t = traverse(obj, deepkey, false);
   if (!t) return undefined;
   var v = (t[0])[t[1]];
   delete (t[0])[t[1]];
   return v;
}
function set(obj, deepkey, value) {
   var t = traverse(obj, deepkey, true);
   return (t[0])[t[1]] = value;
}
function get(obj, deepkey) {
   var t = traverse(obj, deepkey, false);
   return t ? (t[0])[t[1]] : undefined;
}
function exists(obj, deepkey) {
   var t = traverse(obj, deepkey, false);
   return t ? t[0].propertyIsEnumerable(t[1]) : false;
}
module.exports = {
   keys: keys,
   set: set,
   get: get,
   rename: rename,
   delete: del,
   exists: exists,
   accessor: accessor,
};
