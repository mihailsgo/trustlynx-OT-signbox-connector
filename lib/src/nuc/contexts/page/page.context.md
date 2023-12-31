PageContext
===========

The simplest context, which can include and fetch models and collections, but
does not provide any other functionality. If you use it with widgets, which
expect changes based on their context-changing models, you will have to
handle these changes yourself.

```javascript
csui.require([
  'nuc/widgets/shortcut/shortcut.view',
  'nuc/contexts/page/page.context',
  'nuc/contexts/factories/next.node',
  'nuc/lib/marionette'
], function (ShortcutView, PageContext, NextNodeModelFactory, Marionette) {
  'use strict';

  var context = new PageContext(),
      nextNode = context.getModel(NextNodeModelFactory),

      region = new Marionette.Region({
        el: '#content'
      }),
      view = new ShortcutView({
        context: context,
        data: {
          type: 141
        }
      });

  // Perform some action if the widget triggered contextual node change
  nextNode.on('change:id', function () {
    alert('Node ID:' + nextNode.get('id'));
  });

  region.show(view);
  context.fetch();

});
```

Plugins
-------

Plugins descended from `ContextPlugin` (nuc/contexts/context.plugin) can be registered. They will be constructed and stored with the context instance. They can override the constructor and the method `isFetchable(factory)`.
