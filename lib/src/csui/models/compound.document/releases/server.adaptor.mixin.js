/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
], function (_, $, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function () {
          return this;
        },
        url: function () {
          var apiUrl = new Url(this.connector.connection.url).getApiBase(2), url;
          var query = Url.combineQueryString(
            this.getBrowsableUrlQuery(),
            this.getRequestedCommandsUrlQuery(),
            this.getExpandableResourcesUrlQuery(),
            this.getAdditionalResourcesUrlQuery(),
            this.getStateEnablingUrlQuery(),
            this.getResourceFieldsUrlQuery(),
            {
              expand: 'properties{create_user_id,locked_user_id}',
            }
          );
          url = Url.combine(apiUrl, 'nodes', this.options.node.get('id'), 'releases?' + query);
          return url;
        },

        parse: function (response, options) {
          var releaseCollection = [], collection = response.results;
          this.parseBrowsedState(response, options);
          this.columns && this.columns.resetColumnsV2(response, this.options);
          $.each(collection, function (id) {
            var nodeProperties = collection[id].data.properties;
            releaseCollection.push({
              type: nodeProperties.type,
              type_name:nodeProperties.type_name,
              name: nodeProperties.name,
              release_value: nodeProperties.release + "." + nodeProperties.revision,
              created: nodeProperties.create_date,
              createdBy: nodeProperties.create_user_id_expand.name,
              id: nodeProperties.id,
              locked: nodeProperties.locked,
              locked_user_id_expand: nodeProperties.locked && nodeProperties.locked_user_id_expand,
              reserved_user_id_expand: nodeProperties.locked && nodeProperties.reserved_user_id_expand,
              locked_date: nodeProperties.locked_date,
              container: nodeProperties.container,
              openable: true,
              favorite: nodeProperties.favorite,
              actions: collection[id].actions,
              locked_user_id: nodeProperties.locked && nodeProperties.locked_user_id
            });
          });
          return releaseCollection;
        },

        isFetchable: function () {
          return !!this.options;
        },
      });
    }
  };
  return ServerAdaptorMixin;
});