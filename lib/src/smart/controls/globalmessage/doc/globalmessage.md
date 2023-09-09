# Configuration

## Banner Message Smart Control

<p>Marionette view that provides a message banner control with the presentation layer to display noncritical messages.</p>

### Module : smart/controls/globalmessage/globalmessage.view

### Example for using message banner Smart Control view

```js
....
....
define(['smart/controls/globalmessage/globalmessage',
], function (GlobalMessage) {
  GlobalMessage.showMessage('success', 'Task was successful', 'More details about the task');
});
....
....
```
Methods showing messages can work only after the region to contain them has
been specified by calling `setMessageRegionView`.

Messages are displayed at the top of the page by default and they can span over 
the entire page height. If you want to move the location and/or limit the space
for the message to a specific rectangle on the page, you can use this method.

If you display a bigger widget like NodesTable, for example, you can pass the view,
which makes the boundary of the space for the messages to this method like shown below.

```js
....
....
csui.onReady2([
  'nuc/lib/marionette', 'csui/utils/contexts/browsing/browsing.context',
  'csui/widgets/nodestable/nodestable.view',
  'smart/controls/globalmessage/globalmessage'
], function (Marionette, BrowsingContext, NodesTableView, GlobalMessage) {
  'use strict';
  var contentRegion = new Marionette.Region({el: '#content'}),
    browsingContext = new BrowsingContext(),
    nodesTableView = new NodesTableView({context: browsingContext});
  
  GlobalMessage.setMessageRegionView(nodesTableView);
  contentRegion.show(nodesTableView);
  browsingContext.fetch();
});
....
....
```

## Parameters

<ul>
  <li><b>type - `required`</b> Type of the message: "info", "success", "warning", "error", "none".</li>
  <li><b>text - `required`(String)</b> Message to show in the header of the message panel.</li>
  <li><b>details - `optional` (String)</b> Text which can be displayed by clicking on the "Details"
  button in the header of the message panel.  If this parameter is not
  provided, there is no "Details" button and even no message panel body
  rendered.</li>
  <li><b>options - `optional` (Object)</b> A Javascript object for additional options to pass.</li>
  <li><b>options.doAutoClose - `optional` (Boolean)</b> By default `undefined`. When it is `true`/`undefined` message panel closes automatically after centain time (applicable only for success type).</li>
  <li><b>options.autoCloseTimeout - `optional` (Number)</b> After how many `milliseconds` message should get auto closed when `doAutoClose` is `true`/`undefined`. By default `5000` milliseconds (applicable only for success type).</li>
</ul>

## Public Methods

<ul>
  <li><b>setMessageRegionView(view)</b> If you want to move the location and/or limit the space
for the message to a specific rectangle on the page, you can use this method like shown above in example.</li>
  <li><b>showMessage(type, text, details, options)</b> Shows a textual message at the top of the page.  Messages of the type
"success" are hidden automatically, other types need to be hidden by
clicking on the close button.
  </li>
  <li><b>showCustomView(customView)</b> Shows a custom view provided by the caller. The view should offer some means
to destroy itself; it will not be removed from the page automatically. As
soon as the custom view gets destroyed, it will be removed from the page.</li>
</ul>

## Events

<ul>
<li>
  <p><b>globalmessage.shown</b> An event registered that is triggered when message is shown</p>

  ```javascript
  this.listenTo(this.message, "globalmessage.shown", this._mycallback);
  ```
</li>
<li>
  <p><b>escapsed:focus</b> An event registered that is triggered when message is hidden. Can used to set focus back to origin element.</p>

  ```javascript
  this.listenTo(this.message, "escapsed:focus", this._mycallback);
  ```
</li>
</ul>
