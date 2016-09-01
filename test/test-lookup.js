var test = require('tape')

var ObservNodeArray = require('../')
var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')
var lookup = require('../lookup.js')
var computed = require('@mmckegg/mutant/computed')

test('map nested observ', function(t){
  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ(),
          another: Observ()
        })

        obs.specialValue = computed([obs.value], function(value){
          return 'pre-' + value
        })

        return obs
      }
    }
  })

  var lookupItems = lookup(obs, 'id', 'specialValue')

  obs.set([
    { node: 'Test', id: '1', value: 'foo', another: 'test' },
    { node: 'Test', id: '2', value: 'bar', another: 'test' },
    { node: 'Test', id: '3', value: 'baz', another: 'test' }
  ])

  var changes = []
  lookupItems(function(change){
    changes.push(change)
  })

  lookupItems.flush() // bypass nextTick

  obs.remove(obs.get(1))
  lookupItems.flush()

  t.equal(changes.length, 2)
  t.deepEqual(changes[0], {'1': 'pre-foo', '2': 'pre-bar', '3': 'pre-baz'})
  t.deepEqual(changes[1], {'1': 'pre-foo', '3': 'pre-baz'})

  global.crashNow = true
  obs.get(0).another.set('magic')

  lookupItems.flush()

  t.equal(changes.length, 2) // should be no change

  obs.get(0).id.set('X')
  lookupItems.flush()

  t.equal(changes.length, 3)
  t.deepEqual(changes[2], {'X': 'pre-foo', '3': 'pre-baz'})


  t.end()
})

test('map nested observ function', function(t){
  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ(),
          another: Observ()
        })

        obs.specialValue = computed([obs.value], function(value){
          return 'pre-' + value
        })

        return obs
      }
    }
  })

  var lookupItems = lookup(obs, function(x){
    return x.id
  }, function(x) {
    return x.specialValue
  }, function(){
    return
  })

  obs.set([
    { node: 'Test', id: '1', value: 'foo', another: 'test' },
    { node: 'Test', id: '2', value: 'bar', another: 'test' },
    { node: 'Test', id: '3', value: 'baz', another: 'test' }
  ])

  var changes = []
  lookupItems(function(change){
    changes.push(change)
  })

  lookupItems.flush() // bypass nextTick

  obs.remove(obs.get(1))
  lookupItems.flush()

  t.equal(changes.length, 2)
  t.deepEqual(changes[0], {'1': 'pre-foo', '2': 'pre-bar', '3': 'pre-baz'})
  t.deepEqual(changes[1], {'1': 'pre-foo', '3': 'pre-baz'})

  global.crashNow = true
  obs.get(0).another.set('magic')

  lookupItems.flush()

  t.equal(changes.length, 2) // should be no change

  obs.get(0).id.set('X')
  lookupItems.flush()

  t.equal(changes.length, 3)
  t.deepEqual(changes[2], {'X': 'pre-foo', '3': 'pre-baz'})


  t.end()
})
