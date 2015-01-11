var nextTick = require('next-tick')
var Observ = require('observ')

module.exports = lookup
function lookup(nodeArray, indexKey, valueKey){
  var obs = Observ()
  obs._list = []

  var listeners = []
  var keyListeners = []

  var changing = false

  obs.keys = function(){
    return Object.keys(obs._list)
  }

  obs.get = function(i){
    return obs._list[i]
  }

  obs.flush = refresh

  if (nodeArray && nodeArray.onUpdate){
    nodeArray.onUpdate(function(diff){
      var splice = diff.map(getSpliceDiff)
      var removed = listeners.splice.apply(listeners, splice)
      removed.forEach(invoke)

      var keySplice = diff.map(getKeySpliceDiff)
      var removed = keyListeners.splice.apply(keyListeners, splice)
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

        nodeArray._list.forEach(applyValue, {result: result, raw: raw})

        obs._list = raw
        obs.set(result)
      }
      changing = false
    }
  }

  function applyValue(item){
    var key = item()[indexKey]
    var value = getValue(item)
    this.raw[key] = value
    this.result[key] = resolve(value)
  }

  function getValue(item){
    return valueKey ? item[valueKey] : item
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
      return addListener(val[indexKey])
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