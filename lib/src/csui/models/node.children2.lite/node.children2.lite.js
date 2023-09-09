/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/node/node.model', 'csui/models/node.children2/node.children2',
  'csui/models/node.children2.lite/server.adaptor.mixin'
], function (module, _, Backbone, NodeModel, NodeChildren2Collection, ServerAdaptorMixin) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 10
  });

  var NodeChildren2LiteCollection = NodeChildren2Collection.extend({
    model: NodeModel,

    constructor: function NodeChildren2LiteCollection(models, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize
      }, options);

      NodeChildren2Collection.prototype.constructor.call(this, models, options);
    }

  });

  ServerAdaptorMixin.mixin(NodeChildren2LiteCollection.prototype);

  return NodeChildren2LiteCollection;
});