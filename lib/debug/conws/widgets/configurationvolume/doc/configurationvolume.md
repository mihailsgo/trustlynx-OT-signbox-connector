# ConfigurationVolume Widgets (widgets/configurationvolume)

The configuration volume widget provides easy access to the configured volumes which are permitted for the given user.

## Features

* On-Click redirects to respective Volume

  Upon clicking configuration volume displayed on the widget, the user is re-directed to the respective volume.

* Display Configuration Volumes Accessible to User

  The widget displays configuration volume/volumes that are accessible to a user. When a user logs in, the system determines whether the user has access to any configurations.


    If yes, the widget shows the configuration/configurations that the user has access to.
	If not, the system displays an empty widget with a message that reads "There are no items to display".

## Constructor

### Example

```javascript
require([
  'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'conws/widgets/configurationvolume/ConfigurationVolume.view'
], function (
  Marionette,
  PageContext,
  ConfigurationVolumeView
) {

	var contentRegion = new Marionette.Region({el: "body"}),
		pageContext = new PageContext(),
		configurationVolumeView = new ConfigurationVolumeView({
			context: pageContext,
			data: {
				shortcutTheme: "csui-shortcut-theme-stone1"
			},
			model: undefined
		});

	contentRegion.show(configurationVolumeView);
	pageContext.fetch();
  });
```

### Parameters

#### options

`context` - The page context.

`data` - The ConfigurationVolume widget configuration data.

It uses the following syntax:

	data: {
		shortcutTheme: "Theme Name"
	}

##### data

`shortcutTheme` - The styling css class for configuration volume shortcut

	When the Configuration Volume widget is used in a perspective,

    1.	A category or single attribute can be configured in the perspective manager using the setting:
		"Configuration Volume Widget -> Options -> Theme".

List of Themes available:

       csui-shortcut-theme-stone1
       csui-shortcut-theme-stone2
       csui-shortcut-theme-teal1
       csui-shortcut-theme-teal2
       csui-shortcut-theme-pink1
       csui-shortcut-theme-pink2
       csui-shortcut-theme-indigo1
       csui-shortcut-theme-indigo2

## Configuration

The `Configuration Volume` Widget is configured within the perspective manager. Below is the sample for the widget configuration in the Code Editor.

	...
	"widget": {
		"type": "conws/widgets/configurationvolume",
		"kind": "tile",
		"c_id": "widget-1557740892899",
		"options": {
			"shortcutTheme": "csui-shortcut-theme-stone1"
		}
	}
	...