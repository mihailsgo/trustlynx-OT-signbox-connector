/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore',  'csui/lib/backbone', 'csui/utils/url',
  'csui/models/node/node.model', 'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin', 'csui/models/browsable/client-side.mixin',
  'csui/models/browsable/v2.response.mixin'
], function (module, _,  Backbone, Url, NodeModel, ConnectableMixin, FetchableMixin,
  ClientSideBrowsableMixin, BrowsableV2ResponseMixin) {
  "use strict";

  var moduleConfig = module.config() || {};
  var BusinessObjectTypesCollection = Backbone.Collection.extend({

    model: NodeModel,

    constructor: function BusinessObjectTypesCollection(models, options) {
      _.defaults(options, { orderBy: '' });
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeConnectable(options)
        .makeFetchable(options)
        .makeClientSideBrowsable(options)
        .makeBrowsableV2Response(options);
    },

    url: function () {
      var orderBy = '';
      if (this.orderBy) {
        var first = this.orderBy.split(",")[0].split(" ");
        orderBy = (first[1] || 'asc') + "_" + first[0];
      }
      var url = this.connector.getConnectionUrl().getApiBase('v2'),
        query = Url.combineQueryString({
          fields: ['properties'],
          expand: 'properties{original_id}',
          orderBy: orderBy,
          actions: ''
        });
      var queryPart = "/nodes/" + moduleConfig.parentId + "/nodes";
      return Url.appendQuery(Url.combine(url, queryPart), query);
    },

    parse: function (response, options) {
      this.parseBrowsedState(response, options);
      this.parseBrowsedItems(response, options);
      response.results.reverse();
      return response.results;
    }

  });

  ClientSideBrowsableMixin.mixin(BusinessObjectTypesCollection.prototype);
  BrowsableV2ResponseMixin.mixin(BusinessObjectTypesCollection.prototype);
  ConnectableMixin.mixin(BusinessObjectTypesCollection.prototype);
  FetchableMixin.mixin(BusinessObjectTypesCollection.prototype);

  return BusinessObjectTypesCollection;

});
