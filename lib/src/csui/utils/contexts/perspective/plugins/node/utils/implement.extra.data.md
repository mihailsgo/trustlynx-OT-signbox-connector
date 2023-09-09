# implementExtraData

Shared code for extension points, which implement `getModelFields` and `getModelExpand` methods. For example, `csui/utils/contexts/perspective/plugins/node/node.extra.data` or `csui/utils/contexts/perspective/plugins/node/main.node.extra.data`. The extensions supply `fields` and `expand` parameters.
Makes the server include additional information about the main (contextual) node in the REST API response. Appends `fields=<role_name>[{...}]` and `expand==<role_name>[{...}]` parameters to the REST API URL, so that `CSNodeField` extensions on the server side get called. The extra data appear in the node model attributes as `data.<role_name> = { ... }`.

## Example

```js
define([
  'csui/utils/contexts/perspective/plugins/node/utils/implement.extra.data',
  'csui-ext!csui/utils/contexts/perspective/plugins/node/node.extra.data'
], function (implementExtraData, extraNodeData) {
  return implementExtraData(extraNodeData);
});
```
