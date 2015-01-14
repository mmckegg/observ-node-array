observ-node-array
===

Populate an observable array from node descriptors.

## Install via [npm](https://npmjs.org/package/observ-node-array)

```bash
$ npm install observ-node-array
```

## API

```js
var ObservNodeArray = require('observ-node-array')
```

### `var nodeArray = ObservNodeArray(options)`

**options:**
 - nodes: An object containing a lookup of observ-* constructors.
 - nodeKey: (defaults to `'node'`) They key on the descriptor to use for finding constructor in `nodes` lookup.

### nodeArray()

Gets an array of descriptors as `set` or added using `push`, `insert` (recursive `obs()`).

### nodeArray(listener)

`listener` is called every time the node array is updated.

### nodeArray.set(arrayOfDescriptors)

Hydrate descriptors based on `nodeKey` specified using the constructors in `options.nodes`. If a node already exists at the same index, it will be updated to matched (using `node.set`), otherwise replaced or deleted (calling `node.destroy`).

### nodeArray.push(descriptor)

### nodeArray.insert(descriptor, targetIndex)

### nodeArray.get(index)

### nodeArray.getLength()

### nodeArray.indexOf(node)

### nodeArray.move(node, targetIndex)

### nodeArray.remove(node)

## Lookup / Map

```
var lookup = require('observ-node-array/lookup')
var map = require('observ-node-array/map')
```

### var lookupValues = lookup(nodeArray, indexKey[, valueKey])

### lookupValues()

### lookupValues(listener)

### lookupValues.keys()

### lookupValues.get()

### lookupValues.flush()

### var values = map(nodeArray, valueKey)

### values()

### values(listener)

### values.get(index)

### values.getLength()

### values.indexOf(node)

### values.forEach(iterator[, context])

### values.map(iterator[, context])

### values.flush()