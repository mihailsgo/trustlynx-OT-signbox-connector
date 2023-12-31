/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/node',
  'conws/models/workspacecontext/impl/workspacecontext.node.model'
], function (_,
    ModelFactory,
    ConnectorFactory,
    NodeModelFactory,
    WorkspaceContextNodeModel) {

  var WorkspaceContextNodeFactory = ModelFactory.extend({

    propertyPrefix: 'workspaceContextNode',

    constructor: function WorkspaceContextNodeFactory(context, options) {
      var creatorReference = options.creatorReference;
      delete options.creatorReference
      delete options.workspaceContextNode.creatorReference;

      ModelFactory.prototype.constructor.apply(this, arguments);

      var node = options.workspaceContextNode.node || context.getModel(NodeModelFactory, options),
          connector = options.workspaceContextNode.connector || context.getObject(ConnectorFactory, options);

      this.property = new WorkspaceContextNodeModel({},{
        creatorReference: creatorReference,
        connector: connector,
        node:node,
        context: options.context
      });

    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return WorkspaceContextNodeFactory;

});
