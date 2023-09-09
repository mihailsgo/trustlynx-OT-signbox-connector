PreviewPluginCollection
=======================

Preview Plugins support showing document content for preview purposes very quickly, which is usually performed, when a link to the document is clicked.

Methods
-------

: findByNode(node, options) : plugin

Finds the best fitting plugin by the using the first rule, which matches
atributes of the particular node.

Plugin
------

A plugin is supposed to supply a widget, optionally with construction options. The widget and construction options can be computed dynamically if a function is used instead of the static value.

```js
interface PreviewPlugin {
  widgetView: string | function(node, option): string
  widgetViewOptions?: object | function(node, options): object
}
```

Widget
------

The instance of `widgetView` can expect `{ model, context }` extended with `widgetViewOptions` as options in the constructor. The view must expose a `setModel` method to swap the previews document on-the-fly.

```js
interface PreviewView extends Backbone.View {
  setModel(node): void
}
```

Extension
---------

Extension modules are supposed to export an array of rule objects with preview plugins, which will be added to the collection.

The optional `sequence` number specifies the order of plugin matching. The first plugin,
which rule matches the specified node, will be used. 100 is the default

```js
{
  sequence: 100, // default
  plugin: PreviewPlugin,
  decides: function (node, options) { return ... }
}
```

A complete extension module example, which declares a preview for images only:

```js
function ImagePreviewPlugin () {}

ImagePreviewPlugin.prototype.widgetView = 'sample/widgets/image.viewer/image.viewer.view';
ImagePreviewPlugin.prototype.widgetViewOptions = { preview: true };

ImagePreviewPlugin.isSupported = function (node, options) {
  var mimeType = node.get('mime_type');
  return mimeType && mimeType.indexOf('image/') === 0;
};

return [
  {
    plugin: ImagePreviewPlugin,
    decides: ImagePreviewPlugin.isSupported
  }
]
```

RequireJS modules with one or more rules are registered in the component
extensions JSON file for the extension point
"csui/utils/commands/preview.plugins/preview.plugins".

```json
{
  "csui/utils/commands/preview.plugins/preview.plugins": {
    "extensions": {
      "sample": [
        "sample/preview.plugins/preview.plugins"
      ]
    }
  },
  ...
}
```

Usage
-----

Once a plugin for a specific node is found, it can be used for getting of the view module 

```js
var node = ...;
var context = ...;
var plugin = previewPlugins.findByNode(node, { context: context });
var viewerModule = plugin.widgetView;
if (typeof viewerModule === 'function') {
  viewerModule = viewerModule.call(plugin, this.model, { context: this });
}
require([viewerModule], function (ViewerView) {
  var viewerOptions = plugin.widgetViewOptions;
  if (typeof viewerOptions === 'function') {
    viewerOptions = viewerOptions.call(plugin, this.model, { context: this });
  }
  this.viewerView = new ViewerView(_.extend({
    model: node,
    context: context,
  }, viewerOptions));
  this.viewerView.on('destroy', ...);
  ...
});
```
