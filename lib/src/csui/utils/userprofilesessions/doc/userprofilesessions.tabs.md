# userprofilesessions tab

The userprofilesessions tab provides the records of the current user's session information in simple user profile dialog

```javascript
return {
    viewClass: SessionsFieldView,
    viewModel: UserProfileSessionsModel
  };
{
  viewClass: extraUserProfileSessionsTabs,   // View rendering the session records
  viewOptions: {...}        // Optional view construction options
  viewModel: model          // options, read the respective session records
}
```

The default construction options for the `view` are:

Model: for the corresponding records to read
 
Context: the current application context

The `viewClass` can have an optional static method to check if the settings div
should be enabled (made visible)

```javascript
  extraUserProfileSessionsTabs.enabled = function (options) {
    return true; // Enable the user profile sessions field
  }
```

Sessions views can be added by registering a module extension, which
returns an array of settings

The extension point is used like this:

```json
"csui/utils/userprofilesessions/userprofilesessions.tabs/userprofilesessions.tabs": {
    "extensions": {
      "csui": [
        "csui/utils/userprofilesessions/userprofilesessions.tabs/core.userprofilesessions.tabs"
      ]
    }
  }
```
The `viewClass` triggers a named event `childview:rendered` to notify `viewClass`
gets rendered to parent(CollectionView)
