# Configuration

## Progress panel Smart Control

<p>Marionette view that provides a control with the presentation layer to progress indicators within a progress panel.</p>

### Module : smart/controls/progresspanel/impl/progresspanel/progresspanel.view

### Example for using progress bar Smart Control view

```js
....
....
define(['smart/controls/progresspanel/impl/progresspanel/progresspanel.view'], 
function (SmartProgressPanelView) {
 var ProgressPanelView = SmartProgressPanelView.extend({
    constructor: function ProgressPanelView(options) {

      SmartProgressPanelView.prototype.constructor.call(this, options);

      // listening events provided by SmartControls for customized logic
      this.listenTo(this, 'navigate:to:location', this._mycallback));
    },

    _mycallback:  function(){
      ...
      ...
    }

 });
 return ProgressPanelView;
});
....
....
```

### Progress Panel
```js
....
....
define(['smart/controls/progresspanel/progresspanel'], 
function (ProgressPanel) {
  ProgressPanel.showProgressPanel(collection, options);
 });

....
....
```
### Loader
```js
....
....
define(['smart/controls/progresspanel/progresspanel'], 
function (ProgressPanel) {
  ProgressPanel.showLoader(xhr, options);
 });

....
....
```
### Minimized ProgressBar
```js
....
....
define(['smart/controls/progresspanel/progresspanel'], 
function (ProgressPanel) {
  ProgressPanel.setMessageRegionView(this, {
        enableMinimiseButtonOnProgressPanel: config.enableMinimiseButtonOnProgressPanel,
        miniProgressBarClass: 'csui-progressbar-maximize',
        miniProgressBarTarget: this
      });
  });
....
....
```

## Parameters

<ul>
  <li><b>collection - `required`</b> file upload collection.</li>
  <li><b>options.enableMinimiseButtonOnProgressPanel - `optional`( Boolean)</b> Default false.When true, minimise button is shown on progress panel and clicking on this icon will minimize the progress panel and status will be shown on the header with  a circular progress bar.
  </li>
  <li><b>options.allowMultipleInstances - `required` (Boolean)</b>If true, enables the minimise button on progress panel.</li>
  <li><b>options.actionType - `required` (String)</b>Type of action eg:copy,move.delete. Default UPLOAD</li>
  <li><b>options.enableCancel - `optional` (Boolean)</b>Flag to  show the panelStateValues. If true shows resolved, rejected, aborted, processing. Else resolved, rejected, aborted.</li>
  <li><b>options.xhr - `required` (Object)</b>Loader will be destroyed based on http response.</li>
  <li><b>options.enableCancel - `required` (Boolean)</b>Flag to enable the cancel button on loader panel. Default true.</li>
  <li><b>config.enhancePanel - `optional` (Boolean)</b>Flag to enable gotoLocation and progressbar for each item. Default false.</li>
  <li><b>options.miniProgressBarClass - `required` (String)</b>Classname for miniProgressBar.</li>
  <li><b>options.miniProgressBarTarget - `required` (Element)</b>Target element to display miniprogessbar.</li>

</ul>


## Public Methods

<ul>
  <li><b>setMessageRegionView(messageRegionView, options) :</b> Sets the given view to show the progresspanel.</li>
  <li><b>hideFileUploadProgress() :</b> hides the progresspanel.</li>
  <li><b>showProgressPanel():</b> makes the progresspanel for the given collection and also creates a miniprogress bar if minimize button on progresspanel is enabled.</li>
  <li><b>isActionInProgress() :</b> returns a boolean value if the passed action(eg: copy,move..) is in progress or not.</li>
  <li><b>showLoader(xhr, options) :</b> creats a indeterminate progress panel/loader and destroys once the given xhr resolves.</li>
  <li><b>changeLoaderMessage(message, xhr) :</b> To update the message in loader panel and update the xhr.</li>
</ul>

## Events

<ul>
<li><b>processing:completed</b> An event registered that is triggered once upload is 100% completed.</li>
</ul>

```js
this.parentView.trigger('processing:completed');
this.listenTo(options.parentView, "processbar:completed", this._mycallback);
```
<ul>
<li><b>processing:error</b> An event registered that is triggered once upload is rejected.</li>
</ul>

```js
this.parentView.trigger('processing:error');
this.listenTo(options.parentView, "processbar:error", this._mycallback);
```
<ul>
<li><b>processbar:update</b> An event registered that is triggered once upload is in processing state with percentage data.</li>
</ul>

```js
this.parentView.trigger('processbar:update', info.percentage);
this.listenTo(options.parentView, "processbar:update", this._mycallback);
```
<ul>
<li><b>processbar:minimize</b> An event registered that is triggered on clicking the minimise button on progress panel.</li>
</ul>

```js
 this.parentView.trigger('processbar:minimize');
 this.listenTo(options.parentView, "processbar:minimize", this._mycallback);
```
<ul>
<li><b>globalmessage.shown</b> An event registered that is triggered once the message panel is shown.</li>
</ul>

```js
 this.$el.trigger('globalmessage.shown', this);
 this.$el.on('globalmessage.shown',this._mycallback);
```
<ul>
<li><b>try:again</b> An event registered that is triggered on clicking the retry button.</li>
</ul>

```js
  this.model.trigger("try:again");
```
<ul>
<li><b>navigate:to:location</b> An event registered that is triggered on clicking the gotolocation link.</li>
</ul>

```js
  this.trigger('navigate:to:location', chidlView);
  this.listenTo(this, 'navigate:to:location', this._mycallback);
```
<ul>
<li><b>processbar:maximize</b> Listening to the event when mini progress bar is closed.</li>
</ul>

```js
 this.listenTo(this.parentView, 'processbar:maximize', this._mycallback);
```
