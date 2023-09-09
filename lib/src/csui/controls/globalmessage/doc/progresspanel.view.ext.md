# ProgressPanelView

ProgressPanelView is the header view, which holds the status of all the items. ProgressPanelView inherits and extends ProgressPanelViewImpl to provide additional functionality such as hiding GoToLocation in the header.

Define the following in the config to enable the additional functionality:

```
  var config = _.defaults(module.config().csui,{
    enhancePanel: true
  });
```

## For more implementation details, see:
- `src/controls/globalmessage/impl/progresspanel/progresspanel.view.js`

## Supported template extension location
- `src/controls/globalmessage/impl/progresspanel.ext.hbs`

## Example
```
    var ProgressPanelView = ProgressPanelViewImpl.extend({
    
    constructor: function ProgressPanelView(options) {
      ProgressPanelViewImpl.prototype.constructor.apply(this, arguments);
    },
    
      ...
      
    });
```
  

# ProgressBarView

ProgressBarView holds the status of each item. ProgressBarView inherits and extends ProgressBarViewImpl to provide additional functionality such as showing GoToLocation and showing progress bar for each item.

Define the following in the config to enable the additional functionality:

```
  var config = _.defaults(module.config().csui,{
    enhancePanel: true
  });
```

## For more implementation details, see:
- `src/controls/globalmessage/impl/progresspanel/progresspanel.view.js`

## Supported template extension location
- `src/controls/globalmessage/impl/progresspanel.ext.hbs`

## Example
```
    var ProgressBarView = ProgressBarViewImpl.extend({
    
    constructor: function ProgressBarView(options) {
      ProgressBarViewImpl.prototype.constructor.apply(this, arguments);
    },
    
      ...
      
    });
```
#### Note : 
Once the action is completed, background color is set to transperant for hover style of the progress bar item as there are no clickable actions by default after process completion. Please ensure to add background color if any clickable element is added to progress bar item as per UX guidlines.
