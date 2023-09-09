# Facet Bar

**Module: csui/controls/facet.bar/facet.bar**

Facet bar displays a collection of facet filters that have been selected for a node container or search.

### Examples

```js
var facets = ...,
    facetBarView = new FacetBarView({
      collection: facets
    });

 this.listenTo(facetBarView, 'remove:filter', this._removeFacetFilter)
     .listenTo(facetBarView, 'remove:all', this._removeAll);
```

---

## Overview

### Constructor

#### Parameters

collection: 
: Backbone collection of facets inherited from `FacetCollection` provided by "csui/models/facets".

### Events

#### remove:filter

Triggered when a single selected facet topic is to be removed

#### remove:all

Triggered when all selected facet topics are to be removed

##### Arguments

* `filter` - *Object* Contains identifiers of facet topics to be removed.

    filter: [{id: x, values: [{id: y}]}]


## How to remove save as button from facet bar for unsupported sub types

## Unsupportable subtypes

Other modules can extend `csui/controls/facet.bar/savefilter.unsupported.list.ids` file and they can provide
unsupported sub types info

##saveFilterUnsupportedList
: can either return a sub type or an array of sub types which are unsupported

Modules with additional node information have to be registered as extensions of the
`csui/controls/facet.bar/savefilter.unsupported.list.ids` module in the product extension file.
For example, the module above is packaged as `contentsharing/utils/savefilter.unsupported.list.ids`
and the `contentsharing-extensions.json` file refers to it:

```json
{
"csui/controls/facet.bar/savefilter.unsupported.list.ids": {
      "extensions": {
        "contentsharing": [
          "contentsharing/utils/savefilter.unsupported.list.ids"
        ]
      }
    }
}
```
### Examples
```
define(['csui/lib/underscore', 'csui/lib/jquery'
], function (_, $) {

  'use strict';

  return [
    {
     saveFilterUnsupportedList:[0,899]
    }
  ];
});

```
define(['csui/lib/underscore', 'csui/lib/jquery'
], function (_, $) {

  'use strict';

  return [
    {
       saveFilterUnsupportedList: function (options) {
         //can perform any desired operation here and return an array of subtypes or return a specific subtype
          return options.context.getModel('node').attributes.type;
       }
    }
  ];
});
```