var test = require('tape')

var ObservNode = require('../single')
var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')

test(function(t){
  var obs = ObservNode({
    nodes: {
      Test: function(context){
        var obs = Observ()
        obs._type = 'Test'
        return obs
      },

      AnotherTest: function(context){
        var obs = Observ()
        obs._type = 'AnotherTest'
        return obs
      }
    }
  })

  obs.set({
    node: 'Test',
    value: 123
  })

  var node1 = obs.node
  t.equal(obs.node._type, 'Test')

  obs.node.set({ node: 'Test', value: 456 })
  t.equal(obs.node, node1)
  t.deepEqual(obs(), { node: 'Test', value: 456 })

  obs.set({ node: 'AnotherTest', value: 123 })
  t.notEqual(obs.node, node1)
  t.equal(obs.node._type, 'AnotherTest')

  // check child node type change propgates to parent and recreates it
  obs.node.set({ node: 'Test', value: 456})
  t.equal(obs.node._type, 'Test')

  t.end()
})
