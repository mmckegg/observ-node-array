var nextTick = require('next-tick')
var Observ = require('observ')

module.exports = map
function map(nodeArray, valueKey){
  var obs = Observ()
  obs._list = []

  var listeners = []
  var changing = false

  obs.getLength = function(){
    return obs._list.length
  }

  obs.get = function(i){
    return obs._list[i]
  }

  obs.indexOf = function(item){
    return obs._list.indexOf(item)
  }

  obs.forEach = function(iterator, context){
    obs._list.forEach(iterator, context)
  }

  obs.map = function(iterator, context){
    return obs._list.map(iterator, context)
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
        obs.set(obs._list.map(resolve))
      }
      changing = false
    }
  }

  function getValue(item){
    return item[valueKey]
  }

  function getSpliceDiff(val, i){
    if (i > 1){
      return addListener(val[valueKey])
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