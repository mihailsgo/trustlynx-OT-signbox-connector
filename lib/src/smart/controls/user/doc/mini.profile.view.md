# Configuration

## Mini Profile View

<p>Marionette view that provides a presentation layer for mini user profile.</p>

### Module : smart/controls/user/miniprofile.view

### Example for using SmartControls MiniProfile view

```js
....
....
define(['smart/controls/user/miniprofile.view'], function (SmartMiniProfileView) {
 var MiniProfileView = SmartMiniProfileView.extend({
    constructor: function MiniProfileView(options) {

      SmartMiniProfileView.prototype.constructor.call(this, options);

      // listening events provided by SmartControls for customized logic
      this.listenTo(this, 'set:profile:pic', this._mycallback));
      this.listenTo(this, 'click:userprofilepic', this._mycallback);
    },

    _mycallback:  function(){
      ...
      this.trigger("upload:inprogress");
      ...
    }

 });
....
....
```

## Parameters

<ul>
  <li><b>userid - `required`</b> User ID of viewed User.</li>
  <li><b>otherUser - `optional`( Boolean)</b> Flag about logged in usr or not.
  </li>
  <li><b>model - `required` (Backbone Model)</b>Backbone model about user information.</li>
  <li><b>showPresenceIndicator - `optional` (Boolean)</b>Flag to show presence icon.</li>
  <li><b>chatEnabled - `optional` (Boolean)</b>Flag to enable chat.</li>
  <li><b>chatSettings - `optional` (Object)</b>Object with 2 flags chatEnabled and presenceEnabled.</li>
</ul>

## Events

<ul>
<li><b>click:userprofilepic</b> An event registered that is triggered when profile picture is clicked.</li>
</ul>

```js
this.listenTo( this.miniProfileView, "click:userprofilepic", this._mycallback);
```

<ul>
<li><b>display:actions</b> An event registered that is triggered for leading application to render actions.</li>
</ul>

```js
this.listenTo(this.miniProfileView, "display:actions", this._mycallback);
```

<ul>
<li><b>set:profile:pic</b> An event registered that is triggered to set profile pic on render.</li>
</ul>

```js
this.listenTo( this.miniProfileView, "set:profile:pic", this._mycallback);
```
<ul>
<li><b>launch:chat:window</b> An event registered that is triggered when chat icon is clicked to laugh chat window.</li>
</ul>

```js
this.listenTo( this.miniProfileView, "launch:chat:window", this._mycallback);
```

<ul>
<li><b>show:display:actions</b> An event to be triggered when display actions are to be shown and response data to be passed.</li>
</ul>

```js
this.miniProfileView.trigger("show:display:actions", responsedata);
```

<ul>
<li><b>update:presence:indicator</b> An event to be triggered when presence icon needs to be updated. Arguments : Objects </li>
</ul>

```js
this.miniProfileView.trigger("update:presence:indicator", {showPresenceIndicator: (Boolean), status: (String - "Online","Offline", "Busy", "Away", "donotdisturb")});
```
