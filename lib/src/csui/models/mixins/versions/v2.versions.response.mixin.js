/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore'
], function (_) {
  'use strict';

  var VersionsV2ResponseMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeVersionableV2Response: function (options) {
          return this;
        },

        parseVersionsResponse: function (response) {
          if (!!response.results && !!response.results.data) {
            if(!!response.results.actions) {
              _parseActions.call(this, response.results.actions, response.results.data.versions);
            }
            return response.results.data.versions;
          }
          return response;
        }

      });
    }
  };
  function _parseActions(actions, version) {
    version.actions = [];
    _.each(actions.data, function (action) {
      action.signature = action.name;
      version.actions.push(action);
    });
  }

  return VersionsV2ResponseMixin;
});
