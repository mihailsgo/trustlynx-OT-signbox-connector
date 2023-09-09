/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/models/facets',
  'csui/models/mixins/node.resource/node.resource.mixin',
  'csui/models/node.facets2/server.adaptor.mixin',
  'csui/utils/deepClone/deepClone'
], function (_, FacetCollection, NodeResourceMixin, ServerAdaptorMixin) {
  'use strict';

  var NodeFacet2Collection = FacetCollection.extend({
    constructor: function NodeFacet2Collection(models, options) {
      FacetCollection.prototype.constructor.apply(this, arguments);
      this.makeNodeResource(options)
          .makeServerAdaptor(options);
    },

    isFetchable: function () {
      return this.areFacetsFetchable(this);
    },

    clone: function () {
      return new this.constructor(this.models, {
        node: this.node,
        itemsToShow: this.itemsToShow,
        facetIds: this.facetIds,
        filters: _.deepClone(this.filters)
      });
    }
  });

  NodeResourceMixin.mixin(NodeFacet2Collection.prototype);
  ServerAdaptorMixin.mixin(NodeFacet2Collection.prototype);

  return NodeFacet2Collection;
});
