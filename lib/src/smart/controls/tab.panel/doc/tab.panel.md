# Configuration

## Tap Panel Smart Control​

<p>Marionette view that provides a tab panel view with the presentation layer for tab controls with navigational capability.</p>

**Module:smart/controls/tab.panel/tab.panel.view**

### Example for using SmartControls Tab panel view

```js


define(['smart/controls/tab.panel/tab.panel.view',], function (SmartTabPanelView) {
      var TabPanelView = SmartTabPanelView.extend({
        constructor: function TabPanelView(options) {
          SmartTabPanelView.prototype.constructor.call(this, options);
        },

        // listening events provided by SmartControls for customized logic
      this.listenTo(this, 'event:name', this._mycallback));
    },

    _mycallback:  function(){
      ...
      ...
      ...
      });

      return TabPanelView;
    });

```

## Parameters
<p> Tabs can be populated by a collection or by an array `options.tabs`.The collection is created automatically from the options in the latter case.</p>

<ul>
  <li><b>collection - `required`</b>*collection* List of tab models controlling the tab links and panes (Backbone.Collection, mandatory if `tabs` not provided, otherwise ignored).</li>

  <li><b>tabs - `required`</b>*array* List of tab definitions controlling the tab links and panes (array of object
  literals, mandatory if `collection` not provided, otherwise ignored).</li>

  <li><b>delayTabContent - `optional`</b>*Boolean* Default `false`. Delays creation of the tab content until the tab get activated, ignored if `mode` is 'spy').</li>

  <li><b>TabLinkCollectionViewExt - `optional`</b>TabLinkCollectionViewExt inherits and extends TabLinkCollectionView to provide additional functionality such as left and right toolbar for tab scrolling functionality, adding new tabs,and deleting tab capability.</li>

  <li><b>contentView - `required`</b>View to render in the content pane of a tab (Backbone.View or a function
  returning a Backbone.View.</li>  

</ul>

#### Tab

<ul>

  <li><b>title - `required`</b>*String*. Title of the tab link to switch to the tab content.</li>

  <li><b>id - `optional`</b>*String* Unique ID used internally by the Bootstrap implementation, generated
  automatically if not provided</li>

</ul>


## Events

<ul>
<li><b>reset</b> Listening to reset event on collection</li>
</ul>

```js
  this.listenTo(this.collection, 'reset', this._mycallback);
```

<ul>
<li><b>add</b> Listening to add event on collection</li>
</ul>

```js
  this.listenTo(this.collection, 'add', this._mycallback);
```


<ul>
<li><b>tab:contents:header:view:change:tab:title</b> Listening to add event on collection</li>
</ul>

```js
  this.listenTo(this, 'tab:contents:header:view:change:tab:title', this._mycallback);
```