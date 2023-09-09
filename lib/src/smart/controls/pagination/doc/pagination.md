# Configuration

## Pagination Smart Control​

<p>Marionette view that provides a pagination bar at the bottom of a respective data table.​</p>

**Module: smart/controls/pagination/nodespagination.**

### Example for using SmartControls Pagination view

```js


define(['smart/controls/pagination/nodespagination.view'], function (SmartPaginationView) {
      var NodesPaginationView = SmartPaginationView.extend({   
       constructor: function NodesPaginationView(options) {
      if (options.collection) {
        this.listenTo(options.collection, 'collection:set:limit',
            _.bind(this._mycallback, this));
        if (options.collection.node) {
          this.listenTo(options.collection.node, 'change:id', this._mycallback);
        }
      }
      SmartPaginationView.prototype.constructor.call(this, options);
    
    },

    _mycallback:  function(){
      ...
      ...
    
      });
    
      return NodesPaginationView;
    });

```

## Parameters

<ul>
  <li><b>collection - `required`</b> (NodeChildren collection)</li>
  <li><b>ddList - `optional`</b>Page size dropdown list, default is [30, 50, 100] </li>
  <li><b>pageNumber - `optional`</b>Displays the respective page, default is 1.</li>
  <li><b>aboutPrefix - `optional`(Boolean)</b>Default: true, it adds "About" prefix. If false, then it won't add "About" prefix to total count label.</li>
</ul>

## Public Methods

<ul>
  <li><b>collectionChange():</b> Resets collection and recalculate pagesize.</li>
  <li><b>nodeChange():</b>  Refreshes all setting for the new node.</li>
  <li><b>onChangePage():</b> Event handler, called when user clicked the page-number-link</li>
  <li><b>changePage():</b> Calls setLimit at the collection to request the new data from the server..</li>
  <li><b>resetCollection():</b> Sets the new offset to the children collection and let it load new data from server</li>
   <li><b>onDomRefresh():</b> Account for Window resizing effecting the appearance of the pagination bar.</li>
  <li><b>onSlidePageMenu():</b>  Called on clicking the previous and Next slide buttons.</li>
  <li><b>onKeyInView():</b> Event handler, called when user does keyboard navigation</li>
  <li><b>resetPageSize():</b> Resets the collection upon changing the number of items per page.</li>
</ul>


## Events

<ul>
<li><b>reset</b> Listening to reset event on collection</li>
</ul>

```js
  this.listenTo(this.collection, 'reset', this._mycallback);
```
<ul>
<li><b>add</b> Listening to add event on collection, after item upload</li>
</ul>

```js
  this.listenTo(this.collection, 'add', this._mycallback);
```
<ul>
<li><b>remove</b> Listening to remove event on collection, after item delete</li>
</ul>

```js
  this.listenTo(this.collection, 'remove', this._mycallback);
```
<ul>
<li><b>paging:change</b> Listening to paging:change event on collection, after changing page</li>
</ul>

```js
  this.listenTo(this.collection, 'paging:change', this._mycallback);
```
<ul>
<li><b>reset:attributes</b> Listening to reset:attributes event, to reset the attributes of page navigation and pagesize menu</li>
</ul>

```js
  this.listenTo(this, 'reset:attributes', this._mycallback);
```
<ul>
<li><b>new:page</b> An event is triggered when clicked on page link and before resetting the collection</li>
</ul>

```js
this.collection.trigger('new:page');
```
<ul>
<li><b>pagesize:updated</b> An event is triggered after updating the page size</li>
</ul>

```js
this.trigger('pagesize:updated', this);
```
<ul>
<li><b>render:complete</b> An event is triggered after pagination view is rendered</li>
</ul>

```js
this.trigger('render:complete');
```
<ul>
<li><b>collection:set:limit</b> An event is triggered when page or page size is changed</li>
</ul>

```js
 this.collection.trigger('collection:set:limit', skipItems, pageSize, autoFetch);
```

```js
 this.listenTo(this.collection, 'collection:set:limit', _.bind(this._mycallback, this));
```
