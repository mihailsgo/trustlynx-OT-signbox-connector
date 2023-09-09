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
              this.options.nodeId), query;
          query = Url.combineQueryString(
              {
                fields: ['permissions{right_id, permissions, type}'],
                expand: 'permissions{right_id}'
              }, query);
          if (query) {
            url += '?' + query;
          }
          return url;
        },

        parse: function (response, options) {
          this.filterGroups(response);
          return response.aclGroups;
        },

        filterGroups: function (response) {
          var selectableMembers = response.results.data && response.results.data.permissions,
              selectableGroups  = [];
          _.each(selectableMembers, function (member) {
            if (member.right_id_expand &&
                member.right_id_expand.type === 1) {
              var group = {};
              group = member.right_id_expand;
              group.data = {};
              group.data.properties = member.right_id_expand;
              selectableGroups.push(group);
            }
          });
          response.aclGroups = selectableGroups;
          return response;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});
