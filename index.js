var NO_TRANSACTION = {}
var Observ = require('observ')
var Event = require('geval')
var resolveNode = require('./resolve')

module.exports = ObservNodeArray

function ObservNodeArray(options){
  // options: nodes, nodeKey, maps

  var obs = Observ([])
  obs._list = []

  var removeListeners = []
  var instanceDescriptors = []
  var currentTransaction = NO_TRANSACTION

  var broadcastUpdate = null
  obs.onUpdate = Event(function(broadcast){
    broadcastUpdate = broadcast
  })

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

  obs.move = function(item, targetIndex){
    var currentIndex = obs._list.indexOf(item)
    if (~currentIndex){
      var descriptor = instanceDescriptors[currentIndex]
      var listener = removeListeners[currentIndex]

      var updates = []

      if (currentIndex < targetIndex){
        insert(targetIndex+1, item, descriptor, listener)
        remove(currentIndex)
        updates.push(
          [targetIndex+1, 0, item],
          [currentIndex, 1]
        )
      } else {
        remove(currentIndex)
        insert(targetIndex, item, descriptor, listener)
        updates.push(
          [currentIndex, 1],
          [targetIndex, 0, item]
        )
      }

      update()
      updates.forEach(broadcastUpdate)
    }
  }

  obs.remove = function(item){
    var currentIndex = obs._list.indexOf(item)
    if (~currentIndex){
      remove(currentIndex)
      update()
      broadcastUpdate([currentIndex, 1])
    }
  }

  obs.insert = function(descriptor, targetIndex){
    var nodeName = descriptor && descriptor[options.nodeKey || 'node']
    var ctor = nodeName && resolveNode(options.nodes, nodeName)
    if (ctor){
      var item = ctor(options)
      item.nodeName = nodeName
      item.set(descriptor)

      insert(targetIndex, item, descriptor)
      listen(item, targetIndex)
      update()
      broadcastUpdate([targetIndex, 0, item])
    }
  }

  obs.push = function(descriptor){
    obs.insert(descriptor, obs._list.length)
  }

  obs(function(descriptors){
    
    if (currentTransaction === descriptors){
      return false
    }

    if (!Array.isArray(descriptors)){
      descriptors = []
    }

    var length = Math.max(descriptors.length, instanceDescriptors.length) 
    for (var i=0;i<length;i++){

      var instance = obs._list[i]
      var descriptor = descriptors[i]
      var lastDescriptor = instanceDescriptors[i]

      var nodeName = descriptor[options.nodeKey || 'node']
      var ctor = descriptor && resolveNode(options.nodes, nodeName)

      if (instance && descriptor && lastDescriptor && descriptor.node == lastDescriptor.node){
        instance.set(descriptor)
      } else {

        var prevInstance = instance

        if (instance){
          unlisten(instance, i)
          instance = null
        }

        obs._list[i] = null

        if (descriptor){
          // create
          if (ctor){
            instance = ctor(options)
            instance.nodeName = nodeName
            instance.set(descriptor)
            listen(instance, i)
            obs._list[i] = instance
          }
        }

        broadcastUpdate([i, 1, instance])
      }
    }

    obs._list.length = descriptors.length
    removeListeners.length = descriptors.length
    instanceDescriptors = descriptors.slice()

  })

  return obs


  // scoped

  function listen(item, index){
    removeListeners[index] = item(function(){
      onUpdate(item)
    })
  } 

  function onUpdate(item){
    var index = obs._list.indexOf(item)
    if (~index && instanceDescriptors[index]){
      if (currentTransaction == NO_TRANSACTION){
        var oldDescriptor = instanceDescriptors[index]
        var descriptor = item()

        // ensure the node is preserved
        descriptor[options.nodeKey||'node'] = oldDescriptor[options.nodeKey||'node']
        instanceDescriptors[index] = descriptor

        var newValue = instanceDescriptors.slice()
        currentTransaction = newValue
        obs.set(newValue)
        currentTransaction = NO_TRANSACTION
      }
    }
  }

  function update(){
    var newValue = instanceDescriptors.slice()
    currentTransaction = newValue
    obs.set(newValue)
    currentTransaction = NO_TRANSACTION
  }

  function unlisten(item, index){
    if (removeListeners[index]){
      removeListeners[index]()
      removeListeners[index] = null
    }

    if (item.destroy){
      item.destroy()
    }
  }

  function remove(index){
    instanceDescriptors.splice(index, 1)
    removeListeners.splice(index, 1)
    obs._list.splice(index, 1)
  }

  function insert(index, obj, descriptor, listener){
    instanceDescriptors.splice(index, 0, descriptor)
    removeListeners.splice(index, 0, listener)
    obs._list.splice(index, 0, obj)
  }

}

