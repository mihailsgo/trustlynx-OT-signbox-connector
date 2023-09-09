/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url', 'i18n!csui/models/impl/nls/lang'
], function ($, _, Url, lang) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'),
          'multipart/settings');
        },

        parse: function (response) {
          var res = response.results.data, returnData;

          returnData = {
            largeFileSettings: {
              is_enabled: res.is_enabled,
              max_size: res.max_size,
              min_size: res.min_size
            }
          };
          return returnData;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});
