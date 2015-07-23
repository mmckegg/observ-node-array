var computed = require('./computed-with-destroy')

module.exports = concat

function concat(nodeArrays){

  var raw = []

  var obs = computed(nodeArrays, function(r){
    var res = Array.prototype.slice.apply(arguments)
    raw = nodeArrays.reduce(combine, [])
    obs && (obs._raw = raw)
    return Array.prototype.concat.apply([], res)
  })

  obs._raw = raw

  obs.getLength = function(){
    return obs._raw.length
  }

  obs.get = function(i){
    return obs._raw[i]
  }

  obs.indexOf = function(item){
    return obs._raw.indexOf(item)
  }

  obs.forEach = function(iterator, context){
    obs._raw.forEach(iterator, context)
  }

  obs.map = function(iterator, context){
    return obs._raw.map(iterator, context)
  }

  return obs

  // scoped
}

function combine(result, item){
  return result.concat(item._raw || item._list)
}