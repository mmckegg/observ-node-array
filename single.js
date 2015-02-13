var NO_TRANSACTION = {}
var Observ = require('observ')
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

  obs(function(descriptor){
    if (currentTransaction === NO_TRANSACTION){
      currentTransaction = descriptor
      updateNode(descriptor)
      currentTransaction = NO_TRANSACTION
    }
    lastDescriptor = descriptor
  })

  return obs

  // scoped

  function updateNode(descriptor){
    var nodeName = getNode(descriptor)
    var ctor = descriptor && resolveNode(context.nodes, nodeName)
    if (obs.node && nodeName === getNode(lastDescriptor)){
      obs.node.set(descriptor)
    } else {

      if (obs.node){
        removeListener&&removeListener()
        obs.node = removeListener = null
      }

      if (descriptor){
        if (ctor){
          obs.node = ctor(context)
          obs.node.nodeName = nodeName
          obs.node.set(descriptor)
          removeListener = obs.node(onUpdate)
        }
      }
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