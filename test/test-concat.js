var test = require('tape')
var NodeArray = require('../')
var Value = require('@mmckegg/mutant/value')
var concat = require('../concat.js')
var map = require('../map.js')

var context = {
  nodes: {
    Test: function(context){
      var obs = Value()
      obs.type = 'Test'
      return obs
    }
  }
}

test('concat NodeArrays', function(t){
  var arr = NodeArray(context)
  var arr2 = NodeArray(context)

  var obs = concat([arr, arr2])

  arr.set([ {node: 'Test', value: 123} ])
  arr2.set([ {node: 'Test', value: 456} ])

  t.deepEqual(obs(), [
    {node: 'Test', value: 123},
    {node: 'Test', value: 456}
  ])

  t.equal(obs.get(0), arr.get(0))
  t.equal(obs.get(1), arr2.get(0))
  t.equal(obs.getLength(), arr.getLength() + arr2.getLength())

  t.end()
})
