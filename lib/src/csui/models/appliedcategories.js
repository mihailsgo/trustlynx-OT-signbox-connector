/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/node.resource/node.resource.mixin',
  'csui/models/appliedcategory', 'csui/models/appliedcategories/server.adaptor.mixin'
], function (_, Backbone, Url, NodeResourceMixin, AppliedCategoryModel, ServerAdaptorMixin) {
  'use strict';

  var AppliedCategoryCollection = Backbone.Collection.extend({

    model: AppliedCategoryModel,

    constructor: function AppliedCategoryCollection(models, options) {
      options || {};
      this.sortInitially = !!options.sortInitially ? options.sortInitially :
                           this.sortInitially;

      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeNodeResource(options);
    },

    clone: function () {
      return new this.constructor(this.models, {node: this.node});
    }

  });

  NodeResourceMixin.mixin(AppliedCategoryCollection.prototype);
  ServerAdaptorMixin.mixin(AppliedCategoryCollection.prototype);

  return AppliedCategoryCollection;

});
