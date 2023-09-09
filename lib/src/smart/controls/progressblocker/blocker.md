# Progress Blocker Control

**Module: smart/controls/progressblocker/blocker.**

The blocker.js implements a marionette.Itemview that constructs a parent view, and shows either loading wheel or loading text in parent view

The blocker.view creates a parent view in its constructor to show the blocker.

## BlockingView(options)

Creates a new instance.

## Example for using SmartControls BlockingView
```js
....
....
define([
  'module', 'csui/lib/underscore',
  'smart/controls/progressblocker/blocker'
], function (module, _, SmartBlocker) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    delay: 10,
    disableDelay: 10,
    globalOnly: false
  });

  SmartBlocker.setModuleConfigs(config);

  return SmartBlocker;
});
....
....
```
### Parameteres

<ul>
  <li><b>counter - `required` </b> Attribute that counts the multiple enabling calls of blocker.</li>
  <li><b><p>parentView - `required`(Backbone collection)</p></b>View used to show blocker.</li>
  <li><b>showloadingWheel - `optional` (Boolean)</b>Flag to determine whether to show 3 dots or blocking wheel. </li>
  <li><b><p>loadingText - `optional` (String)</p></b>Loading text to be displayed along with 3 dots animation. Default value is "Loading". </li>
  <li><b><p>darkBackground - `optional` (Boolean)</p></b>Flag to show 3 dots or blocking wheel when there is a dark background. </li>
</ul>


## Public Methods
<ul>
  <li><b>enable():</b> Enables blocking view.</li>
  <li><b>disable():</b> Disables blocking view.</li>
  <li><b>onBeforeDestroy():</b> Destroys current blocking view.
  </li>
  <li><b>makeGlobal():</b>The outermost view, which usually means the first view, where the blocker should show.</li>
  <li><b>ParentWithBlockingView.blockActions():</b> Shows loading wheel in parent view.
  </li>
  <li><b>ParentWithBlockingView.blockWithoutIndicator():</b>Blocks actions in parent view without loading wheel.</li>
  <li><b>ParentWithBlockingView.unblockActions():</b> Removes loading wheel in parent view.
  </li>
  <li><b>ParentWithBlockingView.showBlockingView():</b>Appends blocking view to parent view while rendering.</li>
  <li><b>ParentWithBlockingView.destroyBlockingView():</b>Removes blocking view from parent view while destroying.
  </li>
  <li><b>BlockingView.imbue():</b>Imbuing blocking view functionality in parent view and listens to show, destroy events.</li>
  <li><b>enable():</b> Enables blocking view.</li>
  <li><b>BlockingView.setModuleConfigs():</b>To set and override the default config options.</li>
</ul>