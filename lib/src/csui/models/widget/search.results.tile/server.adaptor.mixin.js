/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url', 'csui/models/node.columns2'
], function (_, Backbone, Url, NodeColumn2Collection) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var originalSync = prototype.sync;

      return _.extend(prototype, {
        filterQueryParameterName: 'filter',

        makeServerAdaptor: function (options) {
          return options;
        },

        cacheId: '',

        url: function () {
          var url = this.connector.getConnectionUrl().getApiBase('v2');
          return Url.combine(url, 'search');
        },

        sync: function (method, model, options) {
          var queryData = {
            query_id: this.options.query_id
          };
          
          if (this.options.limit) {
            queryData.limit = this.options.limit;
            queryData.page = this.skipCount ? (Math.floor(this.skipCount / this.options.limit)) + 1 : 1;
          }
          _.extend(queryData, this.getBrowsableParams()); // returns object containing browsable_params
          _.extend(queryData, this.getRequestedCommandsUrlQuery());
          _.extend(queryData, this.getResourceFieldsUrlQuery());
          _.extend(queryData, this.getStateEnablingUrlQuery());
          if (!!this.prevTopCount && this.prevTopCount != this.topCount) {
            this.activePageNumber = 1;
          }
          this.prevTopCount = this.topCount;
          if (!!this.activePageNumber) {
            queryData.page = this.activePageNumber;
            queryData.skipCount = (this.activePageNumber - 1) * this.topCount;
          }

          if (this.options.isTileView) {
            queryData.fields = 'properties{container,id,parent_id,name,type,type_name,custom_view_search,version_number}';
          } else {
            queryData.expand = 'properties{original_id,owner_user_id,create_user_id,owner_id,reserved_user_id,parent_id,locked_user_id}';
          }
          if ((!!this.orderBy || !!this.pagination) && !!this.cacheId) {
            queryData.cache_id = this.cacheId;
            this.pagination = false; // reset pagination to default.
          }
          _.extend(options, {
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            data: queryData,
            traditional: true
          });

          return originalSync.apply(this, arguments);
        },

        parse: function (response, options) {
          this.addRegionsToPromotedList(response.featured);
          if (response.collection.searching) {
            var sortedColumns = new NodeColumn2Collection();
            var regionMetadata = _.clone(response.collection.searching.regions_metadata),
              metadataOrder = _.clone(_.uniq(response.collection.searching.regions_order)),
              columnDefinitions = [];
            _.each(regionMetadata, function (data, key) {
              var sequence = 500 + metadataOrder.indexOf(key);
              data.definitions_order = sequence;
              data.key = key;
              data.sortable = false;
              data.column_key = key;
              data.column_name = key;
              data.default_action = ["OTLocation", "OTName", "OTMIMEType"].indexOf(key) >= 0;
              data.default = ["OTLocation", "OTName", "OTMIMEType"].indexOf(key) >= 0;
              data.completeName = data.name;
              data.titleAttr = data.name.replace(/:([^\s])/, ': $1');
              data.name = data.name && data.name.replace(/^[^:]*:\s*/, '');
              columnDefinitions.push(data);
            });
            columnDefinitions.push({
              "key": "favorite",
              "column_key": "favorite",
              "default": true
            });
            columnDefinitions.push({
              "key": "reserved",
              "column_key": "reserved",
              "default": true
            });
            var metadata = _.pluck(response.results, 'search_result_metadata'),
              nodesWithVersion = _.where(metadata, { current_version: false });
            nodesWithVersion = nodesWithVersion.length ? nodesWithVersion :
              _.where(metadata, { version_type: 'minor' });
            if (nodesWithVersion && nodesWithVersion.length > 0) {
              columnDefinitions.push({
                "key": "version_id",
                "column_key": "version_id"
              });
            }
            sortedColumns.reset(columnDefinitions);
            response.collection.searching.sortedColumns = sortedColumns;
            _.each(response.results, function (model) {
              if (model.data.versions && model.search_result_metadata &&
                (model.search_result_metadata.current_version === false ||
                  model.search_result_metadata.version_type === 'minor')) {
                model.data.versions.current_version = false;
              }
            });
          }
          var sorting = response.collection.sorting.links;
          for (var sort in sorting) {
            if (sort.search("asc_") === 0) {
              var sortColumn = this.trimSortOptionName(sorting[sort].name);
              sortColumn = sortColumn.trim();
              var column = response.collection.searching.sortedColumns.where({ completeName: sortColumn });
              (column && column.length > 0) ? column[0].set('sort', true) : '';
            }
          }
          response.results = (response.featured && response.collection.sorting &&
            response.collection.sorting.sort[0] === "relevance") ?
            response.featured.concat(response.results) :
            response.results;
          this.parseBrowsedState(response.collection, options);
          this.parseSearchResponse(response, options);
          response.results.sorting = response.collection.sorting;
          this.cacheId = (!!response.collection && !!response.collection.searching &&
            !!response.collection.searching.cache_id) ?
            response.collection.searching.cache_id : "";
          return this.parseBrowsedItems(response, options);
        },

        trimSortOptionName: function (name) {
          return name.replace(/\(([;\s\w\"\=\,\:\.\/\~\{\}\?\!\-\%\&\#\$\^\(\)]*?)\)/g, "");
        },

        addRegionsToPromotedList: function (featuredList) {
          _.each(featuredList, function (featuredObject, key) {
            featuredObject.data.regions = {
              OTMIMEType: featuredObject.data.properties.mime_type,
              OTName: featuredObject.data.properties.name,
              OTLocation: featuredObject.data.properties.parent_id,
              OTObjectDate: featuredObject.data.properties.create_date,
              OTModifyDate: featuredObject.data.properties.modify_date,
              OTObjectSize: featuredObject.data.properties.size_formatted
            };
          });
        },
      });
    }
  };

  return ServerAdaptorMixin;
});