# Error View

<p>Marionette Item view that provides a view to display error on tile view widgets  of the page rendered.</p>

```js
....
....
define(['smart/controls/error/error.view'], function (SmartErrorView) {

  return SmartErrorView;
});

....
....
```
## Parameters

<ul>
  <li><b>model - `required` (Backbone model)</b> Model to use as view model.</li>
  <li><p><b>low - `optional`( Boolean)</b> Initialy text will display in middle. Default is *false*.</p>
  </li>
</ul>

## Model Examples

### With the new 'suggestion' data

```js
....
....
new Backbone.Model({
  message: "The object cannot be accessed now.",
  suggestion: "Please try again later or contact the administrator.",
});
....
....
```

### backward compatible with the old data without 'suggestion' (with only message)

```js
....
....
new Backbone.Model({
  message:
    "Sorry, the item you requested could not be accessed. " +
    "Either it does not exist, or you do not have permission to access it. " +
    "If you were sent a link to this item, please contact the sender for assistance.",
});
....
....
```

### with popover

```js
....
....
new Backbone.Model({
  title: "Error view title",
  message: "The object cannot be accessed now.",
  suggestion: "Please try again later or contact the administrator.",
});
....
....
```
## Events

<p>'mouseenter' event to show the popover and 'mouseleave' event to hide the popover. Leading applications can have custom callbacks if they want.</p>
