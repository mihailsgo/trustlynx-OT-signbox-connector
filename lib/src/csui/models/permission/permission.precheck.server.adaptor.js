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
          var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), 'nodes',
              this.get("id"), '/descendents/subtypes/exists');
          if (this.get("subType") !== undefined) {
            url = Url.appendQuery(url, 'sub_types=' + this.get("subType"));
          }
          if (this.get("include_sub_items")) {
            url = Url.appendQuery(url, 'include_sub_items=' + this.get("include_sub_items"));
          }
         return url;
        },

        parse: function (response, options) {
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});