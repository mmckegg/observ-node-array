var computed = require('./computed-with-destroy')

module.exports = merge

function merge(nodeArrayLookups){
  var raw = {}

  var obs = computed(nodeArrayLookups, function(r){
    var res = Array.prototype.slice.apply(arguments)
    raw = {}
    var result = {}

    for (var i=0;i<res.length;i++){
      for (var k in res[i]){
        result[k] = res[i][k]
        raw[k] = nodeArrayLookups[i].get(k)
      }
    }

    obs && (obs._raw = raw)

    return result
  })

  obs._raw = raw

  obs.keys = function(){
    return Object.keys(obs._raw)
  }

  obs.get = function(i){
    return obs._raw[i]
  }

  return obs
}