/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function (options) {

          var restUrl = Url.combine(this.connector.getConnectionUrl().getApiBase('v2'),
              'eventactioncenter/eventdefinitions');
          return restUrl;

        },

        parse: function (response) {
          this.options.fetched = false;
          var rs = {};
          rs.data = {};
          for (var key in response.results.data) {
            var results = response.results.data[key].filter(function (res) {
              return res.status === 0;
            });
            rs.data[key] = results;

          }
          return rs;

        }
      });
    }

  };

  return ServerAdaptorMixin;
});
