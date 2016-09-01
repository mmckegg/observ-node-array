var NO_TRANSACTION = {}
var Observ = require('@mmckegg/mutant/value')
var Property = require('observ-default')
var Event = require('geval')
var resolveNode = require('./resolve')

var IMMUTABLE = {}

module.exports = ObservNodeVarhash

function ObservNodeVarhash(parentContext){
  // context: nodes, nodeKey

  var context = Object.create(parentContext)

  var obs = Property({})
  obs._type = 'NodeVarhash'
  obs._raw = {}

  obs.context = context

  var removeListeners = {}
  var instanceDescriptors = {}
  var currentTransaction = NO_TRANSACTION

  obs.keys = function(){
    return Object.keys(obs._raw)
  }

  obs.get = function(k){
    return obs._raw[k]
  }

  obs.remove = function(key){
    remove(key)
    update()
  }

  obs.put = function(key, descriptor){
    updateNode(key, descriptor)
    instanceDescriptors[key] = descriptor
    update()
  }

  obs.destroy = function(){
    for (var k in obs._raw){
      remove(k)
    }
  }

  obs(function(descriptors){
    if (currentTransaction === descriptors){
      return false
    }

    currentTransaction = descriptors

    if (!(descriptors instanceof Object)){
      descriptors = {}
    }

    for (var k in instanceDescriptors){
      if (!(k in descriptors)){
        remove(k)
      }
    }

    for (var k in descriptors){
      updateNode(k, descriptors[k])
    }

    currentTransaction = NO_TRANSACTION
  })

  return obs


  // scoped

  function onUpdate(key, item){
    if (instanceDescriptors[key]){
      if (currentTransaction == NO_TRANSACTION){
        var oldDescriptor = instanceDescriptors[key]
        var descriptor = item()

        if (getNode(descriptor) !== getNode(oldDescriptor)){
          updateNode(key, descriptor)
        }

        instanceDescriptors[key] = descriptor
        update()
      }
    }
  }

  function update(){
    var newValue = {}
    for (var k in instanceDescriptors){
      newValue[k] = instanceDescriptors[k]
    }
    currentTransaction = newValue
    obs.set(newValue)
    currentTransaction = NO_TRANSACTION
  }

  function listen(key, item){
    removeListeners[key] = item(function(){
      onUpdate(key, item)
    })
  }

  function remove(key){
    var instance = obs._raw[key]

    if (removeListeners[key]){
      removeListeners[key]()
    }

    if (instance && instance.destroy){
      instance.destroy()
    }

    ;delete removeListeners[key]
    ;delete instanceDescriptors[key]
    ;delete obs._raw[key]
  }

  function updateNode(key, descriptor){

    var instance = obs._raw[key]
    var lastDescriptor = instanceDescriptors[key]

    var nodeName = getNode(descriptor)

    if (instance && nodeName === getNode(lastDescriptor)){
      instance.set(descriptor)
    } else {
      remove(key)
      instance = null

      if (descriptor != null) {
        var ctor = nodeName === IMMUTABLE ?
          Value : resolveNode(context.nodes, nodeName)

        if (typeof ctor === 'function') {
          // create
          instance = ctor(context)
          instance.set(descriptor)
          listen(key, instance)
          obs._raw[key] = instance
        }
      }
    }

    instanceDescriptors[key] = descriptor
  }

  function getNode(value){
    if (value instanceof Object) {
      return value && value[context.nodeKey||'node'] || null
    } else {
      return IMMUTABLE
    }
  }
}

function Value(context) {
  var obs = Observ()
  obs.context = context
  return obs
}
