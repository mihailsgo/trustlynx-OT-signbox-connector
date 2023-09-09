# ServerModuleCollection

Lists the CS modules, which register a CS UI extension. The collection
can be fetched to get teh full module list.  A subset of modules can be
fetched by adding models with the `id` attribute only to the collection
and then the fetch.  Or fetching just the ServerModuleModel alone.

The following attributes are defined by the core implementation:

id (string)
: The Require.js module prefix used by the particular module.  It can be
  used as a unique identifier of the CS module.

title (string)
: The displayable name of the CS module.  It comes from the `Module` object
  in OScript and can be overridden later.

version (string)
: The module version formatted "<major>.<minor>.<patch>".

helpDocId (string)
: The unique identifier for the entrance page in the on-line
  documentation of this module.

## About the helpDocId

It is the product ID or the PI ID, containing the embedded version.
The format should be "nnnnnVVVVVV-h-dddd", where:

nnnnn
: Product/PI name

VVVVV
: Version

-h
: Help document (Optional)

-dddd
: Document type (User guide, Installation, etc...) (Optional)

## How to define a helpDocId for a CS module

The CS module contains a descriptor file with CS UI extensions:
`<prefix>-extensions.json` in the `.../support/<module>` directory.  The
property `helpDocId` should be specified there under the key
"csui/models/server.module/server.module.collection" -> "modules":

```json
{
  "csui/models/server.module/server.module.collection": {
    "modules": {
      "greet": {
        "helpDocId": "greetings160000-h-ugd"
      }
    }
  }
}
```

## How to get all modules, which have an on-line help

```javascript
require(['csui/models/server.module/server.module.collection'
], function (ServerModuleCollection) {

  var serverModules = new ServerModuleCollection();

  serverModules
      .fetch()
      .then(function () {
        var modulesWithHelp = serverModules.filter(function (serverModule) {
          return !!serverModule.get('helpDocId');
        });
      });

});
```

## How to configure context-sensitive help

- Contextual help can be configured for a fixed perspective,
while it must have a unique application scope id.
- This configuration has to be done in `<module>-extensions.json` 
in the `.../support/<module>` directory. 
- The `contextualHelp` object along with `helpDocId` property should 
be specified there under the key "csui/models/server.module/server.module.collection" -> "modules"
- Contextual help mappings should be specified in `contextualHelp` object
- `key` is application scope id that is configured in its perspective context plugin.
- `value` is the topic name for the corresponding help html page. In most cases, the 
topic name is same as the HTML help file name. 
- For example, for Permissions Explorer `.../csui-permissions-so.html` is the html page and the 
topic name is `csui-permissions-so`. 
However, in some cases topic name does not match with html file name. To confirm the correct topic names, please contact the PI team - either your assigned PI writer, or one of the following: 
khuang@opentext.com / lynnm@opentext.com / pmercuri@opentext.com

```json
{
 "csui/models/server.module/server.module.collection": {
    "modules": {
      "permsexp": {
        "version": "1.0",
        "helpDocId" : "cssui160210-h-ugd",
		    "contextualHelp" : {
            "permissionsexplorer" : "csui-permissions-so" 
         }
      }
    }
  }
}
```
- We have enhanced and extended context sensitive help for the container types also.
- Now, we can configure the contextual help for specific containers based on its subtypes.
- To configure it, you need extend 'src\utils\context.help\context.help.ids.js' file from the csui and map your subtype to the corresponding help page topic id.
```code
{   sequence: 50,
    decides: function (options) {
          return options.context.getModel('applicationScope').id === 'node' &&
            options.context.getModel('node').get('type') === 136;
        },
    contextHelpId: 'compound-documents-so'
}
``` 

- Object above will be added to the collection ContextHelpIdCollection in the extended file and coming to the values in the object

- `Sequence`: It is the priority value, which can be added by developer based on priortization required

- `decides`: It is function to be declared to return true on matching the required condition to  be verified. In eample above we verified wether container type is node and subtype is 136 which is compound documents

- `contextHelpId`: It is the  corresponding html file name to be displayed
- Few more examples added below for your reference
```code
 { // versions page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel &&
         options.context.viewStateModel.get('state').dropdown === 'versions';
      },
      contextHelpId: 'qs-versionpg-bg'
  }

 { // audit page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel &&
         options.context.viewStateModel.get('state').dropdown === 'audit';
      },
      contextHelpId: 'qs-audithistory-bg'
  }

 { // Collection
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 298;
      },
      contextHelpId: 'qs-addtocollection-bg'
 }
   ```

