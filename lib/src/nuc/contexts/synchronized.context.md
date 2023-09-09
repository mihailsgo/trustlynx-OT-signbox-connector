# SynchronizedContext

A specialized derivation of Context. SynchronizedContext synchronizes
the process of setting (set/reset) the fetched data on the participating
objects (models or collections).

The fetches are performed on cloned models or collections, to which
no marionette views listen for changes and therefore render is not
triggered when these fetch calls return with new data from the server.
When all fetches are completed, the data from the cloned models or 
collections are "copied" to the original models or collections by calling
'set' or 'reset'. This happens in a synchronous loop for all models and
collections. This also means that views bound to the participating models
or collections are rendered in a single javascript thread (as long as none of the views do something 
asynchronously - marionette views don't) and when that is finished the
browser gets back control and starts displaying the updated DOM.

**Note:** due to the fact that the original models or collections are not
fetched, it must not expected that 'request' or 'sync' gets triggered.
Views must rely only on set/change/reset events.

It is also important that the clone method of the participating models or
collections clone all necessary attributes to be able to fetch the correct
data from the server.

For backward compatibility reason it is possible to enable 
triggering 'request' and 'sync' on the source context, which
makes it easier for example to enable and disable blocking view.

**Example:**

```javascript
  var context = new PageContext();
  var container = context.getModel(NodeModelFactory, {node: {attributes: {id: 2000}}});
  var childrenCollection = context.getCollection(Children2CollectionFactory, 
      {options: {node: container}}
  );

// Create a new synchronized context:
// Specify the source context, which has already the models or collections
// that are listed in the second parameter.
// options in the third parameter:
// triggerEventsOnSourceContext: if true, request and sync are triggered
// on the 'source' context (the context specified in the first parameter)
  synchronizedContext = new SynchronizedContext(
      context,
      [container, childrenCollection], 
      {triggerEventsOnSourceContext: true});

  synchronizedContext.fetch()
      .then(function () {
        console.log("Context fetched - all models/collections are fetched");
      })
      .catch(function (reason) {
        console.log("Context fetch failed:");
        console.log(reason);
      })

```
A complete working example is ```pages/debug/synchronized_context.html````.
``