var test = require('tape')

var ObservNodeArray = require('../')
var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')

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

test('node add / remove by set', function(t){

  var obs = ObservNodeArray({
    nodes: {
      Foo: function(context){
        var obs = Observ()
        obs.type = 'Foo'
        return obs
      },
      Bar: function(context){
        var obs = Observ()
        obs.type = 'Bar'
        return obs
      }
    }
  })

  var changes = []
  obs.onUpdate(function(change){
    changes.push(change)
  })

  obs.set([
    {node: 'Foo', value: 123},
    {node: 'Bar', value: 456}
  ])

  t.equal(obs.getLength(), 2)
  t.equal(obs.get(0).type, 'Foo')
  t.equal(obs.get(1).type, 'Bar')

  // check updates
  t.equal(changes.length, 1)
  t.equal(changes[0].length, 2+2)
  t.deepEqual(changes[0].slice(0,2), [0, 0])
  t.equal(changes[0][2], obs.get(0)); t.equal(changes[0][3], obs.get(1))
  changes.length = 0

  obs.set([
    {node: 'Foo', value: 123},
    {node: 'Bar', value: 456},
    {node: 'Bar', value: 789},
  ])

  t.equal(obs.getLength(), 3)
  t.equal(obs.get(2).type, 'Bar')

  // check updates
  t.equal(changes.length, 1)
  t.equal(changes[0].length, 2+1)
  t.deepEqual(changes[0].slice(0,2), [2, 0])
  t.equal(changes[0][2], obs.get(2))
  changes.length = 0

  obs.set([
    {node: 'Bar', value: 456},
    {node: 'Bar', value: 789},
  ])

  t.equal(obs.getLength(), 2)

  // check updates
  t.equal(changes.length, 2)
  t.equal(changes[0].length, 2+1)
  t.deepEqual(changes[0].slice(0,2), [0, 1])
  t.equal(changes[0][2], obs.get(0))
  t.deepEqual(changes[1], [1, 1])


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

test('change node from child', function(t){

  var obs = ObservNodeArray({
    nodes: {
      Foo: function Foo(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ()
        })

        obs.type = 'Foo'

        return obs
      },

      Bar: function Bar(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ()
        })

        obs.type = 'Bar'

        return obs
      }
    }
  })

  obs.set([ { node: 'Foo', id: 'test', value: 456 } ])

  var obj = obs.get(0)
  t.equal(obj.type, 'Foo')

  obj.set({ node: 'Bar', id: 'test', value: 456 })

  var obj2 = obs.get(0)
  t.equal(obj2.value(), 456)
  t.equal(obj2.type, 'Bar')

  obj2.set({ node: 'Foo', id: 'test', value: 456 })

  var obj3 = obs.get(0)
  t.equal(obj3.type, 'Foo')

  t.end()

})
