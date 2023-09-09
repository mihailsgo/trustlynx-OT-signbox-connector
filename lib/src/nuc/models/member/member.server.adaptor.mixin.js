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

        url: function () {
          var id  = this.get("id"),
              url = this.connector.getConnectionUrl().getApiBase('v2');
          if(!id && this.options.id) {
            id = this.options.id;
          }
          if (id) {
            url = Url.combine(url, "members/" + id + "/members");
          } else {
            url = Url.combine(url, "members");
          }
          return url;
        },

        parse: function (response) {
          var that = this;
          if (response.data !== undefined) {
            var memberId = this.get("id");
            _.each(response.data, function (member) {
              member.parentId = memberId;
            });

            return response;
          }
          return response;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});
