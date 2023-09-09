# Metadata widget (widgets/metadata)

The Metadata widget uses data from category attributes. You can select a category or single attributes. To group attributes, enter a group name and then select the categories and attributes. Leave the group name empty to add a category or attribute without a group. Drag attributes or groups to change the order.

`Group name` - Name of a group of attributes or categories. Can be used to visually group attributes.

`Category or attribute` - Category or attributes.

    To add a Category, select the category to be added.
	To add an attribute, select the category and then select the attribute to be added.

## Features

* Display Configured Workspace Categories

  The Metadata widget displays category information configured in perspective manager (respective category should be added to the Workspace). Metadata can be configured with information like `categories` / `attributes` / `groups`.

* Update Category Information

  The Categories configured in the Metadata Widget can be updated inline (provided with proper access permissions).

## Constructor

### Example

```javascript
require([
  'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'conws/widgets/metadata/metadata.view'
], function (
  Marionette,
  PageContext,
  MetaDataView
) {
	var contentRegion = new Marionette.Region({el: '#content'}),
		pageContext   = new PageContext(), // holds the model
		currentNode   = pageContext.getModel(NodeModelFactory, {attributes: {id: 11111}});
		metaDataView = new MetaDataView({
			context: pageContext,
			data: {
				hideEmptyFields: false,
				metadata: [{
					categoryId: 4271,
					type: 'category'
				}],
				title: {
					en-US: 'Metadata'
				}
			},
			model: undefined
		});

	contentRegion.show(metaDataView);
	pageContext.fetch();
});
```

### Parameters

#### options

`context` - The page context.

`data` - The metadata widget configuration data.

##### data

`title` -  Title of the Metadata widget. Default value is `Metadata`.

	When the Metadata widget is used in a perspective,

	1.	this parameter can be configured in the perspective manager using the setting:
		"Metadata Widget -> Options -> Title"

`hideEmptyFields` - Hide empty fields that have no value. Default value is `False`.

	When the Metadata widget is used in a perspective,

	1.	this parameter can be configured in the perspective manager using the setting:
		"Metadata Widget -> Options -> Hide Empty Fields"

`metadata` - An array of the category attributes to display in the metadata view. Each element configured can be of three types `category`,`attribute`,`group`.

	When the Metadata widget is used in a perspective,

	1.	A category or single attribute can be configured in the perspective manager using the setting:
		"Metadata Widget -> Options -> Metadata -> Category or attribute"

	2.	Attributes/Categories can be Grouped in the perspective manager using the setting:
		"Metadata Widget -> Options -> Metadata -> Group Name"
		here, enter a group name and then select categorie or attributes.
		Leave the group name empty to add a category or attribute without a group.
		To change the order drag attributes or groups.

It uses the following syntax:

	metadata: [
	 {
		type: 'attribute',
		categoryId: 8394,
		attributeId: 2
	 },
	 {
		type: 'category',
		categoryId: 8394
	 },
	 {
		type: 'group',
		attributes :[{
			type: 'category',
			categoryId :4271
		}],
		label: 'Group Name'
	 }
	]

###### metadata

`type` -  In Metadata Widget elements configured can be of three types `category`,`attribute`,`group`.

`categoryId` - Id of the Category configured in the Metadata Widget.

`attributeId` - Id of the Attribute configured in the Metadata Widget.

`label` - Label of the Group Configured in Metadata Widget. Only added when group is configured in the widget.

`attributes` - An array of the categories / attributes grouped together in the Metadata Widget. Only added when group is configured in the widget.

It uses the following syntax:

	attributes :[{
		type: 'category',
		categoryId: 4271
	}],

## Configuration

The `Metadata` Widget is configured within the perspective manager. Below is the sample for the widget configuration in the Code Editor.

	...
	"widget": {
		"type": "conws/widgets/metadata",
		"options": {
			"hideEmptyFields": false,
			"metadata": [{
				"categoryId": 4271,
				"type": "category"
			}],
			"title": {
				"en-US": "Metadata"
			}
		}
	}
	...