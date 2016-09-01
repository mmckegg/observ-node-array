var NO_TRANSACTION = {}
var Value = require('@mmckegg/mutant/value')
var Event = require('geval')
var resolveNode = require('./resolve')
var deepEqual = require('deep-equal')

module.exports = ObservNodeArray

function ObservNodeArray(parentContext){
  // context: nodes, nodeKey

  var context = Object.create(parentContext)

  var obs = Value([])
  obs._type = 'NodeArray'
  obs._list = []

  context.collection = obs
  obs.context = context

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
      unlisten(item, currentIndex)
      remove(currentIndex)
      update()
      broadcastUpdate([currentIndex, 1])
    }
  }

  obs.insert = function(descriptor, targetIndex){
    var nodeName = getNode(descriptor)
    var ctor = nodeName && resolveNode(context.nodes, nodeName)
    if (typeof ctor === 'function'){
      var item = ctor(context)
      item.set(descriptor)

      insert(targetIndex, item, descriptor)
      listen(item, targetIndex)
      update()
      broadcastUpdate([targetIndex, 0, item])
      return item
    }
  }

  obs.push = function(descriptor){
    return obs.insert(descriptor, obs._list.length)
  }

  obs.destroy = function(){
    obs._list.forEach(unlisten)
  }

  obs(function(descriptors){

    if (currentTransaction === descriptors){
      return false
    }

    currentTransaction = descriptors

    if (!Array.isArray(descriptors)){
      descriptors = []
    }

    var maxLength = Math.max(descriptors.length, instanceDescriptors.length)
    var minLength = Math.min(descriptors.length, instanceDescriptors.length)
    var difference = descriptors.length - instanceDescriptors.length

    var updates = []
    for (var i=0;i<maxLength;i++){
      if (updateNode(i, descriptors[i]) && i < minLength){
        updates.push([i, 1, obs._list[i]])
      }
    }

    obs._list.length = descriptors.length
    removeListeners.length = descriptors.length
    instanceDescriptors = descriptors.slice()

    if (difference > 0){
      var u = [minLength, 0]
      for (var i=minLength;i<maxLength;i++){
        u.push(obs._list[i])
      }
      updates.push(u)
    } else if (difference < 0){
      updates.push([minLength-1, -difference])
    }

    currentTransaction = NO_TRANSACTION

    updates.forEach(broadcastUpdate)
  })

  return obs


  // scoped

  function onUpdate(item){
    var index = obs._list.indexOf(item)
    if (~index && instanceDescriptors[index]){
      if (currentTransaction == NO_TRANSACTION){

        var updates = []
        var oldDescriptor = instanceDescriptors[index]
        var descriptor = item()

        if (getNode(descriptor) !== getNode(oldDescriptor)){
          if (updateNode(index, descriptor)){
            updates.push([index, 1, obs._list[index]])
          }
        }

        instanceDescriptors[index] = descriptor
        update()

        updates.forEach(broadcastUpdate)
      }
    }
  }

  function update(){
    var newValue = instanceDescriptors.slice()
    currentTransaction = newValue
    obs.set(newValue)
    currentTransaction = NO_TRANSACTION
  }

  function listen(item, index){
    removeListeners[index] = item(function(){
      onUpdate(item)
    })
  }

  function unlisten(item, index){

    if (removeListeners[index]){
      removeListeners[index]()
      removeListeners[index] = null
    }

    if (item && item.destroy){
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

  function updateNode(index, descriptor){
    var instance = obs._list[index]
    var lastDescriptor = instanceDescriptors[index]

    var nodeName = getNode(descriptor)
    var ctor = descriptor && resolveNode(context.nodes, nodeName)


    if (instance && nodeName === getNode(lastDescriptor)){
      if (!deepEqual(instance, descriptor)) {
        instance.set(descriptor)
      }
    } else {

      if (instance){
        unlisten(instance, index)
        instance = null
      }

      obs._list[index] = null

      if (descriptor){
        // create
        if (typeof ctor === 'function') {
          var innerContext = Object.create(context)
          instance = ctor(innerContext)
          innerContext.node = instance
          instance.set(descriptor)
          listen(instance, index)
          obs._list[index] = instance
        }
      }

      return true
    }
  }

  function getNode(value){
    return value && value[context.nodeKey||'node'] || null
  }

}
