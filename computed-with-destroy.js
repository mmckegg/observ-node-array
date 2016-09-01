var Observable = require('@mmckegg/mutant/value')

module.exports = computed

function computed(observables, lambda) {
    var values = observables.map(function (o) {
        return o()
    })

    var releases = []
    var result = Observable(lambda.apply(null, values))

    observables.forEach(function (o, index) {
        releases[index] = o(function (newValue) {
            values[index] = newValue
            result.set(lambda.apply(null, values))
        })
    })

    result.destroy = function () {
        while (releases.length) {
            releases.pop()()
        }
    }

    return result
}
