/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/url',
  'nuc/models/node/node.model', 'nuc/models/nodechildrencolumns',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/mixins/expandable/expandable.mixin', 'nuc/models/browsable/browsable.mixin',
  'nuc/models/browsable/v1.request.mixin', 'nuc/models/browsable/v1.response.mixin'
], function (module, _, Backbone, Url, NodeModel, NodeChildrenColumnCollection,
    NodeResourceMixin, ExpandableMixin, BrowsableMixin, BrowsableV1RequestMixin,
    BrowsableV1ResponseMixin) {

  var NodeChildrenCollection = Backbone.Collection.extend({

    constructor: function NodeChildrenCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeNodeResource(options)
          .makeExpandable(options)
          .makeBrowsable(options)
          .makeBrowsableV1Request(options)
          .makeBrowsableV1Response(options);

      this.columns = new NodeChildrenColumnCollection();
    },

    isFetchable: function () {
      return this.node.isFetchable();
    },

    url: function () {
      var query = Url.combineQueryString({
            extra: false,
            actions: false
          },
          this.getBrowsableUrlQuery(),
          this.getExpandableResourcesUrlQuery());
      return Url.combine(this.node.urlBase(),
          query ? '/nodes?' + query : '/nodes');
    },

    parse: function (response, options) {
      this.parseBrowsedState(response, options);
      this.columns && this.columns.resetColumns(response, this.options);
      return this.parseBrowsedItems(response, options);
    }

  });

  BrowsableMixin.mixin(NodeChildrenCollection.prototype);
  ExpandableMixin.mixin(NodeChildrenCollection.prototype);
  NodeResourceMixin.mixin(NodeChildrenCollection.prototype);
  BrowsableV1RequestMixin.mixin(NodeChildrenCollection.prototype);
  BrowsableV1ResponseMixin.mixin(NodeChildrenCollection.prototype);

  return NodeChildrenCollection;

});
