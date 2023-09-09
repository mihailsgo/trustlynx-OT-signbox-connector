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
          var url = this.connector.connection.url;
          var id = this.groupId;
          if (id === undefined || id === null) {
            id = this.parentId;
            this.topCount = 20;
          }
          if (!this.topCount) {
            this.topCount = 20;
          }
          var query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              {
                expand: 'properties{group_id}'
              }
          );
          query = query.replace('where_name', 'query');
          url = this.connector.getConnectionUrl().getApiBase('v2');

          if (this.type && this.type === 'GroupsOfCurrentUser') {
            url = Url.combine(url, "members/memberof?" + query);
          } else if (this.type === 1 && id) {
            url = Url.combine(url, "members/" + id + "/members?where_type=1&" + query);
          } else if (this.type === 1) {
            url = Url.combine(url, "members?where_type=1&" + query);
          } else if (id) {
            url = Url.combine(url, "members/" + id + "/members?" + query);
          } else {
            url = Url.combine(url, "members?" + query);
          }
          return url;
        },

        parse: function (response, options) {
          if (!_.isEmpty(response.results)) {
            var self = this;
            this.totalCount = (response.collection && response.collection.paging) ?
                              response.collection.paging.total_count :
                              response.results.length;
            _.each(response.results, function (member) {
              member.parentId = self.parentId;
              member = _.extend(member, member.data.properties);
            });

            return response.results;
          }
          this.totalCount = 0;
          return null;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});
