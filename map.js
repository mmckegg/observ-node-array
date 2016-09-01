var nextTick = require('next-tick')
var Value = require('@mmckegg/mutant/value')

module.exports = map
function map(nodeArray, valueKeyOrFunction, rawKeyOrFunction){
  var obs = Value([])
  obs._type = 'NodeArrayMap'

  obs._raw = []
  obs._list = []

  var listeners = []
  var changing = false

  obs.getLength = function(){
    return obs._raw.length
  }

  obs.get = function(i){
    return obs._raw[i]
  }

  obs.indexOf = function(item){
    return obs._raw.indexOf(item)
  }

  obs.forEach = function(iterator, context){
    obs._raw.forEach(iterator, context)
  }

  obs.map = function(iterator, context){
    return obs._raw.map(iterator, context)
  }

  obs.flush = refresh

  if (nodeArray && nodeArray.onUpdate){
    nodeArray.onUpdate(function(diff){
      var splice = diff.map(getSpliceDiff)
      var removed = listeners.splice.apply(listeners, splice)
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
        obs._list = nodeArray._list.map(getValue)
        obs._raw = rawKeyOrFunction ? nodeArray._list.map(getRawValue) : obs._list
        obs.set(obs._list.map(resolve))
      }
      changing = false
    }
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
