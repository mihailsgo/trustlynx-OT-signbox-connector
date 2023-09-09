# GenericTileView

   The generic tile view provides a list of items for the view
    as given through the page context. It allows for filtering the items by opening a
    search field and entering filter criteria. Clicking a single item opens the page's default action for the node behind. Clicking the expanded icon shows the expanded view 
    with more columns.

### Example

      var contentRegion = new Marionette.Region({el: '#content'}),
          pageContext = new PageContext(), // holds the model
          genericTileView = new GenericTileView({context: pageContext});

      contentRegion.show(GenericTileView);
      pageContext.fetch();

## Constructor Summary

### constructor(options)

  Creates a new GenericTileView.

#### Parameters:
* `options` - *Object*. The view's options object.
* `options.connection` - *Connection* to authenticate against.
* `options.connection.url` - *String*. URL to authenticate against.
* `options.connection.supportPath` - *String*. Support path directory.

#### Returns:

  The newly created object instance.

#### Example:

  See the [GenericTileView](#) object for an example.

## Localizations Summary

The following localization keys are used

* `dialogTitle` -  for the widget's title
* `searchPlaceholder` - for the search field placeholder