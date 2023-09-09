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
              this.options.node.get('id')), query;
          if (!!this.options.memberId) {
            url += '/permissions/effective/' + this.options.memberId;
            query = Url.combineQueryString(
                {
                  expand: 'permissions{right_id}'
                }, query);
          } else {
            query = Url.combineQueryString(
                {
                  fields: ['properties{container, name, type, versions_control_advanced,' +
                           ' permissions_model}',
                    'permissions{right_id, permissions, type}', 'versions{version_id}'],
                  expand: ['permissions{right_id}']
                }, query);
          }
          if (query) {
            url += '?' + query;
          }

          return url;
        },

        parse: function (response, options) {
          if (!!response.results && !!response.results.data) {
            this.parsePermissionResponse(response, options, this.options.clearEmptyPermissionModel);
            if (!this.options.node.get("isNotFound")) {
              this.nodeName = response.results.data.properties ? response.results.data.properties.name :
                              "";
              if (this.isContainer === undefined || response.results.data.properties) {
                this.isContainer = response.results.data.properties ?
                                   response.results.data.properties.container : true;
              }
              return response.results.data.permissions;
            }
          }
        }
      });
    }

  };

  return ServerAdaptorMixin;
});
