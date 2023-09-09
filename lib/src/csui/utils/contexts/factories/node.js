/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'csui/utils/contexts/mixins/clone.and.fetch.mixin',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'nuc/models/node/node.model',
  'csui/utils/commands'
], function (module, $, Backbone, CloneAndFetchMixin, ModelFactory,
    ConnectorFactory, NodeModel, commands) {
  'use strict';

  var NodeModelFactory = ModelFactory.extend({
    propertyPrefix: 'node',

    constructor: function NodeModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var node = this.options.node || {},
          config = module.config();
      if (!(node instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            creationOptions = $.extend(true, {
              connector: connector,
              fields: {
                properties: [],
                'versions.element(0)': ['owner_id']
              },
              expand: {
                properties: ['original_id']
              },
              stateEnabled: true,
              commands: commands.getAllSignatures()
            }, config.options, node.options);
        node = new NodeModel(node.attributes || config.attributes,
            creationOptions);
      }
      this.property = node;

      this.makeCloneAndFetch(options);
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  CloneAndFetchMixin.mixin(NodeModelFactory.prototype);

  return NodeModelFactory;
});
