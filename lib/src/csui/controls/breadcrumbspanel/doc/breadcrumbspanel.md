# Breadcrumb panel view

Breadcrumb view creates a configurable breadcrumb with navigation path and subcrumbs.

```js
var breadcrumbs = new BreadcrumbsPanelView({
  context: ..., // for drill-down navigation
});
```


## Hiding breadcrumbs through extension :

This extension allows to hide the whole breadcrumbs functionality. So as part of this
functionality it hides breadcrumbs' toggle button on global navigation header and hides the whole
 breadcrumbs bar as well.

### Extension hook

Any module can provide this extension by adding below entry in their module's extension json.

**For Example:**
```json
  "csui/controls/breadcrumbspanel/breadcrumbspanel.view": {
   "extensions": {
     "conws": [
        "conws/controls/breadcrumbs/conws.breadcrumbspanel.view"
      ]
    }
  }
```

### How to add

From this extension class, it is required to have `hideBreadcrumbs()`.

**For example:**

```js
define([...], function (...) {

  var ConwsBreadcrumbPanelExtn = {
    hideBreadcrumbs: function (opts) {
      ...
      ...
      return true/false; // based on custom business logic.
    }
  });

  return ConwsBreadcrumbPanelExtn;
});
```

**extension class:** returns an object which contains required prototype methods.


## Methods :

### hideBreadcrumbs(): (required)
  Returns Boolean flag to determine if show or hide breadcrumbs' toggle button on 
  global navigation header and show/hide the whole breadcrumbs bar as well.

