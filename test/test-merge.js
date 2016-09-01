var test = require('tape')
var NodeArray = require('../')
var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')
var merge = require('../merge.js')
var lookup = require('../lookup.js')

var context = {
  nodes: {
    Test: function(context){
      var obs = ObservStruct({
        id: Observ(),
        value: Observ()
      })
      obs.type = 'Test'
      return obs
    }
  }
}

test('merge NodeArrayLookups', function(t){
  var arr1 = NodeArray(context)
  var arr2 = NodeArray(context)

  var lookup1 = lookup(arr1, 'id', 'value')
  var lookup2 = lookup(arr2, 'id', 'value')

  var obs = merge([lookup1, lookup2])

  arr1.set([ {node: 'Test', id: 'A', value: 123} ])
  arr2.set([ {node: 'Test', id: 'B', value: 456} ])

  lookup1.flush()
  lookup2.flush()

  t.deepEqual(obs(), {
    'A': 123,
    'B': 456
  })

  t.equal(obs.get('A'), arr1.get(0).value)
  t.equal(obs.get('B'), arr2.get(0).value)
  t.deepEqual(obs.keys(), ['A', 'B'])

  t.end()
})
