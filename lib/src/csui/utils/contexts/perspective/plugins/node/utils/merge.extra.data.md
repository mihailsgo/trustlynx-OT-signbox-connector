# mergeExtraData

Merges objects with keys `fields` and `expand`, which point to arrays of property names. The output is an object with keys `fields` and `expand`. Such objects are returned by extension points like `csui/utils/contexts/perspective/plugins/node/node.extra.data` or `csui/utils/contexts/perspective/plugins/node/main.node.extra.data`. 

Objects to merge can be passed to the method as a single array of objects, or as multiple objects in arguments.

## Example

```js
var fields = mergeExtraData(
  nodeExtraData.getModelFields(), { properties: [] }
);
var expand = mergeExtraData(
  nodeExtraData.getModelExpand(),
  { properties: ['reserved_user_id'] }
);
model.setFields(fields);
model.setExpand(expand);
```
