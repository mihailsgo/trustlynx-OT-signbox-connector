# NodeExtraData

Makes the server include additional information about nodes in REST API responses. Appends `fields=<role_name>[{...}]` and `expand==<role_name>[{...}]` parameters to REST API URLs, so that `CSNodeField` extensions on the server side get called. The extra data appear in the node model attributes as `data.<role_name> = { ... }`.

These extra parameters are meant to be included by all models and collections which fetch nodes. Commands or other ad-hoc addable extensions may depend on them. (Special extensions like table cells offer their specific interface to fetch additional information, but when dealing with nodes only, they can leverage this extensibility too.)

When introducing this extensibility, methods `getModelFields` and `getModelExpand` might obtain the current `context` in `options`, but it is not mandatory.

The role `properties` is always added to `fields` and does not need to be added by an extension.

## How to extend the extra data

Content of a `src/extensions/node.extra.data.js`:

```js
define(function () {
  'use strict';

  return {
    getModelFields: function (options) {
      return {
        rmdata: [], // all attributes from the role
        markups: ['id'] // only `id`
      };
    },

    getModelExpand: function (options) {
      return {
        properties: ['reserve_user_id'] // complete user
      };
    }
  };
});
```

Content of a `src/bundles/myext-all.js`:

```js
define([
  'myext/extensions/node.extra.data',
  ...
] {});
```

Content of `src/myext-extensions.json`:

```js
{
  "csui/utils/contexts/perspective/plugins/node/node.extra.data": {
    "extensions": {
      "myext": [ "myext/extensions/node.extra.data" ]
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
