# MainNodeExtraData

Makes the server include additional information about the main (contextual) node in the REST API response. Appends `fields=<role_name>[{...}]` and `expand==<role_name>[{...}]` parameters to the REST API URL, so that `CSNodeField` extensions on the server side get called. The extra data appear in the node model attributes as `data.<role_name> = { ... }`.

These extra parameters are meant to be included by the node model that represents the main node on a node perspective. It is fetched in the context as `nextNode` (`csui/utils/contexts/factories/next.node`) and accessible as `node` (`csui/utils/contexts/factories/node`) on node perspectives. This extension may be supported by other (non-node) perspectives, if they use a concept of a "main" node too.

Roles `properties` and `columns` are always added to `fields` and does not need to be added by an extension.

When introducing this extensibility, methods `getModelFields` and `getModelExpand` might obtain the current `context` in `options`, but it is not mandatory.

## How to extend the extra data

Content of a `src/extensions/main.node.extra.data.js`:

```js
define(function () {
  return {
    getModelFields: function (options) {
      return {
        rmdata: [] // all attributes from the role
      };
    },

    getModelExpand: function (options) {
      return {
        rmdata: ['classif_id'] // complete classification
      };
    }
  };
});
```

Content of a `src/bundles/myext-all.js`:

```js
define([
  'myext/extensions/main.node.extra.data',
  ...
] {});
```

Content of `src/myext-extensions.json`:

```js
{
  "csui/utils/contexts/perspective/plugins/node/node.extra.data": {
    "extensions": {
      "myext": [ "myext/extensions/main.node.extra.data" ]
    }
  },
  ...
}
```

## How to access the extra data

```js
var data = node.get('data') || {};
var rmdata = data.rmdata || {};
console.log(rmdata.classif_id);
```

## How to implement the extra data

```js
define([
  'csui/utils/contexts/perspective/plugins/node/node.extra.data', ...
], function (nodeExtraData, ...) {
  var MyView = Marionette.CollectionView.extend({
    constructor: function MyView(options) {
      Marionette.CollectionView.call(this, options);
      this.collection.setFields(nodeExtraData.getModelFields());
      this.collection.setExpand(nodeExtraData.getModelExpand());
    }
  });
  return MyView;
}
```