# usersettings tab

The usersettings tab provides to select usersettings like accessibilty in simple user profile dialog

```javascript
return {
    sequence: 100,
    viewClass: AccessibilityFieldView,
    viewModel: userSettingsModel
  };
{
  sequence: 100,            // Order in the panel selection list
  viewClass: MyView,        // View rendering the settings
  viewOptions: {...}        // Optional view construction options
  viewModel: model          // options, read and write respective settings
}
```

The default construction options for the `view` are:

Model: for the corresponding setting to read and write
 
Context: the current application context,

userid: current logged in user id

The `viewClass` can have an optional static method to check if the settings div
should be enabled (made visible)

```javascript
  MyView.enabled = function (options) {
    return true; // Enable the settings field
  }
```

settings views can be added by registering a module extension, which
returns an array of settings

The extension point is used like this:

```json
"csui/utils/usersettings/usersettings.tabs/usersettings.tabs": {
    "extensions": {
      "csui": [
        "csui/utils/usersettings/usersettings.tabs/core.usersettings.tabs"
      ]
    }
  }
```
The `viewClass` triggeres a named event `childview:rendered` to notify `viewClass`
gets rendered to parent(CollectionView)
