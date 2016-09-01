var test = require('tape')

var ObservNodeVarhash = require('../varhash')
var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')

test('varhash node creation and update by set', function(t){

  var obs = ObservNodeVarhash({
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

  obs.set({
    obj: { node: 'Test', value: 'foo' }
  })

  var obj = obs.get('obj')
  t.equal(obj.type, 'Test')
  t.deepEqual(obj(), { node: 'Test', value: 'foo' })

  obs.set({
    obj: { node: 'Test', value: 'bar' }
  })

  // make sure the object was not regenerated
  var obj2 = obs.get('obj')
  t.equal(obj, obj2)

  var destroyed = false
  obj2.destroy = function(){
    destroyed = true
  }

  obs.set({
    obj: { node: 'AnotherNode', value: 'bar' }
  })

  t.ok(destroyed, 'destroy called on object')

  // make sure the object was regenerated
  var obj3 = obs.get('obj')
  t.notEqual(obj2, obj3)
  t.equal(obj3.type, 'AnotherNode')

  var destroyed = false
  obj3.destroy = function(){
    destroyed = true
  }

  obs.set({})
  t.ok(destroyed, 'destroy called on object')

  t.end()

})

test('varhash setting node updates parent state', function(t){

  var obs = ObservNodeVarhash({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          value: Observ()
        })
        return obs
      }
    }
  })

  obs.set({
    obj: { node: 'Test', value: 'foo' }
  })

  var obj = obs.get('obj')
  obj.value.set('bar')

  t.deepEqual(obs(), {obj: { node: 'Test', value: 'bar' }})

  t.end()
})

test('varhash put / remove', function(t){

  var obs = ObservNodeVarhash({
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

  obs.set({
    obj1: { node: 'Test', id: '1', value: 'foo' },
    obj2: { node: 'Test', id: '2', value: 'bar' },
    obj3: { node: 'Test', id: '3', value: 'baz' }
  })


  var obj1 = obs.get('obj1')
  var obj2 = obs.get('obj2')
  var obj3 = obs.get('obj3')

  obs.put('obj4', { node: 'Test', id: '4', value: 'foobar'})

  t.deepEqual(obs(), {
    obj1: { node: 'Test', id: '1', value: 'foo' },
    obj2: { node: 'Test', id: '2', value: 'bar' },
    obj3: { node: 'Test', id: '3', value: 'baz' },
    obj4: { node: 'Test', id: '4', value: 'foobar' }
  })

  obs.remove('obj2')

  t.deepEqual(obs(), {
    obj1: { node: 'Test', id: '1', value: 'foo' },
    obj3: { node: 'Test', id: '3', value: 'baz' },
    obj4: { node: 'Test', id: '4', value: 'foobar' }
  })

  t.end()
})

test('change node from child', function(t){

  var obs = ObservNodeVarhash({
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

  obs.set({ obj: { node: 'Foo', id: 'test', value: 456 } })

  var obj = obs.get('obj')
  t.equal(obj.type, 'Foo')

  obj.set({ node: 'Bar', id: 'test', value: 456 })

  var obj2 = obs.get('obj')
  t.equal(obj2.value(), 456)
  t.equal(obj2.type, 'Bar')

  obj2.set({ node: 'Foo', id: 'test', value: 456 })

  var obj3 = obs.get('obj')
  t.equal(obj3.type, 'Foo')

  t.end()
})

test('immutable value varhash nodes', function(t) {
  var obs = ObservNodeVarhash({
    nodes: {
      Test: function(context){
        var obs = Observ()
        obs.type = 'Test'
        return obs
      }
    },
    nodeKey: 'node'
  })

  obs.set({
    obj: 1234
  })

  var obj = obs.get('obj')
  t.deepEqual(obj(), 1234)

  obs.set({
    obj: 5678
  })

  // make sure the object was not regenerated
  var obj2 = obs.get('obj')
  t.equal(obj, obj2)
  t.deepEqual(obj(), 5678)

  t.end()
})
