
Facet panel displays a one level tree structure of available facet filters.

### Examples

```js
var facets = ...,
    facetView = new FacetPanelView({
      collection: facets
    });

    this.listenTo(facetView, 'apply:filter', this._addToFacetFilter);
```

---

## Overview

### Constructor

#### Parameters

collection:
: Backbone collection of facets inherited from `FacetCollection` provided by "csui/models/facets".

---

### childView  -- FacetView
              displayCount :: string
                 display count will be showed for admin users irrespective of Dispaly counts setting,
                 where as for non admin users display count will be displayed as per display count settings. 
              
              'Always' is a default value. Supported Values are: Always, Never, >1, >2, >3 >4, >5, >10, >25,>50,>100. Here '> num' means minimum display count / after which display count will be showed.
 
### Events

#### apply:filter

Triggered when one or more available facet topics have been selected.

##### Arguments

* `filter` - *Object* Contains facet name and id, and the facet topics that have been selected.

    filter: {
      name: "Content Type"
      id: "2666"
      values: [
        {
          id: "0"
          name: "Folder"
        }
      ]
    }
