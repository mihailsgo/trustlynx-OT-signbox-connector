/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        prepareRequest: function (options) {
          var credentials = options && options.data ||
                            this.connection.credentials;
          return {
            url: Url.combine(this.connection.url, 'auth'),
            headers: {
              authorization: this.formatAuthorizationHeader(credentials)
            }
          };
        }
      });
    }
  };

  return ServerAdaptorMixin;
});
