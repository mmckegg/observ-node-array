module.exports = watchNodeArray

function watchNodeArray(nodeArray, watch){
  var listeners = []

  if (nodeArray && nodeArray.forEach){
    nodeArray.forEach(addListener)
  }

  if (nodeArray && nodeArray.onUpdate){
    nodeArray.onUpdate(function(diff){
      var splice = diff.map(getSpliceDiff)
      var removed = listeners.splice.apply(listeners, splice)
      removed.forEach(invoke)
    })
  }

  return function release(){
    listeners.forEach(invoke)
    listeners.length = 0
  }

  // scoped

  function getSpliceDiff(val, i){
    if (i > 1){
      return addListener(val)
    } else {
      return val
    }
  }

  function addListener(item){
    if (typeof item === 'function'){
      return watch(item)
    } else {
      return null
    }
  }
}

function invoke(fn){
  typeof fn === 'function' && fn()
}