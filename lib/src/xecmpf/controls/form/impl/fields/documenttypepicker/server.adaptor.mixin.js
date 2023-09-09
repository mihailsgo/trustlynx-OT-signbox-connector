/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {

        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          var query = Url.combineQueryString(
              {
                skip_validation: true,
                document_type_rule: false,
                document_generation_only: false,
                sort_by: 'DocumentType'
              }
          );
          return Url.combine(apiUrl, 'businessworkspaces', this.businessWorkspaceId,
              'doctypes?' + query);
        },

        parse: function (response, options) {
          return response.results;
        },

        isFetchable: function () {
          return !!this.options;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});