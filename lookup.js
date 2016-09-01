var nextTick = require('next-tick')
var Value = require('@mmckegg/mutant/value')
var deepEqual = require('deep-equal')

module.exports = lookup
function lookup(nodeArray, indexKeyOrFunction, valueKeyOrFunction, rawKeyOrFunction){
  var obs = Value({})
  obs._list = {}
  obs._raw = {}

  obs._type = 'NodeArrayLookup'

  var listeners = []
  var keyListeners = []

  var changing = false

  obs.keys = function(){
    return Object.keys(obs._raw)
  }

  obs.get = function(i){
    return obs._raw[i]
  }

  obs.flush = refresh

  if (nodeArray && nodeArray.onUpdate){
    nodeArray.onUpdate(function(diff){
      var splice = diff.map(getSpliceDiff)
      var removed = listeners.splice.apply(listeners, splice)
      removed.forEach(invoke)

      var keySplice = diff.map(getKeySpliceDiff)
      var removed = keyListeners.splice.apply(keyListeners, keySplice)
      removed.forEach(invoke)

      changed()
    })
  }

  refresh()
  return obs



  // scoped

  function changed(){
    if (!changing){
      nextTick(refresh)
    }
    changing = true
  }

  function refresh(){
    if (changing){
      if (Array.isArray(nodeArray._list)){
        var result = {}
        var raw = {}
        var list = {}

        nodeArray._list.forEach(applyValue, {result: result, raw: raw, list: list})

        obs._list = list
        obs._raw = raw

        if (!deepEqual(obs(), result)) {
          obs.set(result)
        }
      }
      changing = false
    }
  }

  function applyValue(item){
    var key = resolve(getIndex(item))
    if (typeof key !== 'undefined'){
      var value = getValue(item)
      this.list[key] = value
      this.raw[key] = rawKeyOrFunction ? getRawValue(item) : value
      this.result[key] = resolve(value)
    }
  }

  function getIndex(item){
    return typeof indexKeyOrFunction === 'function' ?
      indexKeyOrFunction(item) :
      item != null ? item[indexKeyOrFunction] : null
  }

  function getValue(item){
    if (valueKeyOrFunction){
      return typeof valueKeyOrFunction === 'function' ?
        valueKeyOrFunction(item) :
        item != null ? item[valueKeyOrFunction] : null
    } else {
      return item
    }
  }

  function getRawValue(item){
    return typeof rawKeyOrFunction === 'function' ?
      rawKeyOrFunction(item) :
      item != null ? item[rawKeyOrFunction] : null
  }

  function getSpliceDiff(val, i){
    if (i > 1){
      return addListener(getValue(val))
    } else {
      return val
    }
  }


  function getKeySpliceDiff(val, i){
    if (i > 1){
      return addListener(getIndex(val))
    } else {
      return val
    }
  }

  function addListener(item){
    if (typeof item === 'function'){
      return item(changed)
    } else {
      return null
    }
  }

}

function resolve(value){
  if (typeof value === 'function'){
    return value()
  } else {
    return value
  }
}

function invoke(fn){
  typeof fn === 'function' && fn()
}
