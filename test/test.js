var test = require('tape')

var ObservNodeArray = require('../')
var Observ = require('observ')
var ObservStruct = require('observ-struct')

test('node creation and update by set', function(t){
  
  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = Observ()
        obs.type = 'Test'
        return obs
      },

      AnotherNode: function(context){
        var obs = Observ()
        obs.type = 'AnotherNode'
        return obs
      },

    },
    nodeKey: 'node'
  })

  obs.set([
    { node: 'Test', value: 'foo' }
  ])

  var obj = obs.get(0)
  t.equal(obj.type, 'Test')
  t.deepEqual(obj(), { node: 'Test', value: 'foo' })

  obs.set([
    { node: 'Test', value: 'bar' }
  ])

  // make sure the object was not regenerated
  var obj2 = obs.get(0)
  t.equal(obj, obj2)

  var destroyed = false
  obj2.destroy = function(){
    destroyed = true
  }

  obs.set([
    { node: 'AnotherNode', value: 'bar' }
  ])

  t.ok(destroyed, 'destroy called on object')

  // make sure the object was regenerated
  var obj3 = obs.get(0)
  t.notEqual(obj2, obj3)
  t.equal(obj3.type, 'AnotherNode')

  var destroyed = false
  obj3.destroy = function(){
    destroyed = true
  }

  obs.set([])
  t.ok(destroyed, 'destroy called on object')

  t.end()

})

test('setting node updates parent state', function(t){

  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          value: Observ()
        })
        return obs
      }
    }
  })

  obs.set([
    { node: 'Test', value: 'foo' }
  ])

  var obj = obs.get(0)
  obj.value.set('bar')

  t.deepEqual(obs(), [{ node: 'Test', value: 'bar' }])

  t.end()

})

test('move a node by reference', function(t){

  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ()
        })
        return obs
      }
    }
  })

  obs.set([
    { node: 'Test', id: '1', value: 'foo' },
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '3', value: 'baz' }
  ])


  var obj1 = obs.get(0)
  var obj2 = obs.get(1)
  var obj3 = obs.get(2)


  obs.move(obj2, 0)

  t.deepEqual(obs(), [
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '1', value: 'foo' },
    { node: 'Test', id: '3', value: 'baz' }
  ])

  t.equal(obs.get(0), obj2)

  obs.move(obj1, 2)

  t.deepEqual(obs(), [
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '3', value: 'baz' },
    { node: 'Test', id: '1', value: 'foo' }
  ])

  t.equal(obs.get(2), obj1)
  t.equal(obs.get(1), obj3)

  t.end()

})

test('push and insert a node by descriptor', function(t){

  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ()
        })
        return obs
      }
    }
  })

  obs.set([
    { node: 'Test', id: '1', value: 'foo' },
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '3', value: 'baz' }
  ])


  var obj1 = obs.get(0)
  var obj2 = obs.get(1)
  var obj3 = obs.get(2)


  obs.insert({ node: 'Test', id: '4', value: 'foobar'}, 1)

  t.deepEqual(obs(), [
    { node: 'Test', id: '1', value: 'foo' },
    { node: 'Test', id: '4', value: 'foobar'},
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '3', value: 'baz' }
  ])

  obs.push({ node: 'Test', id: '5', value: 'foobaz'})

  t.deepEqual(obs(), [
    { node: 'Test', id: '1', value: 'foo' },
    { node: 'Test', id: '4', value: 'foobar'},
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '3', value: 'baz' },
    { node: 'Test', id: '5', value: 'foobaz'}
  ])

  t.deepEqual(obs.get(1)(), { node: 'Test', id: '4', value: 'foobar'})
  t.deepEqual(obs.get(4)(), { node: 'Test', id: '5', value: 'foobaz'})

  t.end()
})