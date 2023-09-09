/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/url',
  'nuc/models/node/node.model',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/node.addable.type/server.adaptor.mixin'
], function (_,
    Backbone,
    Url,
    NodeModel,
    NodeResourceMixin,
    ServerAdaptorMixin) {
  'use strict';

  var AddableTypeModel = Backbone.Model.extend({

    defaults: {
      type: null,
      type_name: null
    },

    idAttribute: 'type',

    constructor: function AddableTypeModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var NodeAddableTypeCollection = Backbone.Collection.extend({

    model: AddableTypeModel,

    constructor: function NodeAddableTypeCollection(models, options) {
      NodeAddableTypeCollection.__super__.constructor.apply(this, arguments);

      this.makeNodeResource(options)
        .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.models, {node: this.node});
    },

    isFetchable: function () {
      return this.node.isFetchable();
    }

  });

  NodeResourceMixin.mixin(NodeAddableTypeCollection.prototype);
  ServerAdaptorMixin.mixin(NodeAddableTypeCollection.prototype);

  return NodeAddableTypeCollection;

});
