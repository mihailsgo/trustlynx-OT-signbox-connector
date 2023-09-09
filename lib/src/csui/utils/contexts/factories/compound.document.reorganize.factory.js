/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/compound.document/reorganize/reorganize.collection'
], function (require, module, _, Backbone, CollectionFactory, ConnectorFactory,
    ReorganizeCollection) {

  var ReorganizeFactory = CollectionFactory.extend({
    propertyPrefix: 'reorganize',

    constructor: function ReorganizeFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var reorganize = this.options.reorganize || {};
      if (!(reorganize instanceof Backbone.Collection)) {
        var connector  = context.getObject(ConnectorFactory, options),
            config     = module.config(),
            nodeId = options.node.get("id");
            reorganize = new ReorganizeCollection(reorganize.models, _.extend({
            connector: connector,
            nodeId: nodeId
        }, reorganize.options, config.options, {
          autofetch: true,
          autoreset: true
        }));
      }
      this.property = reorganize;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });
  return ReorganizeFactory;
});