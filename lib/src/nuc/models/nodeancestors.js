/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/url', 'nuc/utils/log', 'nuc/models/ancestor',
  'nuc/models/ancestors', 'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/node.ancestors/server.adaptor.mixin'
], function (module, _, $, Backbone, Url, log, AncestorModel,
    AncestorCollection, NodeResourceMixin, ServerAdaptorMixin) {
  'use strict';

  var NodeAncestorCollection = AncestorCollection.extend({

    constructor: function NodeAncestorCollection(models, options) {
      AncestorCollection.prototype.constructor.apply(this, arguments);

      this.makeNodeResource(options)
        .makeServerAdaptor(options);

    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },

    isFetchable: function () {
      return this.node.isFetchable();
    }

  });

  NodeResourceMixin.mixin(NodeAncestorCollection.prototype);
  ServerAdaptorMixin.mixin(NodeAncestorCollection.prototype);

  return NodeAncestorCollection;

});
