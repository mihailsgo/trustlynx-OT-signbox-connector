/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function () {
          return this;
        },

        url: function () {
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'),'members/objecttypes');
        },

        parse: function (response) {
          var returnData = {
            objecttypes: response.results.data && response.results.data.objects
          };
          return returnData;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});
