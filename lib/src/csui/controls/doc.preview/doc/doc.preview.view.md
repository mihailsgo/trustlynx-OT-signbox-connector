# DocpreviewView
 This is an interface that renders the active supported preview view for the given node. Whoever wants to integrate either brava,csv,intelligent viewing, they do not require to integrate the respective view but simply integrate this generic interface.

 # Advantages of having generic view
 It is a common entry point for all modules/products to avail previewing capabilities.

Below is the example for your reference...

```javascript

  ...
  ...
  require(['csui/controls/doc.preview/doc.preview.view'], function (DocumentPreviewView) {
        var documentPreviewView = new DocumentPreviewView({
              model: node,
              context: context,
              originatingView: this
            }),
            docPreviewRegion = new Marionette.Ron({el: this.ui.docPreviewArea});

            docPreviewRegion.show(documentPreviewView);
  });
  ...
  ...
```

## Required parameters

*model - `equired`: (Backbone model) model of the node document.
*context- `required`: context of the current page.
*originatingView - `optional`: (Backbone model) originating view where side panel needs to be rendered.
*resizableWrapperClass - `optional`: (String) class of the element container. Used to modify element width style on expand or collapse
*skipDestroyUponCollectionRequest - `optional`: (Boolean) default value is false, if true, upon collection request, this generic interface won't destroy.


** Listeners
We can still listen all the listenrs from the viewerView. For example

** Generic Listeners
```javascript
this.listenTo(this.genericView.viewerView,'any:event:that:is:supported:by:viewer:plugin:widgetview',this._mycallback);
// `this`- refers to current leading application view
// `this.genericView` - refers to generic interface view
// `this.genericView.viewerView` - refers to the actual document preview view
// `"any:event:that:is:supported:by:viewer:plugin:widgetview"` - refers to the registered events in actual preview
```

** Error Listeners
```javascript
this.listenTo(this.genericView,'error:doc:preview', this._mycallback);
// `this`- refers to current leading application view
// `this.genericView` - refers to generic interface view
// `error:doc:preview` - event registered to be triggered in case of any failures in docPreviewView
// this event is triggered in case of any failures/errors(such as unable to open new doc preview cause of unsupported plugin or error while getting the viewerView) that take place in docPreviewView and an object is passed as argument.
responseObject = {
  status: (string),
  errorCode: (string) error code of the error,
  errorMessage: (string) error description of the error that needs to be displayed
}
```

** Expand/ Collapse Listeners
```javascript
this.genericView.trigger('panel:expand'); //to be triggered in leading application view which renders docPreviewView
this.listenTo(this.genericView.viewerView,'expand:view',this._mycallback); // event has to be registered in respective views
// `this`- refers to current leading application view
// `this.genericView` - refers to generic interface view
// `panel:expand` - event registered to provide expand behaviour on the panel. It has to be triggered when expand is invoked for the panel. Expand provition needs to be available in their viewerView as on triggering this event, it involes `expand:view` in the respective viewerView

this.genericView.trigger('panel:collapse'); //to be triggered in leading application view which renders docPreviewView
this.listenTo(this.genericView.viewerView,'collapse:view',this._mycallback); // event has to be registered in respective views
// `this`- refers to current leading application view
// `this.genericView` - refers to generic interface view
// `collapse:collapse` - event registered to provide collapse behaviour on the panel. It has to be triggered when collapse is invoked for the panel.Collapse provition needs to be available in their viewerView as on triggering this event, it involes `collapse:view` in the respective viewerView
```

** Update model/collection events
```javascript
this.listenTo(this.genericView.viewerView,'update:model',this._mycallback);
this.listenTo(this.genericView.viewerView,'update:collection',this._mycallback);
// `this`- refers to current leading application view
// `this.genericView` - refers to generic interface view
// `this.genericView.viewerView` - refers to the actual document preview view
// `update:model` - event is triggered when docPreviewView is already renderd and another document is selected for viewing. A single model is changed and docPreviewView has to be re-rendered with the changed model. A model object is passed as argument.
this.model: `object` object model of the newly selected document
// `update:collection` - event is triggered when docPreviewView is already renderd and another set of documents are selected for viewing. A collection of models are changed and docPreviewView has to be re-rendered with the changed collection. A collection of models is passed as an argument.
this.selectedNodes : `collection object` collection object of all the newly selected document models
```

