# Context Fragment

The context fragment can be used to fetch data for a dynamically added widget, instead of fetching the whole context, which would re-fetch data for widget created earlier.

    // Subscribe a context fragment to the context, before
    // a new widget is constructed and rendered.
    contextFragment = new ContextFragment(context);
    // Create the widget and render it to get the new models
    // added to the context and to the context fragment too.
    ...
    // Fetch only the new models. The new widget will update
    // the displayed information as it is needed.
    contextFragment.fetch();
    // Unsubscribe the context fragment from the context,
    // when it is not needed any more.
    contextFragment.destroy() // Unsubscribe the fragment.

## Details

The context supports two scenarios for changing the page content:

* refresh  - the page (views) will be reused, only the data will be reloaded
* exchange - the page will be rebuilt (current views will be destroyed and new
             ones will be created) and new data wil be loaded

There is one more scenario, which you may see on the page:

* grow     - new content (views) will be added to the page, which needs to
             load a new data, but the old data do not need to be reloaded

New views usually load the new data by `ensureFetched` and the context does not
need to be involved in fetching the data. However, shared components might be
used to add the new content, which depend in the context to load their data.
Because only the owning view knows what part of the context will have to be
fetched, it is responsible for collecting a fragment of factories for fetching:

    // render a new page
    context.getObject(...) // get objects from the context
    context.fetch()        // fetch collected factories
    // work with the page   <--------------------------------+
    // introduce new content to the page                     |
    new ContextFragment(context) // remember new objects     |
    context.getObject(...)       // add other objects        |
    contextFragment.fetch()      // load new data            |
    contextFragment.destroy()    // stop context watching  --+

No factories are removed, when a context fragment is fetched and destroyed:

| operation / flag | refresh (fetch) | exchange (clear + fetch) | grow (fragment fetch + destroy) |
|:----------------:|:---------------:|:------------------------:|:-------------------------------:|
|    permanent     |      stay       |           stay           |              stay               |
|     normal       |      stay       |           drop           |              stay               |
|    temporary     |      drop       |           drop           |              stay               |

The fetchability of factories follows the rules which the context declared.
In addition to the static rules below, the actual fetchability is checked by
the `isFetchable` method of the context:

| method / flag |   fetch   | fragment fetch |
|:-------------:|:---------:|:--------------:|
|   permanent   |  allowed  |    allowed     |
|    normal     |  allowed  |    allowed     |
|   temporary   |  N/A (*)  |   forbidden    |
|   detached    | forbidden |   forbidden    |

(*) Temporary factories are removed from the context when the `fetch` method
    starts executing. It does not make sense to discuss their fetchability.

## Methods

### constructor(context)

Start watching the original context for new factories.

### fetch(options): Promise

Fetches all objects in the context fragment, which are fetchable by their
originating context.  The options will be passed to the `fetch` methods in
factories that take care of the fetchable objects.

### clear(): void

Discards all objects from the context fragment. The context fragment
remains subscribed to the context.

### destroy(): void

Stops watching the original context for new factories. The context fragment
will not be usable any more.

## Properties

### fetching: Promise?

The promise returned by `fetch` during fetching or `null` if no fetching is
in progress.

### fetched: boolean

`true` if the most recent `fetch` succeeded, `false` if the context has not
been fetched yet, or fetching is in progress, or it failed.

### error: Error

`null` if the most recent `fetch` succeeded, or fetching is in progress, or
the context has not been fetched yet, an instance of `Error` if the most
recent `fetch` failed.

## Events

### 'request', context

The context fragment is going to be fetched. This event is triggered on the
original context too. The `fetching`, `fetched` and `error` properties on the
original context are not modified.

### 'sync', context

Fetching the context fragment succeeded. This event is triggered on the
original context too. The `fetching`, `fetched` and `error` properties on the
original context are not modified.

### 'error', error, context

Fetching the context fragment failed. This event is triggered on the original
context too. The `fetching`, `fetched` and `error` properties on the original
context are not modified.

### 'add:factory', context, propertyName, factory

A new factory has been added to the context fragment.

### 'before:clear', context

The context fragment is going to be cleared.

### 'clear', context

The context fragment has been cleared.

### 'destroy', context

The context fragment has been destroyed.
