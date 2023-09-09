# Workspace Navigation


Shows buttons to enable tree view and navigate up command in the nodes table view.

## Extension

Conws provides the extension point  'conws/utils/commands/navigate/workspace'.
Extensions can control in specific scenarios, whether the navigation buttons are enabled or disabled.

### Example

In your module's extensions json file declare the extension, so the csui loading mechanism (require.js) loads the extension, when conws asks for it:

```json
    "conws/utils/commands/navigate/workspace": {
      "extensions": {
        "test": [
          "yourmodule/utils/commands/navigate/sample.navigate.workspace.extension"
        ]
      }
    },
```
In your module bundle provide the extension file '.../sample.navigate.workspace.extension.js':

```javascript
define([], function () {

  return {

    isWorkspaceNavigationEnabled: function(status,options) {

      // in your module check for the specific situation,
      // where you want to disable the conws navigation.
      if (status.xyz) {
        return false;
      }

    },

    checkNodesTableToolbarElements: function(status,options,current) {

      // in your module check for the specific situation
      // and return an object containing the desired flags.
      if (status.xyz) {
        return { treeView: false, navigateUp: true };
      }

    },

    checkHeaderViewOptions: function(options,current) {
      // in your module check for the specific situation
      // and return an object containing the desired flags.
      if (options.context.xyz) {
        return {
          hideToolbar: true,
          hideToolbarExtension: false,
          hideActivityFeed: true,
          hideDescription: false,
          hideWorkspaceType: true,
          hasMetadataExtension: false,
          enableCollapse: true,
          toolbarBlacklist: [],
          extensionToolbarBlacklist: []
        };
      }
    }

  };
});
```

## Interface methods

### isWorkspaceNavigationEnabled( status, options )

implement this function to generally enable or disable the workspace navigation elements.

#### Parameters

* status: same parameter as passed by csui to the enabled() method of a command.
* options: same parameter as passed by csui to the enabled() method of a command.

#### Result

* false: if you want the navigate buttons be disabled
* true: if you want the navigate buttons be enabled
* undefined: if you don't care.

### checkNodesTableToolbarElements( status, options, current )

implement this function to specifically decide which of the navigation elements, you care for, have to be displayed or suppressed. The returned values override the user settings.

#### Parameters

* status: same parameter as passed by csui to the enabled() method of a command.
* options: same parameter as passed by csui to the enabled() method of a command.
* current: object containing the current enabling state of the navigation elements: { treeView: true|false, navigateUp: true|false }. Initially set according the user settings.

#### Result
As result return an object containing flags for each navigation element you care for. The values for a flag can be:
  * true: enable the element
  * false: suppress the element
  * undefined: don't care
You can also return undefined instead of an object, if you don't care for any navigation element.

#### Note

Returning true for a navigation element does not mean, that it is really displayed in the current situation. In any case a navigation element is only displayed according its nature. The tree view button is displayed when the navigation location is directly inside or below a workspace. The navigate-up button is only displayed when the navigation location is below a workspace but not when it is directly in the workspace.

Also note: conws requests additional data during navigation via conws.main.node.extra data according the tree view user setting. If a component overrides the navigation elements and needs additional data be available so the enabled element can render correctly, it needs to request the required additional data by their own. For example: if the user setting is "treeView:true" and a component wants to override this in order to hide the tree view and display the navigateUp button, it must extend 'csui/utils/contexts/perspective/plugins/node/main.node.extra.data' and when getModelFields() is called, deliver {bwsinfo:['up']} as result in order to request the visibility flag, which the navigate up button needs to render correctly. This is needed to prevent the navigateUp button be displayed, when the parent is not acessible due to insufficient permissions. Be aware this causes a permissions check on the parent, even if treeView is configured, where this check normally is not needed. A better solution can be provided if LPAD-96468 is implemented.