/**
 * The workspaces mixin model parts for fetching the workspaces from the server.
 * Provides:
 *   - Endless scrolling
 *   - Fetch custom attributes (categories)
 *   - Provide Workspace type icon
 */
csui.define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/nodechildrencolumn', 'csui/models/nodechildrencolumns',
  'conws/utils/workspaces/workspace.model', 'conws/utils/workspaces/impl/workspaceutil'
], function (module, $, _, Backbone, Url,
    NodeChildrenColumnModel, NodeChildrenColumnCollection,
    WorkspaceModel, WorkspaceUtil) {

  // Model for display columns in expanded view
  var WorkspacesColumnModel = NodeChildrenColumnModel.extend({

    idAttribute: "column_key",

    constructor: function WorkspacesColumnModel() {
      NodeChildrenColumnModel.prototype.constructor.apply(this, arguments);
    }
  });

  // Collection for display columns in expanded view
  var WorkspacesColumnCollection = NodeChildrenColumnCollection.extend({

    dataCollectionName: "properties",
    model: WorkspacesColumnModel,

    constructor: function WorkspacesColumnCollection(models,options) {
      this.dataCollectionName = options && options.dataCollectionName;
      NodeChildrenColumnCollection.prototype.constructor.apply(this,arguments);
    },

    resetColumns: function (response, options) {
      var definitions = (response.meta_data && response.meta_data[this.dataCollectionName]) || {};
      var coldefstr = JSON.stringify(definitions);
      if (this.coldefstr!==coldefstr) {
        this.coldefstr = coldefstr;
        this.resetCollection(this.getColumns(response), options);
      }
    },

    getColumns: function (response) {
      var definitions = (response.meta_data &&
                         response.meta_data[this.dataCollectionName]) || {};

      var columnKeys   = _.keys(definitions),
          columnModels = this.getColumnModels(columnKeys, definitions);

      _.each(columnModels, function (model) {
        // To format user columns they must have type 14
        if (model.persona === "user" || model.persona === "member") {
          model.type = 14;
        }
      });

      return columnModels;
    }

  });

  var WorkspacesCollectionMixin = {
    mixin: function(prototype) {
      var defaults = _.defaults({},prototype);

      return _.extend(prototype,{
        dataCollectionName: "properties",
        model: WorkspaceModel,

        makeWorkspacesCollection: function (options) {
          this.columns = new WorkspacesColumnCollection([],{dataCollectionName:this.dataCollectionName});
          this.listenTo(this, "sync", this._cacheCollection);
          this.totalCount = 0;
          this.titleIcon = undefined;
          // API returns if there are more pages to fetch or not
          this.next = undefined;
          this.sorting = {};
          this.sorting.sort = [];
          this.sorting.sort[0] = {};
          this.listenTo(this,"sync reset",function() {
            this.updateSelectableState();
          });
        },

        updateSelectableState: function (models) {
          models || (models = this.models);
          var selectActions = this.selectActions;
          if (selectActions) {
            this.existsSelectable = false;
            this.existsNonSelectable = false;
            if (models && models.length>0) {
              // look for actions and set selectable flags accordingly
              var self = this;
              _.each(models,function(el){
                var selectable = true;
                if (el.attributes) {
                  if (el.actions) {
                    selectable = !!_.find(selectActions,function(act){
                      if (el.actions.models) {
                        return el.actions.get(act);
                      } else {
                        return el.actions[act];
                      }
                    });
                  } else {
                    selectable = false
                  }
                  el.attributes.selectable = selectable;
                }
                if (selectable) {
                  self.existsSelectable = true;
                } else {
                  self.existsNonSelectable = true;
                }
              });
            }
          }
        },

        fetch: function () {
          if (!this.fetching) {
            // reset total count
            this.totalCount = 0;
          }
          return defaults.fetch.apply(this, arguments);
        },

        clone: function () {
          // Don't share something between collapsed and expanded view (models, ...)
          // Sorting, filtering, columns, ... must also be shared since e.g. the modal view has
          // specific sorting
          var options = $.extend(true, {}, this.options);
          this._cleanupQuery(options.query);
          var collection = new this.constructor([], options);
          collection.connector = this.connector;
          collection.titleIcon = this.titleIcon;
          collection.sorting = this.sorting;
          return collection;
        },

        /**
         * Cleanup query, e.g. all custom filters, expand
         *
         * @private
         */
        _cleanupQuery: function (query) {
          if (this.wherePart) {
            _.each(query, function (value, key, obj) {
              if (key.substring(0, 6) === 'where_' && $.inArray(key, this.wherePart) < 0) {
                delete obj[key];
              }
            }, this);
          }

          // delete expand
          if (query.expand) {
            delete query.expand;
          }

          return query;
        },

        parse: function (response,options) {

          // if url parameter global_metadata was passed, the result contains the metadata
          // descriptions once for all items in response.meta_data and response.meta_data_order
          // only. In order to have it compatible in both cases, we set it item specific here.
          _.each(response.results,function(result){
            if (!result.metadata) {
              result.metadata = response.meta_data;
            }
            if (!result.metadata_order) {
              result.metadata_order = response.meta_data_order;
            }
          });

          // In case api returns properties use them, otherwise use defaults
          this.totalCount = response.paging.total_count;
          this.titleIcon = response.wksp_info && response.wksp_info.wksp_type_icon;
          if(this.orderBy) {
            this.sorting.sort[0].value = this._formatSorting(this.orderBy);
          }

          this.options.orderBy = this.orderBy;
          this.columns && this.columns.resetColumns(response, this.options);

          // If more pages available set next to true, otherwise to false
          this.next = response.paging.actions && response.paging.actions.next ? true : false;

          // pass the array of v2 nodes to the model parse methods
          return response.results;
        },

        /**
         * Set paging parameter for rest call
         *
         * @param skip Number of items to skip at current rest call
         * @param top  Number of items to fetch at current rest call
         * @param fetch true to fetch items from server
         */
        setLimit: function (skip, top, fetch) {
          if (this.skipCount !== skip || this.topCount !== top) {
            this.skipCount = skip;
            this.topCount = top;

            // Fetch next page from server and show data
            if (fetch) {
              this.fetch();
            }
          }
          return true;
        },

        /**
         * Reset paging parameter
         */
        resetLimit: function () {
          this.setLimit(0, this.topCount, false);
        },

        setFilter: function (value, attributes, fetch) {
          // In case filter is changed, reset paging to get first page
          this.setLimit(0, this.topCount, false);

          return defaults.setFilter.apply(this, arguments);
        },

        clearFilter: function () {
          defaults.clearFilter.apply(this, arguments);
          if (this.options.query) {
            this._cleanupQuery(this.options.query);
          }
        },

        mergeUrlPaging: function (config, queryParams) {
          var limit = this.topCount || config.defaultPageSize;
          if (limit) {
            queryParams.limit = limit;
            queryParams.page = this.skipCount ? (Math.floor(this.skipCount / limit)) + 1 : 1;
          }
          return queryParams;
        },

        mergeUrlSorting: function (queryParams) {
          var orderBy;
          if (this.orderBy) {
            orderBy = this.orderBy;
            queryParams.sort = this._formatSorting(orderBy);
          } else if (_.isUndefined(queryParams.sort)) {
            queryParams.sort = "asc_name";
            this.orderBy = "name asc";
          } else if (queryParams.sort.indexOf(" ") > -1) {
            orderBy = queryParams.sort;
            this.orderBy = queryParams.sort;
            queryParams.sort = this._formatSorting(orderBy);
          }
          return queryParams;
        },

        _formatSorting: function (orderBy) {
          var slicePosition = orderBy.lastIndexOf(" ");
          return orderBy.slice(slicePosition + 1) + '_' + orderBy.slice(0, slicePosition);
        },

        mergeUrlFiltering: function (queryParams) {
          if (!$.isEmptyObject(this.filters)) {
            for (var name in this.filters) {
              if (this.filters.hasOwnProperty(name)) {
                if (this.filters[name]) {
                  var column = this.columns && this.columns.get(name);
                  var attributes = column && column.attributes;
                  var valstring = WorkspaceUtil.getFilterValueString(attributes,this.filters[name]);
                  queryParams["where_" + name] = encodeURIComponent(valstring);
                } else {
                  // Clear filter
                  delete queryParams["where_" + name];
                  delete this.options.query["where_" + name];
                }
              }
            }
          }
          return queryParams;
        },

        queryParamsToString: function (params) {
          var queryParamsStr = "";
          for (var param in params) {
            if (params.hasOwnProperty(param)) {
              if (queryParamsStr.length > 0) {
                queryParamsStr += "&";
              }

              if (params[param] === undefined) {
                queryParamsStr += param;
              } else {
                queryParamsStr += param + "=" + params[param];
              }
            }
          }
          return queryParamsStr;
        },

        getBaseUrl: function () {
          var url = this.connector && this.connector.connection &&
                    this.connector.connection.url;
          if (_.isUndefined(url)) {
            url = this.options.connector.connection.url;
          }
          return url;
        }
      });
    }
  };

  return WorkspacesCollectionMixin;

});
