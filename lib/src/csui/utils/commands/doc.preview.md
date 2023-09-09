# Document preview

This command shows eye icon either in header action bar or inline action menu.
This action gets enabled if and only if it meets the following conditions.

* one of the plugin should be available (for example, brava/csv/viewx)
* plugin's override-able method `validateNode` should return true for each node passed to it.

## Methods

### validateNode(node, status) : override-able public method

This method validates each node.
Default validation has been given in this command itself, if any plugin has custom validation,
then this method can be override in their plugin to execute their custom specific logic.

## Default method

Below is the default method that checks whether the current node is valid or not.

```js
validateNode: function (node, status) {
  if (!node) {
    return false;
  }
  var isDocument = node.get('type') === 144;
  if (!isDocument) {
    return false;
  }
  var hasMimeType = isDocument && node.get('mime_type');
  if (!hasMimeType) {
    return false;
  }
  return true;
},
```

**Note:** The above code snippet may change in the respective command, better always refer the
code in `csui/utils/commands/doc.preview` command.


## Events

<ul>
  <li><b>doc:preview:closed</b> An event is triggered on <b>originatingView</b> to inform the originating view that current document preview has been closed.</li>
</ul>


## Customization

Assume that in viewx module, plugin has custom logic to validate node, then it should
be define in respective plugin as shown below.

```js
ViewXPlugin.prototype.validateNode = function (node, status) {
  // custom logic goes here...
  if (!node) {
    return false;
  }
  var isDocument = node.get('type') === 144,
      isContainer = node.get('container'); // true for folders and any containers.
  if (!isDocument && !isContainer) {
    return false;
  }
  var hasMimeType = isDocument && node.get('mime_type');
  if (!hasMimeType && !isContainer) {
    return false;
  }
  return true;
};
```
## How to get doc preview command (to be configured in toolbaritems)

```js
define([
  'csui/controls/toolbar/toolitems.factory',
], function (ToolItemsFactory) {
  var toolbarItems = {
    // inline action bar
    inlineActionbar: new ToolItemsFactory({
          info: [
            {
              signature: "DocPreview",
              name: lang.ToolbarItemDocPreview,
              iconName: "csui_action_preview32",
              commandData: {
                ifNotOpenDelegate: true,
                fullView: false,
                includeContainers: false
              }
            }
            ...
          ]
          ...
  };
  return toolbarItems;
});
// `signature`: (String) Signature of the command.
// `name` : (String) Name of the command to be used as display label.
// `iconName` : (Optional, String) Icon class of the command.
// `ifNotOpenDelegate` : (Boolean value) To check if any other open delegate options are availabe. Default value is true.
// `fullView` : (Boolean value) Provision to show preview of document in full screen. Default value is true. Default value is false.
// `includeContainers` : (Boolean value) To allow containers to have provision to show doc proview command. Default value is true.

```

## Dynamic options from originating view

### previewInFullMode:

<p>
Sometimes it is quite often to send few command's oriented data dynamically.
For example, table view wants preview in side panel but thumbnail view wants in full preview mode.
This flag (`fullView`) is part of static tool item configuration's command data. But this has to
change once the nodestable view toggled between table view and thumbnail view. So while toggling,
 then respective originating view will set this flag based on the current state. And this command
  obtain this flag and gives higher prescedenc over defaults, commandData, etc.,
</p>

```js
...
...
// in originating view, while toggling between two variants...
if (this.thumbnailView) {
  this.previewInFullMode = true;
  this.enableThumbnailView();
  ...
} else {
  this.previewInFullMode = false;
  this.tableRegion.show(this.tableView);
  ...
}
...
...
```

### disablePreview:

<p>
If preview has to disable dynamically while changing from one variant to another variant or after
 some custom business logic from the originating view, then originating view can set this flag to
  true, such that this preview command will be disabled once this flag is been set in the current
   originating view.
</p>

```js
...
...
// for example, in my originating view, my custom requirement is like, disable preview when the
current variant is thumbnail view, enable it only in table view variant.
if (this.thumbnailView) {
  this.disablePreview = true;
  this.enableThumbnailView();
  ...
} else {
  this.disablePreview = false;
  this.tableRegion.show(this.tableView);
  ...
}
...
...
```
