# Configuration

## BreadCrumbCollectionView

<p>Marionette Collection view that provides a view to display current location of the page rendered
  within a navigational hierarchy to access the parent locaions.</p>

### Example for using SmartControls Breadcrumbs view

```js
....
....
define(['smart/controls/breadcrumbs/breadcrumbs.view'], function (SmartBreadcrumbsView) {
 var BreadCrumbCollectionView = SmartBreadcrumbsView.extend({
    constructor: function BreadcrumbCollectionView(options) {
      SmartBreadcrumbsView.prototype.constructor.call(this, options);

      // listening events provided by SmartControls for customized logic
      this.listenTo(this, 'before:synchronized', this._mycallback));
      this.listenTo(this, 'childview:click:ancestor', this._mycallback);
    },

    refresh: function(){
      ...
      this.trigger("readjust:breadcrumbs");
      ...
    },

    _mycallback:  function(){
      ...
      this.trigger("sync:collection");
      ...
    }

 });
....
....
```

## Parameters

<ul>
  <li><b>collection - `required` (Backbone collection)</b> Simplified node model schema.</li>
  <li><b>fetchOnCollectionUpdate - `optional`( Boolean)</b> To prevent the control from an extra
    fetching of the collection.
  </li>
  <li><b>stop - `optional` (Backbone Model)</b>Node model of breadcrumb till where breadcrumbs need to be removed</li>
   <li><b>theme - `optional` (String)</b>Default light theme applies. Supported themes are dark/light only.</li>
</ul>

## Public Methods

<ul>
  <li><b>isTabable():</b> Checks if element is tabable region or not. Returns boolean variable.</li>
  <li><b>currentlyFocusedElement():</b> Checks element that is currently focused which is tabable.
  </li>
  <li><b>onKeyInView():</b> Performs keyboard navigation according to key event and updates the
    currently focused element.
  </li>
  <li><b>refresh():</b> Reloads breadcrumb view and adjusts width according to available width.</li>
  <li><b>onChildviewClickAncestor():</b> Triggers event `click:ancestor` which needs to be listened
    in respective view and perform action.
  </li>
</ul>


## Events

<ul>
<li><b>click:ancestor</b> An event registered that is to be triggered when an ancestor node is clicked</li>
</ul>

```js
this.listenTo(this.breadCrumbsView, "childview:click:ancestor", this._mycallback);
```

<ul>
<li><b>before:synchronized</b> An event registered that is to be triggered when collection needs to be updated</li>
</ul>

```js
this.listenTo(this.breadCrumbsView, "before:synchronized", this._mycallback);
```

<ul>
<li><b>readjust:breadcrumbs</b> An event to be triggered when breadcrumbs needs to be adjusted </li>
</ul>

```js
this.breadCrumbsView.trigger("readjust:breadcrumbs");
```

<ul>
<li><b>sync:collection</b> An event to be triggered when breadcrumbs collection needs to be snychronized. Options: (Boolean) </li>
</ul>

```js
this.breadCrumbsView.trigger("sync:collection",true);
```
