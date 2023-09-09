# Breadcrumb View

Breadcrumb view creates a configurable breadcrumb with navigation path and subcrumbs.

```js
var breadcrumbs = new BreadcrumbsView({
  context: ..., // for drill-down navigation
  collection: ..., // simplified node model schema
  fetchOnCollectionUpdate: false
});
```