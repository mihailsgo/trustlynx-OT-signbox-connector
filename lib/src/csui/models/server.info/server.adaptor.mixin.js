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
          var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v1'), 'serverInfo');
          return url;
        },
        parse: function (response) {
          this._changing = false;
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});