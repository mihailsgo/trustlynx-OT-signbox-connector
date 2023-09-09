/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'csui/utils/contexts/mixins/clone.and.fetch.mixin',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/node',
  'nuc/models/node.children2/node.children2', 'csui/utils/commands'
], function (module, _, Backbone, CloneAndFetchMixin,
    CollectionFactory, NodeModelFactory,
    NodeChildren2Collection, allCommands) {
  'use strict';

  var Children2CollectionFactory = CollectionFactory.extend({
    propertyPrefix: 'children2',

    constructor: function Children2CollectionFactory(context, options) {
      options || (options = {});
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var children = this.options.children2 || {},
          commands = children.options && children.options.commands ||
                     allCommands;
      if (!(children instanceof Backbone.Collection)) {
        var node = context.getModel(NodeModelFactory, options),
            config = module.config();
        children = new NodeChildren2Collection(children.models,
            _.defaults({
                  autoreset: true,
                  fields: {
                    properties: []
                  },
                  expand: {
                    properties: ['original_id']
                  },
                  stateEnabled: true,
                  commands: Array.isArray(commands) ? commands : commands.getAllSignatures()
                },
                config.options,
                children.options,
                {useSpecialPaging: options.useSpecialPaging},
                {node: node}
            ));
      }
      this.property = children;

      this.makeCloneAndFetch(options);
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });

  CloneAndFetchMixin.mixin(Children2CollectionFactory.prototype);

  return Children2CollectionFactory;
});
