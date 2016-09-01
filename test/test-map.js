var test = require('tape')

var ObservNodeArray = require('../')
var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')
var map = require('../map.js')
var computed = require('@mmckegg/mutant/computed')

test('map nested observ', function(t){
  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ()
        })

        obs.specialValue = computed([obs], function(data){
          return data.id + '-' + data.value
        })

        return obs
      }
    }
  })

  var values = map(obs, 'specialValue')

  obs.set([
    { node: 'Test', id: '1', value: 'foo' },
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '3', value: 'baz' }
  ])

  var changes = []
  values(function(change){
    changes.push(change)
  })

  values.flush() // bypass nextTick

  t.equal(values.get(0), obs.get(0).specialValue)

  obs.remove(obs.get(1))
  values.flush()

  t.equal(changes.length, 2)
  t.deepEqual(changes[0], ['1-foo', '2-bar', '3-baz'])
  t.deepEqual(changes[1], ['1-foo', '3-baz'])

  t.end()
})

test('map nested observ with function', function(t){
  var obs = ObservNodeArray({
    nodes: {
      Test: function(context){
        var obs = ObservStruct({
          id: Observ(),
          value: Observ()
        })

        obs.specialValue = computed([obs], function(data){
          return data.id + '-' + data.value
        })

        return obs
      }
    }
  })

  var values = map(obs, function(x){
    return x.specialValue
  }, function(x){
    return x
  })

  obs.set([
    { node: 'Test', id: '1', value: 'foo' },
    { node: 'Test', id: '2', value: 'bar' },
    { node: 'Test', id: '3', value: 'baz' }
  ])

  var changes = []
  values(function(change){
    changes.push(change)
  })

  values.flush() // bypass nextTick

  t.equal(values.get(0), obs.get(0))

  obs.remove(obs.get(1))
  values.flush()

  t.equal(changes.length, 2)
  t.deepEqual(changes[0], ['1-foo', '2-bar', '3-baz'])
  t.deepEqual(changes[1], ['1-foo', '3-baz'])

  t.end()
})
