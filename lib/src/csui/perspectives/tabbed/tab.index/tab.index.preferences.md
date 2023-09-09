# TabIndexPreferenceCollection

Suggests a preferred tab on a tabbed perspective if the active tab has not been specified. The result of the first registered extension that is not `undefined` will be returned to the TabbedPerspectiveView. The extensions can be ordered by the `sequence` attribute, but it should not be necessary, because the scenarios should be different enough.

The method `getPreferredTabIndex` will be called during the initialisation of the TabbedPerspectiveView if no tab index has been obtained from other sources, like the URL or navigation history.

## Methods

### getPreferredTabIndex(options) : command

Asks the extensions for the preferred tab index. Returns `undefined` if no extension has a tab preference, `null` if an extension decided to have no tab preference and a number if an extension wishes to activate a particular tab. Tab indexes are zero-based numbers.

The `options` include the `context` instance used in the owning scenario.

## Usage Example

```js
var tabIndex = this.getViewStateTabIndex();
if (tabIndex == null) {
  tabindex = tabIndexPreferences.getPreferredTabIndex({ context: this.context })
}
// tabIndex either remains undefined or null, or will be a number
```

## Customization

The extensions have to return their result synchronously and are able to use only information that is available in the context.

```js
csui.define(function () {
  'use strict';

  return [
    {
      getPreferredTabIndex: function (options) {
        var context = options.context;
        var perspective = context.perspective;
        var options = perspective.get('options')
        if (options.tabs.length > 1) {
          return 1; // Go to the second tab if there are two or more tabs.
        }
      }
    }
  ];
});
```
