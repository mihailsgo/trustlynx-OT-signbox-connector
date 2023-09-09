# Configuration

## User Profile View

<p>Marionette view that provides a user profile card with the presentation layer for profile card.</p>

### Module : smart/controls/user/user.profile.view

### Example for using SmartControls UserProfile view

```js
....
....
define(['smart/controls/user/user.profile.view'], function (SmartUserProfileView) {
 var UserProfileView = SmartUserProfileView.extend({
    constructor: function UserProfileView(options) {

      SmartUserProfileView.prototype.constructor.call(this, options);

      // listening events provided by SmartControls for customized logic
      this.listenTo(this, 'set:profile:pic', this._mycallback));
      this.listenTo(this, 'update:ajax:call', this._mycallback);
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
In order to render tabs, file that returns an object with tab options needs to be added in *-extensions.json file for 'smart/controls/user/tab.extension'.

```js
....
....
    require.config({
      config: {
        "smart/controls/user/tab.extension": {
          "extensions": {
            ....
          }
        }
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
  <li><b>enableUploadProfilePicture - `optional` (Boolean)</b>Flag to allow users to upload profile picture. NOTE: Only for logged in user.</li>
  <li><b>chatEnabled - `optional` (Boolean)</b>Flag to enable chat.</li>
  <li><b>chatSettings - `optional` (Object)</b>Object with 2 flags chatEnabled and presenceEnabled.</li>
  <li><b>customKN - `optional` (Boolean)</b>Flag to be passed if custom Keyboard navation logic is required.</li>
  <li><b>sequence - `optional` (Array)</b>Array with tabNames to prioritize tab ordrering shown.</li>
</ul>

### Tabs Extensions Options 

<ul>
  <li><b>tabName - `required`(String)</b> Unique string to idenify tab.</li>
  <li><b>tabDisplayName - `required`( String)</b> Tab Name to be displayed.
  </li>
  <li><b>tabContentView - `required` (Marionette View)</b>View to be rendered as content.</li>
  <li><b>showTab - `optional` (Function)</b>Function that returns flag to show the tab or not.</li>
  <li><b>tabCount - `optional` (Object)</b>An object with getItemCount() that returns count to be displayed beside tab name</li>
 
</ul>

## Events

<ul>
<li><b>set:profile:pic</b> An event registered that is to triggered to set initial profile picture.</li>
</ul>

```js
this.listenTo( this.userProfileView, "set:profile:pic", this._mycallback);
```

<ul>
<li><b>render:presence:view</b> An event registered that is triggered for leading application to render presence view.</li>
</ul>

```js
this.listenTo(this.userProfileView, "render:presence:viewd", this._mycallback);
```

<ul>
<li><b>update:ajax:call</b> An event registered that is triggered to update ajax call when picture is selected to upload. Passes object as argument with formdata, target and upload flag.</li>
</ul>

```js
this.listenTo( this.userProfileView, "update:ajax:call", this._mycallback);
```
<ul>
<li><b>launch:chat:window</b> An event registered that is triggered when chat icon is clicked to laugh chat window.</li>
</ul>

```js
this.listenTo( this.userProfileView, "launch:chat:window", this._mycallback);
```

<ul>
<li><b>custom:KN</b> An event to be triggered when flag customKn is true and custom Keyboard navigationis required.</li>
</ul>

```js
this.listenTo( this.userProfileView, "custom:KN", this._mycallback);
```

<ul>
<li><b>upload:inprogress</b> An event to be triggered when upload is in progress</li>
</ul>

```js
this.userProfileView.trigger("upload:inprogress");
```

<ul>
<li><b>upload:done</b> An event to be triggered when upload is successfull. </li>
</ul>

```js
this.userProfileView.trigger("upload:done");
```
<ul>
<li><b>update:profilepic:failure</b> An event to be triggered when uploading/deleting profile picture fails and displays an alert dialog. Options to be passed: errorContent to be shown on banner message and region(optional) to show banner message  </li>
</ul>

```js
this.userProfileView.trigger("update:profilepic:failure", args);
```

<ul>
<li><b>delete:done</b> An event to be triggered when delete profile picture done. </li>
</ul>

```js
this.userProfileView.trigger("delete:done");
```

<ul>
<li><b>update:presence</b> An event to be triggered when presence icon needs to be updated. Arguments : Objects </li>
</ul>

```js
this.userProfileView.trigger("update:presence", {showPresenceIndicator: (Boolean), status: (String -  "Online", "Offline", "Busy", "Away", "donotdisturb")});
```
