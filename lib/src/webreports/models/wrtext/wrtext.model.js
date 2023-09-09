/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/backbone',
  'webreports/utils/url.webreports',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin'
], function (_, Backbone, UrlWebReports, ConnectableMixin, FetchableMixin) {

  var WrTextModel = Backbone.Model.extend({
    constructor: function WrTextModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
        this.makeConnectable(options);

        this.makeFetchable(options);
    },
      url: function () {

          var parameters = this.get('parameters'),
              context = this.get('context'),
              query = '';
          query = UrlWebReports.appendWebReportParameters(query, parameters);
          query = UrlWebReports.appendCurrentContainer(query, context);
          return UrlWebReports.combine(this.connector.connection.url + '/nodes/' + this.get('id'),
                  query ? '/output?format=webreport&' + query : '/output?format=webreport');
      },
    parse: function (response) {
      return {source: response};
    }

  });

  ConnectableMixin.mixin(WrTextModel.prototype);
  FetchableMixin.mixin(WrTextModel.prototype);

  return WrTextModel;

});
