var NO_TRANSACTION = {}
var Observ = require('@mmckegg/mutant/value')
var Event = require('geval')
var resolveNode = require('./resolve')

module.exports = ObservNode

function ObservNode(context){
  // context: nodes, nodeKey

  var obs = Observ()
  obs.node = null

  var lastDescriptor = null
  var currentTransaction = NO_TRANSACTION

  var removeListener = null

  var broadcastNode = null
  obs.onNode = Event(function(broadcast){
    broadcastNode = broadcast
  })

  obs(function(descriptor){
    if (currentTransaction === NO_TRANSACTION){
      currentTransaction = descriptor
      updateNode(descriptor)
      currentTransaction = NO_TRANSACTION
    }
    lastDescriptor = descriptor
  })

  obs.destroy = function () {
    if (obs.node) {
      removeListener&&removeListener()

      if (obs.node.destroy){
        obs.node.destroy()
      }

      obs.node = removeListener = null
    }
  }

  return obs

  // scoped

  function updateNode(descriptor){
    var nodeName = getNode(descriptor)
    var ctor = descriptor && resolveNode(context.nodes, nodeName)
    if (obs.node && nodeName === getNode(lastDescriptor)){
      obs.node.set(descriptor)
    } else {

      var lastNode = obs.node

      if (obs.node){
        removeListener&&removeListener()

        if (obs.node.destroy){
          obs.node.destroy()
        }

        obs.node = removeListener = null
      }

      if (descriptor){
        if (typeof ctor === 'function'){
          obs.node = ctor(context)
          obs.node.nodeName = nodeName
          obs.node.set(descriptor)
          removeListener = obs.node(onUpdate)
        }
      }

      broadcastNode(obs.node)
    }
  }

  function onUpdate(){
    if (currentTransaction === NO_TRANSACTION){
      var descriptor = obs.node()
      currentTransaction = descriptor
      if (getNode(descriptor) !== getNode(lastDescriptor)){
        updateNode(descriptor)
      }

      obs.set(descriptor)
      currentTransaction = NO_TRANSACTION
    }
  }

  function getNode(value){
    return value && value[context.nodeKey||'node'] || null
  }
}
