/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/models/mixins/connectable/connectable.mixin',
    'csui/models/mixins/fetchable/fetchable.mixin',
    'csui/utils/url'
  ], function (_, $, Backbone, ConnectableMixin, FetchableMixin, Url) {
    var SearchFormModel = Backbone.Model.extend({

      constructor: function SearchFormModel(attributes, options) {
        this.options = options || (options = {});
        Backbone.Model.prototype.constructor.call(this, attributes, options);
        this.makeConnectable(options).makeFetchable(options);
      }
    });

    ConnectableMixin.mixin(SearchFormModel.prototype);
    FetchableMixin.mixin(SearchFormModel.prototype);

    _.extend(SearchFormModel.prototype, {

      isFetchable: function () {
        return this.options.node.isFetchable();
      },

      url: function () {
        return Url.combine(this.connector.connection.url,
            'searchtemplates/' + this.get('id'));
      },

      parse: function (response, options) {
        response.name = response.text;
        return response;
      }
    });

    return SearchFormModel;
  });