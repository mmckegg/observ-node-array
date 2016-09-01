var Event = require('geval')
var Value = require('@mmckegg/mutant/value')
var watch = require('@mmckegg/mutant/watch')

module.exports = first

var NO_TRANSACTION = {}

function first(nodeArray){
  var obs = Value()
  obs._type = 'SingleNode'

  var release = null
  var releaseObject = null
  var currentTransaction = NO_TRANSACTION
  var instance = null

  if (handleUpdate.onUpdate){
    release = nodeArray.onUpdate(handleUpdate)
  } else {
    release = nodeArray(handleUpdate)
  }


  var broadcastUpdate = null
  obs.onUpdate = Event(function(broadcast){
    broadcastUpdate = broadcast
  })

  obs.get = function(){
    return instance
  }

  obs.destroy = function(){
    release&&release()
    releaseObject&&releaseObject()
    release = releaseObject = null
  }

  obs(function(data){
    if (instance){
      currentTransaction = data
      instance.set(data)
      currentTransaction = NO_TRANSACTION
    }
  })

  handleUpdate()

  return obs

  // scoped

  function handleUpdate(){
    var next = nodeArray.get(0)
    if (instance !== next){

      releaseObject&&releaseObject()
      instance = next

      if (instance){
        releaseObject = watch(instance, handleInnerChange)
      }

      broadcastUpdate(instance)
    }
  }

  function handleInnerChange(data){
    if (currentTransaction === NO_TRANSACTION){
      obs.set(data)
    }
  }
}
