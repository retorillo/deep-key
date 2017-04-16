'use strict';



function* iterateKeys(obj, opt, parent) {
  if (obj === null || obj === undefined)
    return;
  if (opt.depth > 0 && parent && parent.length >= opt.depth)
    return;
  if (typeof(obj) === 'string')
    return;
  parent = parent || [];
  for (var key of opt.all ? Object.getOwnPropertyNames(obj) : Object.keys(obj)) {
    if (opt.noindex && obj instanceof Array && /^[0-9]+$/.test(key))
      continue;
    var child = parent.slice(0);
    child.push(key);
    if (opt.filter && !opt.filter(child, obj[key], !opt.all || obj.propertyIsEnumerable(key)))
      continue;
    yield child;
    yield* iterateKeys(obj[key], opt, child);
  }
}
function traverse(obj, deepkey, force) {
  var leaf = obj;
  for (var c = 0; c < deepkey.length; c++)
    if (c == deepkey.length - 1) {
      return [leaf, deepkey[c]];
    }
    else {
      if (!(deepkey[c] in leaf) || leaf[deepkey[c]] === undefined) {
        if (force) {
          // if creating intermediate object, its parent must not be sealed
          if (!Object.isExtensible(leaf))
            throw `Inextensible object: ${ deepkey.slice(0, c).join('.') }`;
          leaf[deepkey[c]] = { };
        }
        else
          return undefined;
      }
      leaf = leaf[deepkey[c]];
      // intermediate object must be non-null object or function
      // note that typeof(null) returns 'object'
      if (leaf === 'null' || (typeof(leaf) !== 'object' && typeof(leaf) !== 'function')) {
        if (force)
          throw `Inextensible object: ${ deepkey.slice(0, c + 1).join('.') }`;
        else
          return undefined;
      }
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
function keys(obj, option) {
  var opt;
  if (typeof(option) === 'number')
    opt = { depth: option };
  else if (typeof(option) === 'function')
    opt = { filter: option };
  else if (typeof(option) === 'object' && option !== null)
    opt = option;
  else
    opt = {}
  opt.depth = opt.depth || 0;
  var array = [];
  for (var path of iterateKeys(obj, opt))
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
  // The following codes is unneeded, traverse will check them
  // if (!(t[1] in t[0]) && !Object.isExtensible(t[0]))
  //   throw `Inextensible object: ${ deepkey.slice(0, deepkey.length - 1).join('.') }`;
  return (t[0])[t[1]] = value;
}
function get(obj, deepkey) {
  var t = traverse(obj, deepkey, false);
  return t ? (t[0])[t[1]] : undefined;
}
function touch(obj, deepkey, value) {
  var t = traverse(obj, deepkey, true);
  if (!(t[1] in t[0])) {
    if (!Object.isExtensible(t[0]))
      throw `Inextensible object: ${ deepkey.slice(0, deepkey.length -1).join('.') }`;
    return (t[0])[t[1]] = value;
  }
  else
    return (t[0])[t[1]];
}
function type(obj, deepkey) {
  return typeof(get(obj, deepkey));
}
function exists(obj, deepkey) {
  var t = traverse(obj, deepkey, false);
  return t ? t[0].propertyIsEnumerable(t[1]) : false;
}
module.exports = {
  keys: keys,
  set: set,
  get: get,
  touch: touch,
  type: type,
  rename: rename,
  delete: del,
  exists: exists,
  accessor: accessor,
};
