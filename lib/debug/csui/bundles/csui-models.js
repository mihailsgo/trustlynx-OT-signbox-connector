csui.define('csui/models/audit/server.adaptor.mixin',[
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
          var apiUrl = new Url(this.connector.connection.url).getApiBase(2);
          var query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              {
                expand: 'audit{id, user_id, agent_id}'
              }
          );
          return Url.combine(apiUrl, 'nodes', this.options.node.get('id'), 'audit?' + query) ;
        },

        parse: function (response, options) {
          this.parseBrowsedState(response, options);
          this.columns && this.columns.resetColumnsV2(response, this.options);
          this.auditEvents.add(response.results.data.audit_event_types);
          return response.results.data.audit;
        },

        isFetchable: function () {
          return !!this.options;
        },

      });
    }

  };

  return ServerAdaptorMixin;
});
csui.define('csui/models/audit/audit.collection',['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/browsable/browsable.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/browsable/v1.request.mixin',
  'csui/models/audit/server.adaptor.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model'
], function (_, $, Backbone, ConnectableMixin, FetchableMixin, BrowsableMixin,
    BrowsableV2ResponseMixin, BrowsableV1RequestMixin, ServerAdaptorMixin, NodeChildrenColumnModel,
    NodeChildrenColumnCollection, NodeModel) {

  var auditObject = {
    auditName: 'audit_name',
    auditDate: 'audit_date',
    userIdKey: 'user_id',
    dateType: '-7'
  };

  var AuditColumnModel = NodeChildrenColumnModel.extend({

    constructor: function AuditColumnModel(attributes, options) {
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }
  });

  var AuditColumnCollection = NodeChildrenColumnCollection.extend({

    model: AuditColumnModel,

    resetColumnsV2: function (response, options) {
      if(!this.models.length) {// Stopping reset as event data is static and doesn't change after first fetch
      this.resetCollection(this.getV2Columns(response), options);
    }
    },

    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        if (columnKey === auditObject.auditDate) {
          column.sort = true;
        }
      });
      return columns;
    },

    getV2Columns: function (response) {
      var definitions = (response.results &&
                         response.results[0] &&
                         response.results[0].metadata &&
                         response.results[0].metadata.properties) || {};

        definitions.audit_name = {filter: true};
        definitions.audit_date = {};
        definitions.user_id = {filter: true};

        definitions.audit_name.key = auditObject.auditName;
        definitions.audit_date.key = auditObject.auditDate;
        definitions.user_id.key = auditObject.userIdKey;
        definitions.audit_date.type = auditObject.dateType;

      var columnKeys = _.keys(definitions);
      return this.getColumnModels(columnKeys, definitions);
    }

  });

  var AuditEventModel = Backbone.Model.extend({});

  var AuditEventCollection = Backbone.Collection.extend({

    model: AuditEventModel,
    constructor: function AuditEventCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },
  });

  var AuditModel = NodeModel.extend({});

  var AuditCollection = Backbone.Collection.extend({

    model: AuditModel,

    constructor: function AuditCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeBrowsable(options)
          .makeBrowsableV2Response(options)
          .makeBrowsableV1Request(options)
          .makeServerAdaptor(options);

      this.columns = new AuditColumnCollection();
      this.auditEvents = new AuditEventCollection();
    }

  });

  ConnectableMixin.mixin(AuditCollection.prototype);
  FetchableMixin.mixin(AuditCollection.prototype);
  BrowsableMixin.mixin(AuditCollection.prototype);
  BrowsableV2ResponseMixin.mixin(AuditCollection.prototype);
  BrowsableV1RequestMixin.mixin(AuditCollection.prototype);
  ServerAdaptorMixin.mixin(AuditCollection.prototype);

  return AuditCollection;

});
csui.define('csui/models/authenticated.user.node.permission',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/including.additional.resources/including.additional.resources.mixin'
], function (_, Backbone, Url, ExpandableMixin, ResourceMixin,
    IncludingAdditionalResourcesMixin) {
  'use strict';

  var AuthenticatedUserNodePermissionModel = Backbone.Model.extend({
    constructor: function AuthenticatedUserNodePermissionModel(attributes, options) {
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeIncludingAdditionalResources(options)
          .makeExpandable(options);
      this.options= options;
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },

    url: function () {
      var selectedNodeId = this.node ? this.node.get('id') : this.options.node.get('id'),
          userId         = this.options.user.get('id');
      var apiBase = new Url(this.connector.connection.url).getApiBase('v2'),
          url     = Url.combine(apiBase, '/nodes/', selectedNodeId, '/permissions/effective/',
              userId);

      return url;
    },

    parse: function (response) {
      var permissions = response.results && response.results.data && response.results.data.permissions;
      if (permissions) {
        if (this.node && !this.node.get('container') && permissions.permissions.indexOf('add_items') !== -1) {
          permissions.permissions.splice(permissions.permissions.indexOf('add_items'), 1);
        }
      } else {
        permissions = {};
      }
      return permissions;
    },

    hasEditPermissionRights:function () {
      //Added check to provide edit rights to wiki pages(i.e. HTML widgets) only
      /*var nodeType = this.node ? this.node.get('type') : this.options.node.get('type');
      if(nodeType !== 5574) { //Wiki page type- 5574
        return false;
      }*/
      if (this.node && this.node.get("permissions_model") === "simple") {
        return false;
      }
      var permissons=this.get("permissions");
      return permissons && _.isArray(permissons) && _.contains(permissons,'edit_permissions');
    }
  });

  IncludingAdditionalResourcesMixin.mixin(AuthenticatedUserNodePermissionModel.prototype);
  ExpandableMixin.mixin(AuthenticatedUserNodePermissionModel.prototype);
  ResourceMixin.mixin(AuthenticatedUserNodePermissionModel.prototype);

  return AuthenticatedUserNodePermissionModel;
});

csui.define('csui/models/server.adaptors/favorite2.mixin',[
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var superParseMethod = prototype.parse;
      var superSyncMethod = prototype.sync;

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        parse: function (response, options) {
          if (response.results) {
            response = response.results;
          }
          if (_.isEmpty(response)) {
            return {};
          } else {
            if (options.attrs) {
              var updatedAttributes = {};
              _.each(_.keys(options.attrs), function (attr) {
                updatedAttributes['favorite_' + attr] = options.attrs[attr];
              }, this);
              return updatedAttributes;
            } else {
              if (response.data && response.data.properties && response.data.favorites) {
                response.data.properties.favorite_name = response.data.favorites.name;
                response.data.properties.favorite_tab_id = response.data.favorites.tab_id;
              }

              var m = superParseMethod.call(this, response);

              if (m.actions) {
                m.actions = _.reject(m.actions,
                  function (action) {
                    return action.signature == 'rename' || action.signature == 'delete';
                  });
                m.actions.push({signature: 'favorite_rename'});

                // console.log("NODE ACTIONS");
                // _.each(m.actions, function(a) {
                //   console.log(a.signature);
                // });
              }
              return m;
            }
          }
        },

        sync: function (method, model, options) {
          var useFavoritesUrl = false;
          if (method === 'update' || method === 'patch') {

            // if attr key starts with 'favorite_' do the update on the /members/favorites url but
            // remove the prefix to have the original attribute-name from the favorite model
            // otherwise, just pass the attribute-to-update as it is and use the url from he
            // original node model
            var prefix = 'favorite_';
            var attributesToUpdate = {};
            _.each(_.keys(options.attrs), function (k) {
              var newKey = k;
              if (k.indexOf(prefix) === 0) {
                useFavoritesUrl = true;
                newKey = k.substr(prefix.length);
              }
              attributesToUpdate[newKey] = options.attrs[k];
            });
            options.attrs = attributesToUpdate;
            if (useFavoritesUrl) {
              var url = this.connector.getConnectionUrl().getApiBase('v2');
              url = Url.combine(url, '/members/favorites');
              url = Url.combine(url, model.id);

              options.url = url;
            }
          }
          return superSyncMethod.call(this, method, model, options);
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('csui/models/favorite2',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url', 'csui/models/node/node.model',
  'csui/models/server.adaptors/favorite2.mixin', 'csui/utils/deepClone/deepClone'
], function (_, Backbone, Url, NodeModel, ServerAdaptorMixin) {
  'use strict';

  var Favorite2Model = NodeModel.extend({

    mustRefreshAfterPut: false,

    idAttribute: 'id',

    constructor: function Favorite2Model(attributes, options) {
      NodeModel.prototype.constructor.apply(this, arguments);
      this.makeServerAdaptor(options);
    }
  });

  ServerAdaptorMixin.mixin(Favorite2Model.prototype);

  return Favorite2Model;
});

csui.define('csui/models/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/models/impl/nls/root/lang',{
  serverCallPrecheckFailedMissingConnector: 'Missing connector data for server call.',
  serverCallPrecheckFailedModelIsNew: 'Model is new.',

  fav_parent_id: 'Location',
  fav_favorite_name: 'Name',
  fav_size: 'Size',
  fav_ungrouped: 'Ungrouped',

  name: "Name",
  type: "Type",
  version: "Version",
  state: "State",
  favorite: "Favorite",
  toggleDetails: "Toggle Details",
  parentID: "Parent ID"
});


csui.define('csui/models/favorite2column',['csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/url',
  'i18n!csui/models/impl/nls/lang'
], function (_, Backbone,
    Url,
    lang) {
  'use strict';

  var Favorite2ColumnModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function Favorite2ColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = 'fav_' + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }

  });

  return Favorite2ColumnModel;
});

csui.define('csui/models/favorite2columns',['csui/lib/underscore', 'csui/lib/backbone', 'csui/models/favorite2column', 'i18n!csui/models/impl/nls/lang'
], function (_, Backbone, Favorite2ColumnModel, modelLang) {
  'use strict';

  var Favorite2ColumnCollection = Backbone.Collection.extend({

    model: Favorite2ColumnModel,

    constructor: function Favorite2ColumnCollection(models, options) {
      if (!models) {
        models = [
          {
            default_action: true,
            key: "type",
            name: modelLang.type,
            type: 2
          },
          {
            default_action: true,
            key: "favorite_name",
            name: modelLang.name,
            type: -1
          },
          {
            key: "reserved", // the column can hold different icons representing state-information, not just the reserved-state.
            name: modelLang.state,
            type: 5
          },
          {
            key: "parent_id",
            name: modelLang.parentID,
            type: 2
          },
          {
            key: "favorite",
            name: modelLang.favorite,
            type: 5
          }
        ];
        models.forEach(function (column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      Backbone.Collection.prototype.constructor.call(this, models, options);
    }

  });

  return Favorite2ColumnCollection;
});

csui.define('csui/models/server.adaptors/favorites2.mixin',[
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
          // this.setExpand('favorites', 'tab_id');
          var url   = this.connector.getConnectionUrl().getApiBase('v2'),
              query = Url.combineQueryString(
                  this.getAdditionalResourcesUrlQuery(),
                  this.getResourceFieldsUrlQuery(),
                  this.getExpandableResourcesUrlQuery(),
                  this.getStateEnablingUrlQuery(),
                  this.getRequestedCommandsUrlQuery(),
                  this.getSortByOrderUrlQuery()
              );
          url = Url.combine(url, '/members/favorites');
          return query ? url + '?' + query : url;
        },

        getSortByOrderUrlQuery: function () {
          return {sort: 'order'};
        },

        parse: function (response, options) {
          this.parseBrowsedState({results: response}, options);
          // don't parse columns here, because they are hardcoded in the constructor of Favorite2ColumnCollection
          return this.parseBrowsedItems(response, options);
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('csui/models/favorites2',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.commandable/v2.commandable.mixin',
  'csui/models/browsable/client-side.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/favorite2',
  'csui/models/favorite2columns',
  'csui/models/server.adaptors/favorites2.mixin',
  'csui/utils/deepClone/deepClone'
], function (_, Backbone,
    ConnectableMixin,
    FetchableMixin,
    AdditionalResourcesV2Mixin,
    FieldsV2Mixin,
    ExpandableV2Mixin,
    StateRequestorMixin,
    CommandableV2Mixin,
    ClientSideBrowsableMixin,
    BrowsableV2ResponseMixin,
    DelayedCommandableV2Mixin,
    Favorite2Model,
    Favorite2ColumnCollection,
    ServerAdaptorMixin) {
  'use strict';

  var Favorite2Collection = Backbone.Collection.extend({

    model: Favorite2Model,

    constructor: function Favorite2Collection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.callCounter = 0;

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset',
          'includeResources', 'fields', 'expand', 'commands']);
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateRequestor(options)
          .makeCommandableV2(options)
          .makeClientSideBrowsable(options)
          .makeBrowsableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeServerAdaptor(options);

      this.columns = new Favorite2ColumnCollection(options.columns);
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },

    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, {
        connector: this.connector,
        fields: _.deepClone(this.fields),
        expand: _.deepClone(this.expand),
        includeResources: _.clone(this._additionalResources),
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        commands: _.clone(this.commands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands
      });

      // Clone sub-models not covered by Backbone
      if (this.columns) {
        clone.columns.reset(this.columns.toJSON());
      }
      // Clone properties about the full (not-yet fetched) collection
      clone.actualSkipCount = this.actualSkipCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      return clone;
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }

  });

  ClientSideBrowsableMixin.mixin(Favorite2Collection.prototype);
  BrowsableV2ResponseMixin.mixin(Favorite2Collection.prototype);
  ConnectableMixin.mixin(Favorite2Collection.prototype);
  FetchableMixin.mixin(Favorite2Collection.prototype);
  AdditionalResourcesV2Mixin.mixin(Favorite2Collection.prototype);
  FieldsV2Mixin.mixin(Favorite2Collection.prototype);
  ExpandableV2Mixin.mixin(Favorite2Collection.prototype);
  StateRequestorMixin.mixin(Favorite2Collection.prototype);
  CommandableV2Mixin.mixin(Favorite2Collection.prototype);
  DelayedCommandableV2Mixin.mixin(Favorite2Collection.prototype);
  ServerAdaptorMixin.mixin(Favorite2Collection.prototype);

  return Favorite2Collection;

});

csui.define('csui/models/favorite2group',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/favorites2', 'csui/utils/deepClone/deepClone'
], function (_, Backbone, Url, ResourceMixin, UploadableMixin,
   Favorite2Collection) {
  'use strict';

  var Favorite2GroupModel = Backbone.Model.extend({
    mustRefreshAfterPut: false,

    idAttribute: 'tab_id',

    constructor: function Favorite2GroupModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options);
      this.makeUploadable(options);

      // initialize favorites of this group with provided favorites and columns
      attributes || (attributes = {});

      this.favorites = new Favorite2Collection(attributes.favorites, {
        connector: options.connector,
        autoreset: true,
        tab_id: this.get('tab_id'),
        columns: attributes.favorite_columns,
        commands: options && options.commands,
        stateEnabled: options.stateEnabled,
      });
    },

    urlRoot: function () {
      var v2Url = this.connector.getConnectionUrl().getApiBase('v2');
      var url = Url.combine(v2Url, "/members/favorites/tabs/");
      return url;
    },

    parse: function (resp, options) {
      if (resp.results && resp.results.data) {
        return {tab_id: resp.results.data.tab_id};
      } else {
        return resp;
      }
    }
  });

  ResourceMixin.mixin(Favorite2GroupModel.prototype);
  UploadableMixin.mixin(Favorite2GroupModel.prototype);

  return Favorite2GroupModel;
});

csui.define('csui/models/server.adaptors/favorite2groups.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url', 'i18n!csui/models/impl/nls/lang'
], function ($, _, Url, lang) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        sync: function (method, model, options) {
          if (method !== 'read') {
            throw new Error('Only fetching groups with favorites is supported.');
          }
          var groups = this.connector.makeAjaxCall({url: this.url()})
            .then(function (response) {
              return response;
            });

          var favoritesCollection = this.favorites;
          var favoritesFetchOptions = _.omit(options, ['success', 'error']);
          var favorites = favoritesCollection.fetch(favoritesFetchOptions)
            .then(function (response) {
              return favoritesCollection; // need full object, including columns when merging
            });

          // Groups will be parsed by _createMergedResponse,
          // favorites were parsed by Favorite2Collection.
          options.parse = false;

          return this.syncFromMultipleSources([groups, favorites], this._createMergedResponse, options);
        },

        _createMergedResponse: function (groups, favoritesCollection, options) {
          var favorites = favoritesCollection.toJSON();
          var columns = favoritesCollection.columns;
          // add "Unspecified group"
          groups.results.push({data: {name: lang.fav_ungrouped, order: -1, tab_id: -1}});
          var merged = groups.results.map(function (group) {
            group = group.data;

            var tabId = group.tab_id;
            group.favorites = favorites.filter(function (favorite) {
              return favorite.favorite_tab_id === tabId || tabId === -1 && favorite.favorite_tab_id ===
                null;
            });
            group.favorite_columns = columns.toJSON(); //
            return group;
          });

          return merged;
        },

        parse: function (response, options) {
          return response;
        },

        url: function () {
          // this.setExpand('favorites', 'tab_id');
          var url = this.connector.getConnectionUrl().getApiBase('v2'),
            query = Url.combineQueryString(
              this.getAdditionalResourcesUrlQuery(),
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getSortByOrderUrlQuery()
              // this.getRequestedCommandsUrlQuery()
            );
          url = Url.combine(url, '/members/favorites/tabs');
          return query ? url + '?' + query : url;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('csui/models/favorite2groups',['csui/lib/jquery',
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/utils/base',
  'csui/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/favorite2group', 'csui/models/favorites2',
  'csui/models/server.adaptors/favorite2groups.mixin',
  'i18n!csui/models/impl/nls/lang'
], function ($, _, Backbone, Url, base, ConnectableMixin, FetchableMixin,
    AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin,
    StateRequestorMixin, SyncableFromMultipleSources,
    Favorite2GroupModel, Favorite2Collection, ServerAdaptorMixin, lang) {
  'use strict';

  var Favorite2GroupsCollection = Backbone.Collection.extend({
    model: Favorite2GroupModel,

    constructor: function Favorite2GroupsCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      // Support collection cloning
      if (options) {
        this.options = _.pick(options, ['connector', 'autoreset',
          'includeResources', 'fields', 'expand' /*, 'commands'*/]);
      }

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeServerAdaptor(options)
          .makeStateRequestor(options);

      if (options) {
        this.favorites = options.favorites;
        this.commands = options.commands;
      }
      if (!this.favorites) {
        this.favorites = new Favorite2Collection(undefined, {
          connector: this.connector,
          autoreset: true,
          commands: this.commands
        });
      }
      this.on('sync', this._setupEventPropagation, this);
      this.on('add', this._propagateFavorite2CollectionOptions, this);
      this.on('reset', function (groups, options) {
        var self = this;
        groups.each(function (group) {
          self._propagateFavorite2CollectionOptions(group, groups, options);
        });
      }, this);
    },

    _fetch: function (options) {
      options || (options = {});
      options.originalSilent = options.silent;
      // make this fetch silent, because another fetch is done at then reset
      //  event is triggered
      options.silent = true;

      return this.originalFetch.call(this, options);
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      options.commands = this.commands;
      // this should not be needed, but Favorite2Model uses its own server adaptor mixin, which
      // overwrites some of the URL handling...
      options.stateEnabled = this.stateEnabled;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },

    _setupEventPropagation: function () {
      var self = this;
      this.each(function (group) {
        group.favorites.listenTo(group.favorites, "reset update",
            function (favoritesCollection, options) {
              self.trigger('update', self, options);
            });

      }, this);
    },

    // Note: this.favorites is the collection that was used to set the resource scope and when group
    // plus the favorites are being merged, reset is triggered for all groups, which then
    // already have the favorites. Then the options get copied or cloned from the original
    // collection to each favorite collection of each group.
    // This is necessary, because if a model of those favorite collections is saved and fetched
    // again, the options from the collection are used if not set at the single model. Otherwise
    // a single favorite model would be fetched without commands, expands, etc.
    _propagateFavorite2CollectionOptions: function (group, collection, options) {
      group.favorites.setFilter(_.deepClone(this.favorites.filters), false);
      group.favorites.setOrder(this.favorites.orderBy, false);
      group.favorites.setFields(_.deepClone(this.favorites.fields));
      group.favorites.setExpand(_.deepClone(this.favorites.expand));
      if (this.favorites.commands) {
        group.favorites.setCommands(this.favorites.commands);
      }
      group.favorites.promotedActionCommands = this.favorites.promotedActionCommands;
      group.favorites.nonPromotedActionCommands = this.favorites.nonPromotedActionCommands;
      group.favorites.each(function (favorite) {
        favorite.promotedActionCommands = group.favorites.promotedActionCommands;
        favorite.nonPromotedActionCommands = group.favorites.nonPromotedActionCommands;
      });
    },

    clone: function () {
      var clone = new this.constructor(this.models, {
        // node: this.node,
        // skip: this.skipCount,
        // top: this.topCount,
        connector: this.connector,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        fields: _.clone(this.fields),
        expand: _.clone(this.expand),
        commands: _.clone(this.commands),
        favorites: this.favorites.clone()
      });

      return clone;
    },

    getSortByOrderUrlQuery: function () {
      return {sort: 'order'};
    },

    // private: reset the collection
    resetCollection: function (models, options) {
      this.reset(models, options);
      this.fetched = true;
    },

    // todo: this should be a PUT to /members/favorites/tabs with the following hierarchical
    // structure (and it should be moved to the favorites2groups model):

    // var tabs = [
    //   {
    //     name: "first group",
    //     favorites: [
    //       {
    //         name: "Document for review",
    //         size: 20099790,
    //         favorite_name: "Favorite of Document for review"
    //         // more attributes follow ...
    //       },
    //       {
    //         name: "Specification",
    //         size: 98898690,
    //         favorite_name: "Pump Specification"
    //         // more attributes follow ...
    //       }
    //     ]
    //   },
    //   {
    //     name: "second group",
    //     favorites: [
    //       {
    //         name: "My Presentation",
    //         size: 987078,
    //         favorite_name: "The Presentation for all Managers"
    //         // more attributes follow ...
    //       }
    //     ]
    //   }
    // ];

    saveAll: function () {
      var self = this;
      var tabs = this.map(function (group) {
        var groupName;
        var groupId = group.get('tab_id');
        if (groupId == -1) {
          groupName = null; // the ungrouped group has no name
        } else {
          groupName = group.get('name');
        }
        return {
          name: groupName, tab_id: groupId, favorites: group.favorites.map(function (favorite) {
            return {
              id: favorite.get('id'),
              name: favorite.get('favorite_name')
            };
          })
        };
      });

      // this makes a formdata request
      var putUrl = this.connector.getConnectionUrl().getApiBase('v2');
      putUrl = Url.combine(putUrl, '/csui/favorites');

      // callCounter is for detecting parallel REST calls and to use only response from latest
      this.callCounter++;

      var options = {
        type: 'PUT',
        url: putUrl,
        data: tabs,
        beforeSend: function (request, settings) {
          request.counter = self.callCounter;
        }
      };

      var deferred = $.Deferred();
      var jqxhr = this.connector.makeAjaxCall(options);
      jqxhr.then(function (response) {
        if (jqxhr.counter < self.callCounter) {
          // let the caller ignore the results, because a new save operation was already started
          deferred.reject();
        } else {
          // get new tab_ids because with bulk update call, the server invalidates all tab_ids
          options = {
            type: 'GET',
            url: self.url()
          };
          var jqxhrTabs = self.connector.makeAjaxCall(options)
              .then(function (tabsResp) {
                if (tabsResp.results && tabsResp.results instanceof Array) {
                  // merge the retrieved tab_id and order attributes with the existing models: the
                  // order of the returned list is the same as the order in this collection.
                  // Associate the models one by one, because the sequence is the same (if
                  // nothing changed them again in the meanwhile at the server)
                  // Note, this collection has at the end an additional group with tab_id = -1,
                  // which is the Ungrouped favorite group. This never changes. It's always at
                  // the end.

                  tabsResp.results.forEach(function (elem, index) {
                    if (elem.data) {
                      var group = self.at(index);
                      // must remove the group from the collection and add it again before
                      // changing the id (in this case tab_id) to let backbone update the byId
                      // structure correctly. this is a hack!
                      self.remove(group, {silent: true});
                      group.set('tab_id', elem.data.tab_id, {silent: true});
                      self.add(group, {at: index, silent: true});

                      group.set('order', elem.data.order, {silent: true});
                      // also update the tab_id stored in each favorite too, just in case
                      // anybody is using this...
                      for (var i = 0; i < group.favorites.length; i++) {
                        var favorite = group.favorites.at(i);
                        // do the hack also here to let backbone update the byId structure
                        group.favorites.remove(favorite, {silent: true});
                        favorite.set('favorite_tab_id', elem.data.tab_id, {silent: true});
                        group.favorites.add(favorite, {at: i, silent: true});
                      }
                    }
                  });

                }
                deferred.resolve(response);
                self.trigger('bulk:update:succeed');
              }, function (jqxhrTabs, statusText) {
                var errorTabs = new base.RequestErrorMessage(jqxhrTabs);
                deferred.reject(errorTabs);
                self.trigger('bulk:update:fail');
              });
        }
      }, function (jqxhr, statusText) {
        // if self.callCounter is already higher than the stored value of this request, then
        // a newer request was already started -> ignore the error in that case.
        if (jqxhr.counter < self.callCounter) {
          deferred.reject();
        } else {
          var error = new base.RequestErrorMessage(jqxhr);
          deferred.reject(error);
        }
        self.trigger('bulk:update:fail');
      });
      return deferred.promise();
    }
  });

  ConnectableMixin.mixin(Favorite2GroupsCollection.prototype);
  FetchableMixin.mixin(Favorite2GroupsCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(Favorite2GroupsCollection.prototype);
  FieldsV2Mixin.mixin(Favorite2GroupsCollection.prototype);
  ExpandableV2Mixin.mixin(Favorite2GroupsCollection.prototype);
  SyncableFromMultipleSources.mixin(Favorite2GroupsCollection.prototype);
  ServerAdaptorMixin.mixin(Favorite2GroupsCollection.prototype);
  StateRequestorMixin.mixin(Favorite2GroupsCollection.prototype);

  return Favorite2GroupsCollection;
});

csui.define('csui/models/server.adaptors/favorite.model.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url', 'i18n!csui/models/impl/nls/lang'
], function ($, _, Url, lang) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          return Url.combine(this.options.connector.getConnectionUrl().getApiBase('v2'),
            'members/favorites', this.get('id'));
        },

        _serverCallPreCheck: function () {
          if (this.isNew()) {
            return {error: lang.serverCallPrecheckFailedModelIsNew};
          }
          if (!this.options || !this.options.connector) {
            return {error: lang.serverCallPrecheckFailedMissingConnector};
          }
          return undefined;
        },

        _serverCallUpdateFavorite: function (ajaxMethod, deferred, selected) {
          var error = this._serverCallPreCheck();
          if (error !== undefined) {
            deferred.reject(error);
            return;
          }

          var options = {
            type: ajaxMethod,
            url: this.url()
          };

          if (ajaxMethod === 'POST') {
            var tabId = this.get('tab_id');
            var name = this.get('name');
            // do this check for code backward compatibility
            if (tabId !== undefined || name !== undefined) {
              var data = {};
              name !== undefined && _.extend(data, {name: name});
              (tabId !== undefined && tabId !== -1) && _.extend(data, {tab_id: tabId});
              _.extend(options, {data: data});
            }
          }

          this.options.connector.makeAjaxCall(options)
            .done(_.bind(function (resp) {
              this.set('selected', selected);
              if (window.csui && window.csui.mobile) {
                // LPAD-59888: update the favorites list properly by fetching the update node model
                // change does not affect Smart UI
                var selectedNode = this.get('node');
                selectedNode.fetch({
                  force: true
                });
              }
              deferred.resolve(resp);
            }, this))
            .fail(function (err) {
              deferred.reject(err);
            });
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('csui/models/favorite.model',['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/base',
  'csui/utils/url', 'csui/models/server.adaptors/favorite.model.mixin', 'i18n!csui/models/impl/nls/lang'
], function ($, _, Backbone, base, Url, ServerAdaptorMixin, lang) {
  "use strict";

  var FavoriteModel = Backbone.Model.extend({

    constructor: function FavoriteModel(attributes, options) {
      options || (options = {});
      this.options = options;
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeServerAdaptor(options);
    },

    isNew: function () {
      return this.get('id') === undefined;
    },

    addToFavorites: function () {
      var deferred = $.Deferred();
      this._serverCallUpdateFavorite('POST', deferred, true);
      return deferred.promise();
    },

    removeFromFavorites: function () {
      var deferred = $.Deferred();
      this._serverCallUpdateFavorite('DELETE', deferred, false);
      return deferred.promise();
    }

  });

  ServerAdaptorMixin.mixin(FavoriteModel.prototype);
  return FavoriteModel;

});

csui.define('csui/models/permission/permission.action.server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        urlBase: function () {
          var type              = this.get('type'),
              right_id          = this.get('right_id'),
              nodeId            = this.nodeId,
              apply_to          = this.apply_to,
              include_sub_types = this.include_sub_types,
              queryString       = "",
              url               = this.options.connector.getConnectionUrl().getApiBase('v2');
          if (!_.isNumber(nodeId) || nodeId > 0) {
            // Add an existing node by VERB /nodes/:id
            url = Url.combine(url, 'nodes', nodeId, 'permissions');
            if (apply_to) {
              queryString = Url.combineQueryString(queryString, {apply_to: apply_to});
            }
            if (include_sub_types) {
              _.each(include_sub_types, function (subtype) {
                queryString = Url.combineQueryString(queryString, {include_sub_types: subtype});
              });
            }

            queryString = queryString.length > 0 ? "?" + queryString : queryString;
            if (!type) {
              // Create a new permission model by POST
              url = Url.combine(url, 'custom' + queryString);
            } else if (type !== 'custom') {
              //Access an existing permission model by VERB /:type where type is public/owner/group
              url = Url.combine(url, type + queryString);
            } else if (!_.isNumber(right_id) || right_id > 0) {
              //Access an existing permission model by VERB /custom/:right_id
              url = Url.combine(url, type, right_id + queryString);
            } else {
              throw new Error('Unsupported permission type or user id');
            }
          } else {
            throw new Error('Unsupported id value');
          }
          return url;
        },

        url: function () {
          var url   = this.urlBase(),
              query = null;
          return query ? url + '?' + query : url;
        },

        parse: function (response, options) {
          if (this.collection) {
            var addItemsOptionIndex = response.permissions ?
                                      response.permissions.indexOf('add_items') : -1,
                addMajorVersionOptionIndex;
            if (!this.collection.isContainer) {
              if (addItemsOptionIndex !== -1) {
                response.permissions.splice(addItemsOptionIndex, 1);
              }
              addMajorVersionOptionIndex = response.permissions ?
                                           response.permissions.indexOf("add_major_version") : -1;
              if (!(this.collection.options.node &&
                  this.collection.options.node.get('advanced_versioning')) &&
                  addMajorVersionOptionIndex !== -1) {
                response.permissions.splice(addMajorVersionOptionIndex, 1);
              }
            } else {
              addMajorVersionOptionIndex = response.permissions ?
                                           response.permissions.indexOf("add_major_version") : -1;
              if (!(this.collection.options.node &&
                  this.collection.options.node.get('advancedVersioningEnabled')) &&
                  addMajorVersionOptionIndex !== -1) {
                response.permissions.splice(addMajorVersionOptionIndex, 1);
              }
            }
          }
          return response;
        }
      });
    },

    getPermissionLevel: function (permissions, isContainer, versionControlAdvanced, node, permissionModel) {
      var value,
          permissionsCount = 9;
      if (isContainer) {
        permissionsCount++;
        if (!node.get('advancedVersioningEnabled')) {
          permissionsCount--;
        }
      } else if (!versionControlAdvanced) {
        permissionsCount--;
      }
      if (permissions && permissions.length > 0 && (node.get('permissions_model') !== 'simple')) {
        if (permissions.indexOf("edit_permissions") >= 0 &&
            permissions.length === permissionsCount) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
        } else if (permissions.indexOf("edit_permissions") < 0 &&
                   permissions.indexOf("delete") >= 0 &&
                   permissions.length === (permissionsCount - 1)) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
        } else if (permissions.indexOf("see_contents") >= 0 &&
                   permissions.length === 2) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
        } else {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM;
        }
      } else if (permissions && permissions.length > 0 &&
                 (node.get('permissions_model') === 'simple')) {
        if (permissions.indexOf("edit_permissions") >= 0) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
        } else if (permissions.indexOf("edit_permissions") < 0 &&
                   permissions.indexOf("delete") >= 0) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
        } else if (permissions.indexOf("see_contents") >= 0 &&
                   permissions.length === 2) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
        }
      } else if (permissionModel.get("type") === "public" || !!permissionModel.get("right_id")) {
          value = ServerAdaptorMixin.PERMISSION_LEVEL_NONE;
      }
      return value;
    },

    getReadPermissions: function () {
      return ["see", "see_contents"];
    },

    getWritePermissions: function (isContainer, versionControlAdvanced, advancedVersioningEnabled) {
      var permissions = ["see", "see_contents", "modify", "edit_attributes", "add_items", "reserve",
        "add_major_version", "delete_versions", "delete"];
      if (!isContainer) {
        permissions.splice(permissions.indexOf('add_items'), 1);
        if (!versionControlAdvanced) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      } else {
        if (!advancedVersioningEnabled) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      }
      return permissions;
    },

    getFullControlPermissions: function (isContainer, versionControlAdvanced,
        advancedVersioningEnabled) {
      var permissions = ["see", "see_contents", "modify", "edit_attributes", "add_items", "reserve",
        "add_major_version", "delete_versions", "delete", "edit_permissions"];
      if (!isContainer) {
        permissions.splice(permissions.indexOf('add_items'), 1);
        if (!versionControlAdvanced) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      } else {
        if (!advancedVersioningEnabled) {
          permissions.splice(permissions.indexOf('add_major_version'), 1);
        }
      }
      return permissions;
    },

    getPermissionsByLevelExceptCustom: function (level, isContainer, versionControlAdvanced,
        advancedVersioningEnabled) {
      var permissions = null;
      switch (level) {
      case ServerAdaptorMixin.PERMISSION_LEVEL_NONE:
        permissions = [];
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_READ:
        permissions = ServerAdaptorMixin.getReadPermissions();
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_WRITE:
        permissions = ServerAdaptorMixin.getWritePermissions(isContainer, versionControlAdvanced,
            advancedVersioningEnabled);
        break;
      case ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL:
        permissions = ServerAdaptorMixin.getFullControlPermissions(isContainer,
            versionControlAdvanced,
            advancedVersioningEnabled);
        break;
      }
      return permissions;
    }

  };

  ServerAdaptorMixin.PERMISSION_LEVEL_NONE = 0;
  ServerAdaptorMixin.PERMISSION_LEVEL_READ = 1;
  ServerAdaptorMixin.PERMISSION_LEVEL_WRITE = 2;
  ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL = 3;
  ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM = 4;
  return ServerAdaptorMixin;
});

csui.define('csui/models/permission/nodepermission.model',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/permission/permission.action.server.adaptor.mixin'
], function (module, _, $, Backbone, Url, ConnectableMixin, UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var NodePermissionModel = Backbone.Model.extend({
    idAttribute: config.idAttribute,

    defaults: {
      "addEmptyAttribute": true
    },

    constructor: function NodePermissionModel(attributes, options) {
      attributes || (attributes = {});
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options = _.pick(options, ['connector']);
      this.makeConnectable(options)
          .makeUploadable(options);
    },

    isNew: function () {
      return !this.get('type') || !(this.has('right_id') || this.get('type') === 'public');
    }

  }, {
    getPermissionLevel: getPermissionLevel,
    getReadPermissions: ServerAdaptorMixin.getReadPermissions,
    getWritePermissions: ServerAdaptorMixin.getWritePermissions,
    getFullControlPermissions: ServerAdaptorMixin.getFullControlPermissions,
    getPermissionsByLevelExceptCustom: ServerAdaptorMixin.getPermissionsByLevelExceptCustom
  });

  function getPermissionLevel () {
    return ServerAdaptorMixin.getPermissionLevel(this.get("permissions"),
        this.collection.isContainer, this.collection.options.node &&
                                     this.collection.options.node.get('advanced_versioning'),
        this.collection.options.node, this);
  }

  NodePermissionModel.prototype.PERMISSION_LEVEL_NONE = NodePermissionModel.PERMISSION_LEVEL_NONE = ServerAdaptorMixin.PERMISSION_LEVEL_NONE;
  NodePermissionModel.prototype.PERMISSION_LEVEL_READ = NodePermissionModel.PERMISSION_LEVEL_READ = ServerAdaptorMixin.PERMISSION_LEVEL_READ;
  NodePermissionModel.prototype.PERMISSION_LEVEL_WRITE = NodePermissionModel.PERMISSION_LEVEL_WRITE = ServerAdaptorMixin.PERMISSION_LEVEL_WRITE;
  NodePermissionModel.prototype.PERMISSION_LEVEL_FULL_CONTROL = NodePermissionModel.PERMISSION_LEVEL_FULL_CONTROL = ServerAdaptorMixin.PERMISSION_LEVEL_FULL_CONTROL;
  NodePermissionModel.prototype.PERMISSION_LEVEL_CUSTOM = NodePermissionModel.PERMISSION_LEVEL_CUSTOM = ServerAdaptorMixin.PERMISSION_LEVEL_CUSTOM;

  NodePermissionModel.prototype.getPermissionLevel = NodePermissionModel.getPermissionLevel;
  NodePermissionModel.prototype.getReadPermissions = NodePermissionModel.getReadPermissions;
  NodePermissionModel.prototype.getWritePermissions = NodePermissionModel.getWritePermissions;
  NodePermissionModel.prototype.getFullControlPermissions = NodePermissionModel.getFullControlPermissions;
  NodePermissionModel.prototype.getPermissionsByLevelExceptCustom = NodePermissionModel.getPermissionsByLevelExceptCustom;

  ConnectableMixin.mixin(NodePermissionModel.prototype);
  UploadableMixin.mixin(NodePermissionModel.prototype);
  ServerAdaptorMixin.mixin(NodePermissionModel.prototype);

  return NodePermissionModel;
});

csui.define('csui/models/permission/permission.response.mixin',[
  'csui/lib/underscore', 'csui/utils/base'
], function (_, base) {
  'use strict';

  var PermissionResponseMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makePermissionResponse: function (options) {
          return this;
        },

        /**
         * This method update the response data for the following fields....
         * removes public access record if no permission data exists,
         * @param resp
         * @param options
         */
        parsePermissionResponse: function (resp, options, clearEmptyPermissionModel) {
          if (!!resp.results && !!resp.results.data && !!resp.results.data.permissions &&
              !_.isEmpty(resp.results.data.permissions)) {
            var permissionsList = resp.results.data.permissions;
            if (_.isArray(permissionsList)) {
              //Removing public access entry from response if there is no permissions available
              permissionsList = _.reject(permissionsList,
                  function (child) { return (child.type === 'public' && !child.permissions); });
              var ownerData = _.find(permissionsList, function (item) {
                    return item.type === 'owner';
                  }),
                  groupData = _.find(permissionsList, function (item) {
                    return item.type === 'group';
                  });
              //Removing group entry from response if owner is available and group is not available
              if ((ownerData && ownerData.permissions) && (groupData && !groupData.permissions)) {
                permissionsList = _.reject(permissionsList,
                    function (child) { return (child.type === 'group' && !child.permissions); });
              }
              //Removing owner entry from response if group is available and owner is not available
              if ((ownerData && !ownerData.permissions) && (groupData && groupData.permissions)) {
                permissionsList = _.reject(permissionsList,
                    function (child) { return (child.type === 'owner' && !child.permissions); });
              }
              //Removing group entry from response if there is no permissions available for owner
              // and owner group
              if ((ownerData && !ownerData.permissions) && (groupData && !groupData.permissions)) {
                permissionsList = _.reject(permissionsList,
                    function (child) { return (child.type === 'group' && !child.permissions); });
              }
            } else if (_.isObject(permissionsList)) {
              permissionsList = [];
              if (resp.results.data.permissions &&
                  resp.results.data.permissions.permissions.length > 0) {
                permissionsList.push(resp.results.data.permissions);
              }
            }
            resp.results.data.permissions = permissionsList;
          }
        }
      });
    }
  };

  return PermissionResponseMixin;
});

csui.define('csui/models/permission/server.adaptor.mixin',[
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
            //Add name in the permission collection
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

csui.define('csui/models/permission/nodeuserpermissions',['module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/permission/nodepermission.model',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/browsable/browsable.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/permission/permission.response.mixin',
  'csui/models/permission/server.adaptor.mixin'
], function (module, $, _, Backbone, Url, NodePermissionModel,
    ConnectableMixin, FetchableMixin, BrowsableMixin,
    BrowsableV2ResponseMixin, ExpandableV2Mixin, PermissionResponseMixin,
    ServerAdaptorMixin) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30
  });

  var NodeUserPermissionCollection = Backbone.Collection.extend({

    model: NodePermissionModel,

    constructor: function NodeUserPermissionCollection(models, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize
      }, options);

      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeFetchable(options);

      this.options = options;
      this.includeActions = options.includeActions;
      this.query = this.options.query;

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeBrowsable(options)
          .makeBrowsableV2Response(options)
          .makePermissionResponse(options);
    },

    isFetchable: function () {
      return true;
    },

    setOrder: function (attributes, fetch) {
      if (this.orderBy != attributes) {
        this.orderBy = attributes;
        if (fetch !== false) {
          this.fetch({skipSort: false});
        }
        return true;
      }
    },

    processForEmptyOwner: function () {
      if (!this.findWhere({type: 'owner'}) && !this.findWhere({type: 'group'})) {
        //Add dummy model at index 0, for no owner assigned row
        this.add({permissions: null, right_id: null, type: 'owner'}, {at: 0});
      }
    },

    addPublicAccess: function (publicAccessModel) {
      if (this.findWhere({type: 'owner'}) && this.findWhere({type: 'group'})) {
        //Add dummy model at index 0, for no owner assigned row
        this.add(publicAccessModel, {at: 2});
      } else {
        //Add public access at index 1, if anyone is present from owner or group
        this.add(publicAccessModel, {at: 1});
      }
    },

    addOwnerOrGroup: function (nodePermissionModel, flag) {
      var owner = this.findWhere({type: 'owner'});
      if (owner && owner.get('permissions') === null) { //No owner or group
        var currentModel = this.at(0);
        this.remove(currentModel, {silent: flag});
        this.add(nodePermissionModel, {at: 0});
      }
      else {
        this.add(nodePermissionModel, {at: (nodePermissionModel.get('type') === 'owner') ? 0 : 1});
      }
    }
  });

  FetchableMixin.mixin(NodeUserPermissionCollection.prototype);
  BrowsableMixin.mixin(NodeUserPermissionCollection.prototype);
  BrowsableV2ResponseMixin.mixin(NodeUserPermissionCollection.prototype);
  ConnectableMixin.mixin(NodeUserPermissionCollection.prototype);
  ExpandableV2Mixin.mixin(NodeUserPermissionCollection.prototype);
  PermissionResponseMixin.mixin(NodeUserPermissionCollection.prototype);
  ServerAdaptorMixin.mixin(NodeUserPermissionCollection.prototype);

  return NodeUserPermissionCollection;

});


csui.define('csui/models/server.module/server.module.collection',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone'
], function (module, _, $, Backbone) {
  'use strict';

  // Map with ids as keys and attributes as values
  var sourceModules = module.config().modules || {},
  // Convert the configuration map to an array of model attributes
      serverModules = _.map(sourceModules, function (attributes, id) {
        attributes.id = id;
        return attributes;
      });

  var ServerModuleModel = Backbone.Model.extend({

    defaults: {
      id: null,   // Require.js module prefix used by the server module
      title: null // Displayable title of the server module
    },

    constructor: function ServerModuleModel(attributes, options) {
      ServerModuleModel.__super__.constructor.apply(this, arguments);
    }

  });

  var ServerModuleCollection = Backbone.Collection.extend({

    model: ServerModuleModel,

    constructor: function ServerModuleCollection(models, options) {
      models || (models = serverModules);
      ServerModuleCollection.__super__.constructor.call(this, models, options);
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching the server modules is supported.');
      }
      var self = this;
      options || (options = {});
      return this._resolveServerModules()
          .then(function () {
            var response = self.toJSON();
            options.success && options.success(response, options);
            self.trigger('sync', self, response, options);
          });
    },

    _resolveServerModules: function (options) {
      options = _.extend({}, this.options, options);
      var deferred = $.Deferred(),
          missing = this.find(function (serverModule) {
            var sourceModule = sourceModules[serverModule.id];
            if (sourceModule) {
              serverModule.set(sourceModule.attributes);
            } else {
              if (!options.ignoreErrors) {
                return true;
              }
            }
          });
      if (missing) {
        var error = new Error('Invalid module prefix: ' + missing.id);
        return deferred.reject(error);
      }
      return deferred.resolve().promise();
    }

  });

  return ServerModuleCollection;

});

csui.define('csui/models/specificnodemodel',['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/node.resource/node.resource.mixin'
], function (_, Backbone, Url, NodeResourceMixin) {
  'use strict';

  var SpecificNodeModel = Backbone.Model.extend({

    constructor: function SpecificNodeModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, arguments);
      this.makeNodeResource(options);
    },

    parse: function (response) {
      return response;
    },

    url: function () {

      var node   = this.options.node,
          nodeId = node.get('id'),
          url;
      url = _.str.sformat('forms/nodes/properties/specific?id={0}',
          nodeId);

      return Url.combine(this.options.connector.connection.url, url);

    }

  });

  NodeResourceMixin.mixin(SpecificNodeModel.prototype);

  return SpecificNodeModel;

});

csui.define('csui/models/mixins/versions/v2.versions.response.mixin',['csui/lib/underscore'
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

  // parsing actions and adding singature for existing actions
  function _parseActions(actions, version) {
    version.actions = [];
    _.each(actions.data, function (action) {
      action.signature = action.name;
      version.actions.push(action);
    });
  }

  return VersionsV2ResponseMixin;
});

csui.define('csui/models/server.adaptors/version.mixin',[
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
            this.get('id'), 'versions');
          if (!this.isNew()) {
            url = Url.combine(url, this.get('version_number'));
            var query = Url.combineQueryString(
              this.getExpandableResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery()
            );
            if (query) {
              url += '?' + query;
            }
          }

          return url;
        },

        parse: function (response) {
          // Handle both version objects when parsed from the single
          // /versions/:id and the collection /versions responses.
          var version = response.data || this.parseVersionsResponse(response);

          // TODO: Remove this.  Version properties should have its own general
          // property panel instead of using the node and breaking each other
          // when one of them gets changed
          /*if (version.type === undefined) {
            version.type = 144;
          }*/

          // get node type info from NodeVersionCollection for Version Collection, if it is single
          // fetch then collect it from rest api response id_expand object
          if (version.id_expand && version.id_expand.type) {
            version.type = version.id_expand.type;
          }

          if (!!version.version_number_name) {
            version.version_number_name_formatted = version.version_number_name;
          }

          if (version.commands) {
            var commands = version.commands;
            version.actions = _
              .chain(commands)
              .keys()
              .map(function (key) {
                var attributes = commands[key];
                attributes.signature = key;
                return attributes;
              })
              .value();
            delete version.commands;
            delete version.commands_map;
            delete version.commands_order;
          }

          return version;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('csui/models/version',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/url', 'csui/models/actions',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/versions/v2.versions.response.mixin',
  'csui/models/server.adaptors/version.mixin',
  'csui/utils/deepClone/deepClone'
], function (module, _, Backbone, log, Url, ActionCollection, DelayedCommandableV2Mixin,
    ExpandableMixin, ResourceMixin, UploadableMixin, VersionsableV2ResponseMixin, ServerAdaptorMixin) {
  'use strict';

  var VersionModel = Backbone.Model.extend({

    idAttribute: 'version_number',

    constructor: function VersionModel(attributes, options) {
      attributes || (attributes = {});
      options = _.extend({expand: ['user', 'versions{id, owner_id}']}, options);

      // TODO: Remove this, this is set for version model only because widgets like metadata
      // do not handle models without delayed commands. Find a boolean that every model
      // must use when it has delayed actions so that widgets can behave accordingly.
      this.lazyActionsDisabled = options.lazyActionsDisabled || true;

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeUploadable(options)
          .makeVersionableV2Response(options)
          .makeDelayedCommandableV2(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);

      if (!attributes.actions) {
        this.actions = new ActionCollection();
      }
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector,
        expand: _.deepClone(this.expand)
      });
    },

    set: function (key, val, options) {
      var attrs;
      if (key == null) {
        return this;
      }

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // TODO: Support sub-models and sub-collections in general
      if (attrs.actions) {
        if (this.actions) {
          this.actions.reset(attrs.actions, options);
        } else {
          this.actions = new ActionCollection(attrs.actions);
        }
      }

      // do the usual set
      return Backbone.Model.prototype.set.call(this, attrs, options);
    },

    isNew: function () {
      return !this.has('version_number');
    },

    isFetchable: function () {
      return !!(this.get('id') && this.get('version_number'));
    }

  });

  ExpandableMixin.mixin(VersionModel.prototype);
  UploadableMixin.mixin(VersionModel.prototype);
  ResourceMixin.mixin(VersionModel.prototype);
  DelayedCommandableV2Mixin.mixin(VersionModel.prototype);
  VersionsableV2ResponseMixin.mixin(VersionModel.prototype);
  ServerAdaptorMixin.mixin(VersionModel.prototype);

  return VersionModel;

});

csui.define('csui/models/view.state.model',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/url', 'csui/utils/namedsessionstorage'

], function (module, _, Backbone, log, Url, NamedSessionStorage) {
  'use strict';

  var PublicLang;
  csui.require(['i18n!csui/pages/start/nls/lang'
  ], function (publicLang) {
    PublicLang = publicLang;
  }.bind(this));

  var MAX_ROUTERS_INFO_STACK = 50;

  var constants = Object.freeze({
    LAST_ROUTER: 'lastRouter',
    CURRENT_ROUTER: 'currentRouter',
    CURRENT_ROUTER_FRAGMENT: 'currentRouterFragment',
    CURRENT_ROUTER_NAVIGATE_OPTIONS: 'currentRouterNavigateOptions',
    CURRENT_ROUTER_SCOPE_ID: 'currentRouterScopeId',
    BACK_TO_TITLE: 'back_to_title',
    METADATA_CONTAINER: 'metadata_container',
    STATE: 'state',
    DEFAULT_STATE: 'default_state',
    SESSION_STATE: 'session_state',
    NAVIGATION_HISTORY_ARRAY: 'navigationHistoryArray',
    URL_PARAMS: 'urlParams',
    ALLOW_WIDGET_URL_PARAMS: 'allowWidgetUrlParams',
    START_ID: 'start_id',
    BREADCRUMB: 'breadcrumb',
    QUERY_STRING_PARAMS: 'query_string_params'
  });

  var counter = 0;

  /*var noExpanding = /\bno_expand\b(?:=([^&]*)?)?/i.exec(location.search);
  noExpanding = noExpanding && noExpanding[1] !== 'false';*/
    
  // The view state model stores variables in the state attribute. Those variables are used to build
  // the url parameters. In this sense the url is the long term storage.
  // The session session_state contains variables that are stored in the browser session storage.
  var ViewStateModel = Backbone.Model.extend({

    constructor: function ViewStateModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      if (counter === 0) {
        this.storage = new NamedSessionStorage(module.id);
      } else {
        this.storage = new NamedSessionStorage(module.id + '_' + counter);
        this.storage.destroy();
      }

      counter++;

      this.set('enabled', attributes ? attributes.enabled : false);

      this._navigationHistory = [];

      _.values(constants).forEach(function (property) {
        var value = attributes ? attributes[property] : this.storage.get(property);
        if (value && (property.indexOf("Array") !== -1 || property.indexOf("urlParams") !== -1)) {
          value = _.isString(value) ? JSON.parse(value) : value;
        }
        this.listenTo(this, 'change:' + property, this._syncWithStorage.bind(this, property));
        this.set(property, value);
      }.bind(this));

      this._navigationHistory = this.get(constants.NAVIGATION_HISTORY_ARRAY) || [];
    },

    CONSTANTS: constants,

    _setViewStateAttribute: function (attributeName, key, value, options) {
      options || (options = {});
      if (this._getViewStateAttribute(attributeName, key) === value) {
        return;
      }

      var object = this.get(attributeName) || {};
      object = _.clone(object);
      if (value === undefined || value === '') {
        delete object[key];
      } else {
        object[key] = value;
      }
      options = _.omit(options, 'encode');
      this.set(attributeName, object, options);
      this._syncWithStorageIfSilentUpdate(attributeName, options);
      return true;
    },

    _getViewStateAttribute: function(attributeName, key, decode) {
      var state = this.get(attributeName);
      if (state) {
        return state[key];
      }
    },

    // All the view state elements are added to the url. These variables are stored in the url.
    setViewState: function (key, value, options) {
      if (key === 'state') {
        this.set(constants.STATE, value, options);
        this._syncWithStorageIfSilentUpdate(constants.STATE, options);
      } else {
        return this._setViewStateAttribute(constants.STATE, key, value, options);
      }
    },

    getViewState: function (key, decode) {
      return this._getViewStateAttribute(constants.STATE, key, decode);
    },

    // Default states are not serialized in the url even if they exist in the 'state' object.
    setDefaultViewState: function(key, value, options) {
      return this._setViewStateAttribute(constants.DEFAULT_STATE, key, value, options);
    },

    getDefaultViewState: function(key, decode) {
      return this._getViewStateAttribute(constants.DEFAULT_STATE, key, decode);
    },

    // All variables in the session view state are stored in the session local storage.
    // They are used to initialize the widgets view
    setSessionViewState: function (key, value, options) {
      options || (options = {});
      if (this.getSessionViewState(key) === value) {
        return;
      }
      var sessionState = this.get(constants.SESSION_STATE) || {};
      sessionState = _.clone(sessionState);
      sessionState[key] = value;
      this.set(constants.SESSION_STATE, sessionState, options);
      this._syncWithStorageIfSilentUpdate(constants.SESSION_STATE, options);
      return true;
    },

    getSessionViewState: function (key) {
      var state = this.get(constants.SESSION_STATE);
      if (state) {
        return state[key];
      }
    },

    _syncWithStorageIfSilentUpdate: function(property, options) {
      if (options && options.silent) {
        this._syncWithStorage(property);
      }
    },

    _syncWithStorage: function (property) {
      var value = this.get(property);
      if (_.isArray(value)) {
        value = JSON.stringify(value);
      }
      this.storage.set(property, value);
    },

    getCurrentRouterName: function() {
      return this.get(this.CONSTANTS.CURRENT_ROUTER);
    },

    onNavigationStarted: function (newRouterInfo, canRestore) {

      this.trigger('before:navigate');

      this.set('navigated', true);

      var restore = this.isSameRoutingInfo(newRouterInfo, this.getLastHistoryEntry());
      if (!canRestore) {
        restore = false;
      }
      // we need to do this for backward compatibility. This is for any code that uses this
      // value from previous implementation.
      this.set(this.CONSTANTS.LAST_ROUTER, this.get(this.CONSTANTS.CURRENT_ROUTER));

      if (restore) {
        this._currentHistoryEntry = undefined;
        this._restoreStatesFromHistoryEntry(this._navigationHistory.pop());
        this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
        this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
      } else {
        this._savePotentialHistoryEntry();
      }
    },

    _savePotentialHistoryEntry: function () {
      var storage = this.storage;
      var routerName = storage.get(constants.CURRENT_ROUTER);
      if (routerName) {

        var state = this.get('saved_viewstate');
        if (!state) {
          state = this.storage.get(constants.STATE);
        }

        // some context plugins could change the urlParams in the viewState
        // make sure we take the urlParams from the router and not the viewStateModel.
        var router = this.get('PerspectiveRouting').getRouter(routerName);
        
        this._currentHistoryEntry = {
          'router': routerName,
          'back_to_title': this.storage.get(constants.BACK_TO_TITLE),
          'urlParam': router && router.urlParams,
          'fragment': this.storage.get(constants.CURRENT_ROUTER_FRAGMENT),
          'scopeId': this.storage.get(constants.CURRENT_ROUTER_SCOPE_ID),
          'navigateOptions': this.storage.get(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS),
          'state': state,
          'sessionState': this.storage.get(constants.SESSION_STATE),
          'defaultState': this.storage.get(constants.DEFAULT_STATE)
        };
      }
    },

    getPotentialHistoryEntry: function () {
      return this._currentHistoryEntry;
    },

    onContextFetch: function () {
      this.trigger('navigate', this._currentHistoryEntry);
      this.unset("isFromHistory", {silent: true});
      this._currentHistoryEntry && this._addRouterInfoToHistory(this._currentHistoryEntry);
    },

    _restoreStatesFromHistoryEntry : function(historyInfo) {
      if (historyInfo) {
        var restoreStates = {
          'isFromHistory': true,
          'state': historyInfo.state,
          'default_state': historyInfo.defaultState,
          'session_state': historyInfo.sessionState
        };
        this.set(restoreStates, {silent: true});
        ['state', 'default_state', 'session_state'].forEach(function (property) {
          this._syncWithStorage(property);
        }.bind(this));
      }
    },

    _addRouterInfoToHistory: function (historyEntry) {

      // do not add duplicate entries
      if (this._navigationHistory.length > 0 &&
            JSON.stringify(historyEntry) === JSON.stringify(this._navigationHistory[this._navigationHistory.length - 1])) {
        return;
      }

      this._navigationHistory.push(historyEntry);

      if (this._navigationHistory.length > MAX_ROUTERS_INFO_STACK) {
        this._navigationHistory.shift();
      }

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    _copyAttributes: function (viewStateModel) {
      Object.keys(viewStateModel.attributes).forEach(function (attributeName) {
        this.unset(attributeName);
        this.set(attributeName, viewStateModel.get(attributeName));
      }.bind(this));
    },

    saveHistory: function() {
      this.savedViewStateModel = this.clone();
      this.savedViewStateModel._copyAttributes(this);
      this._resetAttributes();
    },

    _resetAttributes: function() {

      this._navigationHistory = [];

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);

      this.set(constants.LAST_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER_FRAGMENT, undefined);
      this.set(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS, undefined);
      this.set(constants.CURRENT_ROUTER_SCOPE_ID, undefined);
      this.set(constants.BACK_TO_TITLE, undefined);
      this.set(constants.METADATA_CONTAINER, undefined);
      this.set(constants.STATE, undefined);
      this.set(constants.DEFAULT_STATE, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.URL_PARAMS, undefined);
      this.set(constants.ALLOW_WIDGET_URL_PARAMS, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.START_ID, undefined);
      this.set(constants.BREADCRUMB, undefined);
    },

    restoreHistory: function () {
      if (this.savedViewStateModel) {
        this._copyAttributes(this.savedViewStateModel);
        this.savedViewStateModel.clean();
        this.savedViewStateModel = undefined;

        var value = this.storage.get(constants.NAVIGATION_HISTORY_ARRAY);
        if (value) {
          value = JSON.parse(value);
          this._navigationHistory = value;
        }
      }
    },

    hasRouted: function () {
      return this._navigationHistory.length > 0;
    },

    isSameRoutingInfo: function (router1Info, router2Info) {
      return router1Info && router2Info &&
             router1Info.router === router2Info.router &&
             router1Info.fragment === router2Info.fragment;
    },

    /**
     * Warning: Cleaning of state will eventually clears the internals session storage. 
     * Thus, restoring the state (perhaps on page refresh or navigating between pages) will not be possible after this operation.
     */
    clean: function() {
      // Clear model state
      this.clear(); 
      // Clear session storage
      this.storage.destroy();
    },

    getBackToTitle: function () {

      var title = PublicLang.back;
      if (this._currentHistoryEntry) {
        title = this._currentHistoryEntry.back_to_title || title;
      } else {
        var index = this.getLastRouterIndex();
        if (index !== -1) {
          var lastRouterInfo = this._navigationHistory[index];
          if (lastRouterInfo) {
            title = lastRouterInfo.back_to_title || title;
          }
        }
      }

      return title;
    },

    clearHistory: function() {
      this._navigationHistory = [];
      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    clearCurrentHistoryEntry: function () {
      this._currentHistoryEntry = undefined;
    },

    getLastRouterIndex: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].router !== this.get(constants.CURRENT_ROUTER)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getIndexOfOfLastApplicationScope: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].scopeId !== this.get(constants.CURRENT_ROUTER_SCOPE_ID)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getLastHistoryEntry: function () {
      return this._navigationHistory && this._navigationHistory.length > 0 &&
             this._navigationHistory[this._navigationHistory.length - 1];
    },

    getHistory: function () {
      return this._navigationHistory;
    },

    restoreRouterOfLastApplicationScope: function () {
      this._restoreHistoryEntryByIndex(this.getIndexOfOfLastApplicationScope());
    },

    restoreLastRouter: function () {
      this._restoreHistoryEntryByIndex(this.getLastRouterIndex());
    },

    restoreLastFragment: function () {
      this._restoreHistoryEntryByIndex(this._navigationHistory.length - 1);
    },

    restoreHistoryEntryByIndex: function(index) {
      return this._restoreHistoryEntryByIndex(index);
    },

    _restoreHistoryEntryByIndex: function (index) {
      if (index !== -1 && index < this._navigationHistory.length) {
        this._navigationHistory.length = index + 1;
        var historyEntryInfo = this.getLastHistoryEntry();
        this._restoreStatesFromHistoryEntry(historyEntryInfo);
        this.get('PerspectiveRouting').restoreRouter(historyEntryInfo);
      } else {
        // Just go back if no history. It should not happen really.
        window.history.back();
      }
    },

    addUrlParameters: function (urlParameters, context, replace, force) {
      if (!force && !this.get(this.CONSTANTS.ALLOW_WIDGET_URL_PARAMS)) {
        return;
      }
      var perspectiveRouting = this.get('PerspectiveRouting');
      // The activeRouterInstance gets inserted in the viewStateModel
      // once the new router is activated and before the routing happens
      // But the new router from that time on will start listening to the viewState change.
      var activeRouter = this.get("activeRouterInstance");
      var routerName = activeRouter && activeRouter.name;
      routerName = routerName || this.get(constants.CURRENT_ROUTER);
      return perspectiveRouting &&
                   perspectiveRouting.addUrlParameters(routerName, urlParameters, replace);
    },

    clear: function () {
      this.storage.destroy();
      // init also all variables, just incase someone wants to use this viewStateModel instance again.
      // see SAPSSF-7778
      this._navigationHistory = [];
      this._currentHistoryEntry = undefined;
      Backbone.Model.prototype.clear.call(this, {silent: true});
    },

    hasNotNavigatedAndNotJustStarted:function() {
    }

  }, {
    CONSTANTS: constants,
    clean: function() {
      var storage = new NamedSessionStorage(module.id);
      storage.destroy();
    }
  });

  return ViewStateModel;
});

csui.define('csui/models/perspective/personalization.server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
], function (_, $, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },
        url: function () {
          var perspectiveId = this.get('perspective_id'),
              url           = new Url(this.connector.connection.url).getApiBase('v2');
          if (!!perspectiveId) {
            // Create a new node by POST /perspectives
            url = Url.combine(url, 'perspectives', perspectiveId, 'personalization');
          } else {
            throw new Error('Unsupported perspective_id value');
          }
          return url;
        },
        // TODO Take care of parse, once REST API response finalized.
      });
    }
  };

  return ServerAdaptorMixin;
});
  
csui.define('csui/models/perspective/localstorage.server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url',
  'csui/utils/namedlocalstorage'
], function (_, $, Url, NamedLocalStorage) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        getStorage: function () {
          var deferred = $.Deferred(),
              that     = this;
          csui.require(['csui/utils/contexts/factories/user'], function (UserModelFactory) {
            var user          = that.options.context.getModel(UserModelFactory),
                currentUserId = user.get('id');
            if (!currentUserId) {
              var userFactory = that.options.context.getFactory(UserModelFactory);
              if (userFactory.initialResponse) {
                currentUserId = userFactory.initialResponse.data.id;
              }
            }
            if (!that.namedLocalStorage) {
              that.namedLocalStorage = new NamedLocalStorage('perspective:personalization:' +
                                                             currentUserId);
            }
            that.namedLocalStorage;
            return deferred.resolve(that.namedLocalStorage);
          }, deferred.reject);
          return deferred;
        },

        savePerspective: function () {
          var that = this;
          return this.getStorage().then(function (storage) {
            return storage.set(that.getNodeId(), that.toJSON());
          });
        },

        fetchPerspective: function () {
          var that = this;
          return this.getStorage().then(function (storage) {
            return storage.get(that.getNodeId());
          });
        },
        sync: function (method, model, options) {
          var deferred = $.Deferred();
          switch (method) {
          case 'create':
          case 'update':
          case 'patch':
            model.savePerspective().then(function () {
              deferred.resolve(this);
            }, deferred.reject);

            break;
          case 'read':
            model.fetchPerspective().then(function (personalization) {
              if (!_.isEmpty(personalization)) {
                model.set(personalization);
              }
              deferred.resolve(model);
            }, deferred.reject);
            break;
          default:
            deferred.reject();
            break;
          }
          return deferred.promise();
        }
      });

    }
  };

  return ServerAdaptorMixin;
});
/**
 * Utiltiy of Perspective editing and Personalization
 */
csui.define('csui/utils/perspective/perspective.util',['module'], function (module) {

  var constants = Object.freeze({
    MODE_EDIT_PERSPECTIVE: 'edit',
    MODE_PERSONALIZE: 'personalize',
    WIDGET_PERSPECTIVE_PLACEHOLDER: 'csui/perspective.manage/widgets/perspective.placeholder',
    WIDGET_SHORTCUTS: 'csui/widgets/shortcuts',
    KEY_WIDGET_ID: 'w_id',
    KEY_HIDDEN: 'hidden',
    WIDGET_ID_PERSPECTIVE_PREFIX: 'pman-',
    WIDGET_ID_PESONALIZATION_PREFIX: 'personal-'
  });

  var EXTRA_WIDGET_CONFIG_KEYS = [constants.KEY_WIDGET_ID, constants.KEY_HIDDEN];

  //To check required fields in widget options
  function hasRequiredFields(manifest) {
    if (!!manifest && !!manifest.schema && !!manifest.schema.required &&
        manifest.schema.required.length > 0) {
      // Has required fields in the widget options
      return true;
    }
    return false;
  }

  function isEligibleForLiveWidget(manifest) {
    manifest = manifest || {};
    if (!!manifest.callback || hasRequiredFields(manifest)) {
      return false;
    }
    return true;
  }

  function getExtraWidgetKeys() {
    return EXTRA_WIDGET_CONFIG_KEYS;
  }

  /**
   * Returns shortcut group widget for personalization mode, otherwise default pman empty placeholder
   *
   * @param {`edit` or `personalize`} perspectiveMode
   */
  function getEmptyPlaceholderWidgetType(perspectiveMode) {
    switch (perspectiveMode) {
    case constants.MODE_PERSONALIZE:
      return constants.WIDGET_SHORTCUTS;
    default:
      return constants.WIDGET_PERSPECTIVE_PLACEHOLDER;
    }
  }

  function isEmptyPlaceholder(widget, perspectiveMode) {
    if (widget.type === constants.WIDGET_PERSPECTIVE_PLACEHOLDER) {
      return true;
    }
    var emptyType = getEmptyPlaceholderWidgetType(perspectiveMode);
    return emptyType === widget.type && widget.options && widget.__isPlacehoder;
  }

  function generateWidgetId(perspectiveMode) {
    var prefix = constants.WIDGET_ID_PERSPECTIVE_PREFIX;
    if (perspectiveMode === constants.MODE_PERSONALIZE) {
      prefix = constants.WIDGET_ID_PESONALIZATION_PREFIX;
    }
    return prefix + (+new Date());
  }

  function isPersonalWidget(widget) {
    var widgetId = widget && widget[constants.KEY_WIDGET_ID];
    if (!widgetId) {
      // Widet ID not present. Could be legacy perspectives
      return false;
    }
    // Check if IDs starts with personalization prefix
    return isPersonalWidgetId(widgetId);
  }

  function isPersonalWidgetId(widgetId) {
    return widgetId && widgetId.substr(0, constants.WIDGET_ID_PESONALIZATION_PREFIX.length) ===
           constants.WIDGET_ID_PESONALIZATION_PREFIX;
  }

  function hasWidgetId(widget) {
    return widget && !!widget[constants.KEY_WIDGET_ID];
  }

  function isErrorWidget(widget) {
    return widget && widget.type === 'csui/widgets/error';
  }

  function isHiddenWidget(widget) {
    if (isErrorWidget(widget)) {
      return isHiddenWidget(widget.options.originalWidget);
    }
    return widget && !isPersonalWidget(widget) && (widget[constants.KEY_HIDDEN] === true);
  }

  function setWidgetHidden(widget, hide) {
    if (isErrorWidget(widget)) {
      setWidgetHidden(widget.options.originalWidget, hide);
    } else {
      widget && (widget[constants.KEY_HIDDEN] = hide);
    }
  }

  return {
    MODE_EDIT_PERSPECTIVE: constants.MODE_EDIT_PERSPECTIVE,
    MODE_PERSONALIZE: constants.MODE_PERSONALIZE,
    WIDGET_PERSPECTIVE_PLACEHOLDER: constants.WIDGET_PERSPECTIVE_PLACEHOLDER,
    WIDGET_SHORTCUTS: constants.WIDGET_SHORTCUTS,
    KEY_WIDGET_ID: constants.KEY_WIDGET_ID,
    WIDGET_ID_PERSPECTIVE_PREFIX: constants.WIDGET_ID_PERSPECTIVE_PREFIX,
    WIDGET_ID_PESONALIZATION_PREFIX: constants.WIDGET_ID_PESONALIZATION_PREFIX,

    isEligibleForLiveWidget: isEligibleForLiveWidget,
    hasRequiredFields: hasRequiredFields,
    isEmptyPlaceholder: isEmptyPlaceholder,
    getExtraWidgetKeys: getExtraWidgetKeys,
    getEmptyPlaceholderWidgetType: getEmptyPlaceholderWidgetType,
    generateWidgetId: generateWidgetId,
    isPersonalWidget: isPersonalWidget,
    isPersonalWidgetId: isPersonalWidgetId,
    hasWidgetId: hasWidgetId,
    isHiddenWidget: isHiddenWidget,
    setWidgetHidden: setWidgetHidden
  };

});
/**
 * Delta Format:
 * {
 *    "perspectiveWidgets": perspectiveWidgetIds,
 *    "personalWidgets": personalWidgets,
 *    "perspecitve_id" : 1235,
 *    "perspective_version": 1,
 *    "type" : "flow"
 *    "order": ['perspective-1', 'perspective-0', 'perspective-2', 'personalize-0'],
 *    "hidden": ['perspective-4', 'perspective-7']
*  }
 */
csui.define('csui/models/perspective/personalize/delta.generator',['module', 'csui/lib/underscore', 'csui/lib/backbone',
      'csui/utils/perspective/perspective.util'],
    function (module, _, Backbone, PerspectiveUtil) {

      var DeltaGenerator = function (options) {
        this.personalization = options.personalization;
        this.perspective = options.perspective;
        if (this.perspective instanceof Backbone.Model) {
          this.perspective = this.perspective.toJSON();
        }
      };

      _.extend(DeltaGenerator.prototype, {
        getDeltaOfCurrentPerspective: function (allPerspectiveWidgets,allPersonalWidgets) {
          allPerspectiveWidgets = _.reject(allPerspectiveWidgets, PerspectiveUtil.isPersonalWidget);
           var perspectiveWidgetIds = _.pluck(allPerspectiveWidgets, PerspectiveUtil.KEY_WIDGET_ID),
           personalWidgets = _.filter(allPersonalWidgets, PerspectiveUtil.isPersonalWidget),
           personalParts = _.partition(allPersonalWidgets, PerspectiveUtil.isHiddenWidget),
           personalActiveWidgets = _.pluck(personalParts[1], PerspectiveUtil.KEY_WIDGET_ID),
           personalHiddenWidgets = _.pluck(personalParts[0], PerspectiveUtil.KEY_WIDGET_ID);
          return {
            perspectiveWidgets: perspectiveWidgetIds,
            personalWidgets: personalWidgets,
            order: personalActiveWidgets,
            hidden: personalHiddenWidgets
          };
        },
        getDelta: function () {
          var result = _.pick(this.perspective, 'type', 'perspective_id', 'perspective_version');
          result.perspective_id = result.perspective_id || this.perspective.id;
          if (this.perspective.override) {
            _.extend(result,
                _.pick(this.perspective.override, 'perspective_id', 'perspective_version'));
          } else {
            // Possibly APIs not updated to latest. This case, lets assume the version as 1
            result.perspective_version = result.perspective_version || 1;
          }
          switch (this.perspective.type) {
            case 'flow': // flow layout
              var delta = this.getDeltaOfCurrentPerspective(this.perspective.options.widgets, this.personalization.options.widgets);
              _.extend(result, delta);
              return result;
            case 'sidepanel-right': // Right side panel layout
            case 'sidepanel-left': // Left side panel layout
              _.extend(result, {
                banner: this.getDeltaOfCurrentPerspective(this.perspective.options.banner, this.personalization.options.banner),
                content: this.getDeltaOfCurrentPerspective(this.perspective.options.content, this.personalization.options.content),
                sidebar: this.getDeltaOfCurrentPerspective(this.perspective.options.sidebar, this.personalization.options.sidebar),
              });
              return result;
            default:
              throw new Error('Personalization not supported.');
          }
        }
      });
      return DeltaGenerator;

    });
csui.define('csui/models/perspective/personalize/delta.resolver',['module', 'csui/lib/underscore', 'csui/lib/backbone',
      'csui/utils/perspective/perspective.util'],
    function (module, _, Backbone, PerspectiveUtil) {

      var DeltaResolver = function (options) {
        this.delta = options.delta;
        this.perspective = options.perspective;
        if (this.perspective instanceof Backbone.Model) {
          this.perspective = this.perspective.toJSON();
        }
      };

      _.extend(DeltaResolver.prototype, {

        resolveContent: function (perspectiveWidgets, zone) {
            zone = this.delta[zone];
            var personalWidgets = this.delta.personalWidgets || zone && zone.personalWidgets,
            widgetOrder = this.delta.order || zone && zone.order,
            hiddenWidgetIds = this.delta.hidden || zone && zone.hidden,
            personalWidgetsById, perspectiveWidgetsById, newPerspectiveWidgets,
            allActiveWidgets, hiddenWidgets;
          personalWidgets = this.delta.personalWidgets || zone && zone.personalWidgets,
            personalWidgetsById = _.indexBy(personalWidgets, PerspectiveUtil.KEY_WIDGET_ID);
          perspectiveWidgetsById = _.indexBy(perspectiveWidgets, PerspectiveUtil.KEY_WIDGET_ID);
          widgetOrder = _.filter(widgetOrder, function (widgetId) {
            return _.has(perspectiveWidgetsById, widgetId) || _.has(personalWidgetsById, widgetId);
          });

          hiddenWidgetIds = _.filter(hiddenWidgetIds, function (widgetId) {
            return _.has(perspectiveWidgetsById, widgetId);
          });

          newPerspectiveWidgets = _.filter(perspectiveWidgets, function (widget) {
            var widgetId = widget[PerspectiveUtil.KEY_WIDGET_ID];
            return !_.contains(widgetOrder, widgetId) && !_.contains(hiddenWidgetIds, widgetId);
          });

          allActiveWidgets = _.map(widgetOrder, function (widgetId) {
            if (PerspectiveUtil.isPersonalWidgetId(widgetId)) {
              return personalWidgetsById[widgetId];
            } else {
              return perspectiveWidgetsById[widgetId];
            }
          });
          hiddenWidgets = _.map(hiddenWidgetIds, function (widgetId) {
            // Make copy of original perspective view to avoid changes to it.
            var widget = _.clone(perspectiveWidgetsById[widgetId]);
            PerspectiveUtil.setWidgetHidden(widget, true);
            return widget;
          });
          return _.union(allActiveWidgets, newPerspectiveWidgets, hiddenWidgets);
        },

        canMergeDelta: function () {
          return (this.perspective.perspectiveId === this.delta.perspectiveId &&
                 this.perspective.type === this.delta.type) ||
                 //when layout is changed from sidepanel-right to sidepanel-left or vice-versa,
                 //personalized changes have to be merged
                 //TODO: remove this code once REST-API issue is fixed
                 ((this.delta.type === 'sidepanel-right' && this.perspective.type ==='sidepanel-left')
                 || (this.delta.type === 'sidepanel-left' && this.perspective.type ==='sidepanel-right'));
        },

        getPersonalization: function () {
          if (!this.canMergeDelta()) {
            return this.perspective;
          }
          var result = _.clone(this.perspective);
          switch (this.delta.type) {
            case 'flow':
              _.extend(result, {
                options: { widgets: this.resolveContent(this.perspective.options.widgets) },
                personalizations: this.delta
              });
              return result;
            case 'sidepanel-right': // Right side panel layout
            case 'sidepanel-left': // Left side panel layout
              _.extend(result, {
                options: {
                  content: this.resolveContent(this.perspective.options.content, 'content'),
                  sidebar: this.resolveContent(this.perspective.options.sidebar, 'sidebar'),
                  banner: this.resolveContent(this.perspective.options.banner, 'banner')
                },
                personalizations: this.delta,
              });
              return result;
            default:
              return result;
          }
        }
      });

      return DeltaResolver;

    });
csui.define('csui/models/perspective/personalize/personalize.guide',['module', 'csui/models/perspective/personalize/delta.generator',
  'csui/models/perspective/personalize/delta.resolver'
], function (module, DeltaGenerator, DeltaResolver) {

  var PersonalizeGuide = {
    getDelta: function (perspective, personalization) {
      var generator = new DeltaGenerator(
          {perspective: perspective, personalization: personalization});
      return generator.getDelta();
    },

    getPersonalization: function (perspective, delta) {
      var merger = new DeltaResolver({perspective: perspective, delta: delta});
      return merger.getPersonalization();
    }
  };

  return PersonalizeGuide;

});
csui.define('csui/models/perspective/personalization.model',["require", "module", 'csui/lib/jquery', 'csui/lib/underscore', "csui/lib/backbone",
  'csui/models/node/node.model',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/perspective/personalization.server.adaptor.mixin',
  'csui/models/perspective/localstorage.server.adaptor.mixin',
  'csui/models/perspective/personalize/personalize.guide',
  'csui/utils/perspective/perspective.util'
], function (require, module, $, _, Backbone, NodeModel,
    UploadableMixin, ConnectableMixin, ServerAdaptorMixin, LocalStorageServerAdaptorMixin,
    PersonalizeGuide, PerspectiveUtil) {
  "use strict";

  var config = _.extend({
    persistOnLocalStorage: false
  }, module.config());

  var PersonalizationModel = Backbone.Model.extend({

    constructor: function PersonalizationModel(attributes, options) {
      PersonalizationModel.__super__.constructor.apply(this, arguments);
      this.options = options;
      if (config.persistOnLocalStorage) {
        this.makeServerAdaptor(options);
      } else {
        this.makeUploadable(options)
            .makeConnectable(options)
            .makeServerAdaptor(options);
      }
      this.resolvePersonalization = true;
    },

    getPerspectiveId: function () {
      return this.get('perspective_id');
    },

    /**
     * Get the perspective config JSON of personalization
     */
    getPerspective: function () {
      if (!this.resolvePersonalization) {
        // No updates to delta after last resolution of personalization
        this.personalization;
      }
      this.personalization = PersonalizeGuide.getPersonalization(this.options.perspective,
          this.toJSON());
      this.resolvePersonalization = false;
      return this.personalization;
    },

    /**
     * Set the perspective config JSON of personalization
     */
    setPerspective: function (personalization, options) {
      var delta = PersonalizeGuide.getDelta(this.options.perspective, personalization);
      this.set(delta, options);
      // Mark to re-resolve of personalization from delta
      this.resolvePersonalization = true;
    },

    update: function (changes, options) {
      var personalization = this.getPerspective();
      _.extend(personalization, changes.perspective);
      this.setPerspective(personalization, options);
    },

    prepareFormData: function (data, options) {
      var payload = {
        personalizations: JSON.stringify(data),
        perspective_id: this.get('perspective_id'),
        perspective_version: this.get('perspective_version'),
        node: this.getNodeId()
      };
      return payload;
    },

    getNodeId: function () {
      return (!this.options.sourceModel || !(this.options.sourceModel instanceof NodeModel) ||
              !(this.options.sourceModel.has('id'))) ? 'landing-page' :
             this.options.sourceModel.get('id');
    },

  }, {
    loadPersonalization: function (sourceModel, context) {
      var deferred,
          perspective = sourceModel.get('perspective');
      if (!perspective) {
        // Perspective info not available in source model, hence personalization cannot exist. 
        return $.Deferred().resolve().promise();
      }
      if (config.persistOnLocalStorage) {
        deferred = PersonalizationModel.loadPersonalizationFromLocalStorage(sourceModel, context,
            perspective);
      } else if (!!perspective.personalizations) {
        var personalization = new PersonalizationModel(perspective.personalizations,
            {sourceModel: sourceModel, perspective: perspective});
        deferred = $.Deferred().resolve(personalization.getPerspective());
      } else {
        deferred = $.Deferred().resolve();
      }
      deferred.then(function (personalization) {
        if (!personalization || _.isEmpty(personalization)) {
          return undefined;
        }
        return _.defaults(personalization, {perspectiveMode: PerspectiveUtil.MODE_PERSONALIZE});
      });
      return deferred.promise();
    },

    loadPersonalizationFromLocalStorage: function (sourceModel, context, perspective) {
      var deferred = $.Deferred();
      var personalization = new PersonalizationModel({},
          {sourceModel: sourceModel, context: context, perspective: perspective});
      personalization.fetch().then(function () {
        var result = personalization.getPerspective();
        if (!_.isEmpty(result)) {
          deferred.resolve(result);
        } else {
          deferred.resolve();
        }
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });

  if (config.persistOnLocalStorage) {
    LocalStorageServerAdaptorMixin.mixin(PersonalizationModel.prototype);
  } else {
    UploadableMixin.mixin(PersonalizationModel.prototype);
    ConnectableMixin.mixin(PersonalizationModel.prototype);
    ServerAdaptorMixin.mixin(PersonalizationModel.prototype);
  }

  return PersonalizationModel;

});

csui.define('csui/models/compound.document/reorganize/server.adaptor.mixin',[
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
  ], function (_, $, Url) {
    'use strict';

    var ServerAdaptorMixin = {

        mixin: function (prototype) {

        return _.extend(prototype, {
            makeServerAdaptor: function (options) {
            return this;
            },

            url: function () {
                var url = this.connector.connection.url.replace('/v1', '/v2');
                var query = Url.combineQueryString({
                    expand: 'properties{original_id}'
                });
                return Url.combine(url, 'nodes/' + this.options.nodeId + '/nodes/all?' + query);
            },

            parse: function (response, options) {
            var res = response.results;
            return res;
            },
        });
        }
    };
    return ServerAdaptorMixin;
});
csui.define('csui/models/compound.document/reorganize/reorganize.collection',['csui/lib/underscore',
  'csui/lib/backbone',
  'nuc/models/browsable/browsable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/browsable/v1.request.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/node/node.model',
  'csui/models/compound.document/reorganize/server.adaptor.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin'
], function (_, Backbone, BrowsableMixin, ConnectableMixin, FetchableMixin, BrowsableV1RequestMixin,
  BrowsableV2ResponseMixin, NodeModel, ServerAdaptorMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin,
  ExpandableV2Mixin, StateRequestorMixin, DelayedCommandableV2Mixin) {

var ReorganizeCollection = Backbone.Collection.extend({
    model: NodeModel,
    constructor: function ReorganizeCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeFetchable(options)
        .makeBrowsableV2Response(options)
        .makeAdditionalResourcesV2Mixin(options)
        .makeFieldsV2(options)
        .makeExpandableV2(options)
        .makeStateRequestor(options)
        .makeServerAdaptor(options);
    }
  });

  BrowsableMixin.mixin(ReorganizeCollection.prototype);
  BrowsableV1RequestMixin.mixin(ReorganizeCollection.prototype);
  BrowsableV2ResponseMixin.mixin(ReorganizeCollection.prototype);
  ConnectableMixin.mixin(ReorganizeCollection.prototype);
  FetchableMixin.mixin(ReorganizeCollection.prototype);
  ServerAdaptorMixin.mixin(ReorganizeCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(ReorganizeCollection.prototype);
  FieldsV2Mixin.mixin(ReorganizeCollection.prototype);
  ExpandableV2Mixin.mixin(ReorganizeCollection.prototype);
  StateRequestorMixin.mixin(ReorganizeCollection.prototype);
  DelayedCommandableV2Mixin.mixin(ReorganizeCollection.prototype);

  return ReorganizeCollection;
});
csui.define('csui/models/widget/widget.model',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/utils/log',
  'csui/models/server.module/server.module.collection',
  'csui/models/tool.item.config/tool.item.config.collection',
  'csui/models/tool.item.mask/tool.item.mask.collection'
], function (require, module, _, $, Backbone, log,
    ServerModuleCollection, ToolItemConfigCollection, ToolItemMaskCollection) {
  'use strict';

  log = log(module.id);

  var WidgetModel = Backbone.Model.extend({

    defaults: {
      id: null,       // Require.js module ID
      view: null,     // Resolved function object of the widget's view controller
      manifest: null, // Resolved meta-data describing the widget
      error: null     // Error from the widget's resolution if it failed
    },

    constructor: function WidgetModel(attributes, options) {
      this.options = _.defaults({}, options, {
        includeView: true,
        includeManifest: true,
        includeServerModule: true,
        includeToolItems: true
      });
      if (this.options.includeToolItems) {
        this.options.includeManifest = true;
      }
      WidgetModel.__super__.constructor.call(this, attributes, this.options);
      this.serverModule = new ServerModuleCollection.prototype.model();
      this.actions = new Backbone.Collection();
    },

    getDefaultData: function () {
      var manifest = this.get('manifest');
      return manifest ? this._getDefaultPropertyValue(manifest.schema) : {};
    },

    _getDefaultPropertyValue: function (schema) {
      if (schema) {
        if (schema.type === 'object') {
          return _.reduce(schema.properties,
              function (result, propertySchema, propertyName) {
                result[propertyName] = this._getDefaultPropertyValue(propertySchema);
                return result;
              }, {}, this);
        }
        return schema['default'];
      }
    },

    _getDefaultPrimitiveValue: function (schema) {
      if (schema) {
        var value = schema['default'];
        if (value !== undefined) {
          return value;
        }
        switch (schema.type) {
        case 'string':
          return '';
        case 'integer':
        case 'number':
          return 0;
        case 'boolean':
          return false;
        case 'array':
          return [];
        case 'null':
          return null;
        }
      }
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching the widget is supported.');
      }
      options = _.extend({}, this.options, options);
      _.defaults(options, {
        includeView: this.options.includeView,
        includeManifest: this.options.includeManifest,
        includeServerModule: this.options.includeServerModule,
        includeToolItems: this.options.includeToolItems
      });
      if (options.includeToolItems) {
        options.includeManifest = true;
      }
      var serverModulesPromise = this._resolveServerModules(options),
          toolItemsPromise     = this._resolveToolItems(options),
          toolItemMasksPromise = this._resolveToolItemMasks(options),
          self                 = this;
      return $.when(serverModulesPromise, toolItemsPromise, toolItemMasksPromise)
          .then(_.bind(this._resolveWidget, this, options))
          .then(function () {
            var response = self.toJSON();
            options.success && options.success(response, options);
            self.trigger('sync', self, response, options);
          }, function () {
            var error = self.get('error');
            options.error && options.error(error, options);
            self.trigger('error', self, error, options);
            return $.Deferred().reject(error);
          });
    },

    _resolveWidget: function (options) {
      var viewPromise     = this._resolveView(options),
          manifestPromise = this._resolveManifest(options),
          self            = this;
      return $.when(viewPromise, manifestPromise)
          .then(function () {
            self._updateServerModule(options);
            self._updateActions(options);
          });
    },

    _resolveView: function (options) {
      var deferred = $.Deferred();
      if (options.includeView) {
        var self       = this,
            widgetData = this.getModuleData(),
            viewPath   = this.getViewModulePath(widgetData);
        require([viewPath],
            function (View) {
              self.set('view', View);
              deferred.resolve();
            }, function (error) {
              self.set('error', error);
              if (options.ignoreErrors) {
                deferred.resolve();
              } else {
                deferred.reject(error);
              }
            });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },

    _resolveManifest: function (options) {
      var deferred = $.Deferred();
      if (options.includeManifest) {
        var self         = this,
            widgetData   = this.getModuleData(),
            manifestPath = this.getManifestModulePath(widgetData);
        require([manifestPath],
            function (manifest) {
              if (self._needsLocalization(manifest)) {
                var manifestLocalizedPath = self.getLocalizedManifestModulePath(widgetData);
                require([manifestLocalizedPath],
                    function (manifestLocalized) {
                      manifest = WidgetModel.resolveLocalizedManifest(manifestPath,
                          manifest, manifestLocalized);
                      self.set('manifest', manifest);
                      deferred.resolve();
                    }, function (error) {
                      if (!self.has('error')) {
                        self.set('error', error);
                      }
                      if (options.ignoreErrors || options.ignoreManifestErrors) {
                        // If errors are ignored, return not localized manifest;
                        // if it were undefined, non-robust consumers might crash
                        self.set('manifest', manifest);
                        deferred.resolve();
                      } else {
                        deferred.reject(error);
                      }
                    });
              } else {
                self.set('manifest', manifest);
                deferred.resolve();
              }
            }, function (error) {
              if (!self.has('error')) {
                self.set('error', error);
              }
              if (options.ignoreErrors || options.ignoreManifestErrors) {
                // If errors are ignored, return an empty manifest;
                // if it were undefined, non-robust consumers might crash
                self.set('manifest', {});
                deferred.resolve();
              } else {
                deferred.reject(error);
              }
            });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },

    _resolveServerModules: function (options) {
      var serverModules;
      if (options.includeServerModule && !options.serverModules) {
        options.serverModules = serverModules = new ServerModuleCollection();
        return serverModules.fetch({ignoreErrors: options.ignoreErrors});
      }
      return $.Deferred().resolve().promise();
    },

    _resolveToolItems: function (options) {
      var toolItems;
      if (options.includeToolItems && !options.toolItems) {
        options.toolItems = toolItems = new ToolItemConfigCollection();
        return toolItems.fetch({ignoreErrors: options.ignoreErrors});
      }
      return $.Deferred().resolve().promise();
    },

    _resolveToolItemMasks: function (options) {
      var toolItemMasks;
      if (options.includeToolItems && !options.toolItemMasks) {
        options.toolItemMasks = toolItemMasks = new ToolItemMaskCollection();
        return toolItemMasks.fetch({ignoreErrors: options.ignoreErrors});
      }
      return $.Deferred().resolve().promise();
    },

    _getModulePrefix: function () {
      var name       = this.get('id'),
          firstSlash = name.indexOf('/');
      // Enable widget names without the module path for the core widgets;
      // compatibility for early perspectives, which did not use full paths
      return firstSlash < 0 ? 'csui' : name.substring(0, firstSlash);
    },

    getModuleData: function () {
      var name      = this.get('id'),
          lastSlash = name.lastIndexOf('/'),
          path;
      // Enable widget names without the module path for the core widgets;
      // compatibility for early perspectives, which did not use full paths
      if (lastSlash < 0) {
        path = 'csui/widgets/' + name;
      } else {
        path = name;
        name = name.substring(lastSlash + 1);
      }
      return {
        name: name,
        path: path
      };
    },

    getViewModulePath: function (moduleData) {
      return moduleData.path + '/' + moduleData.name + '.view';
    },

    getManifestModulePath: function (moduleData) {
      return 'json!' + moduleData.path + '/' + moduleData.name + '.manifest.json';
    },

    getLocalizedManifestModulePath: function (moduleData) {
      return 'i18n!' + moduleData.path + '/impl/nls/' + moduleData.name + '.manifest';
    },

    _updateServerModule: function (options) {
      if (options.includeServerModule) {
        var modulePrefix = this._getModulePrefix(),
            serverModule = options.serverModules.get(modulePrefix),
            attributes   = serverModule && serverModule.toJSON() ||
                {id: modulePrefix};
        this.serverModule.set(attributes);
      }
    },

    _updateActions: function (options) {
      if (options.includeToolItems) {
        var manifest = this.get('manifest'),
            actions  = manifest && manifest.actions;
        this.actions.reset(actions, {silent: true});
        this.actions.each(function (action) {
          action.toolItems = options.toolItems.get(action.get('toolItems'));
          action.toolItemMasks = options.toolItemMasks.get(action.get('toolItemMasks'));
          action.toolbars = new Backbone.Collection(action.get('toolbars'));
        });
        if (!options.silent) {
          this.actions.trigger('reset', this.actions, options);
        }
      }
    },

    _needsLocalization: function (object) {
      function isLocalizableString(value) {
        return typeof value === 'string' && value.indexOf('{{') === 0 &&
               value.lastIndexOf('}}') === value.length - 2;
      }

      var value;

      for (var key in object) {
        if (object.hasOwnProperty(key)) {
          value = object[key];
          if (isLocalizableString(value)) {
            return true;
          } else if (_.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
              if (isLocalizableString(value[i])) {
                return true;
              }
            }
          } else if (typeof value === 'object') {
            return this._needsLocalization(value);
          }
        }
      }
    }

  }, {
    resolveLocalizedManifest: function (manifestPath, manifest, localizedManifest) {
      function traverseManifest(object, localizedManifestParent) {
        var key, value, localizationKey, arrayItem, localizationArrayItem, i;

        function getLocalizationKey(value) {
          return _.isString(value) && value.indexOf('{{') === 0 &&
                 value.lastIndexOf('}}') === value.length - 2 &&
                 value.substring(2, value.length - 2);
        }

        for (key in object) {
          if (object.hasOwnProperty(key)) {
            value = object[key];
            localizationKey = getLocalizationKey(value);
            if (localizationKey) {
              // Support both real and dummy localization keys
              object[key] = localizedManifestParent[localizationKey] ||
                            localizedManifestParent[key] ||
                            // Show the localization string key in case
                            // the value is missing
                            value;
            } else if (_.isArray(value)) {
              localizationArrayItem = localizedManifestParent[key] || [];
              for (i = 0; i < value.length; ++i) {
                arrayItem = value[i];
                localizationKey = getLocalizationKey(arrayItem);
                if (localizationKey) {
                  // Support both array of dummy placeholders and flat
                  // localization by unique property names.
                  value[i] = localizationArrayItem[i] ||
                             // Support both real and dummy localization keys
                             localizedManifestParent[localizationKey] ||
                             localizedManifestParent[key] ||
                             // Show the localization string key in case
                             // the value is missing
                             arrayItem;
                } else if (_.isObject(arrayItem)) {
                  // Support both hierarchical and flat localization modules
                  value[i] = traverseManifest(arrayItem, localizationArrayItem[i] ||
                                                         localizedManifestParent);
                }
              }
            } else if (_.isObject(value)) {
              if (localizedManifestParent[key]) {
                log.warn(
                    'Hierarchical format has been detected in the localization ' +
                    'module "{0}". It has been deprecated and the support for it ' +
                    'will be removed. Please, change it to the flat format as soon ' +
                    'as possible. Although JSON format allows using nested objects, ' +
                    'automated translation tools can handle only key-value pairs. ' +
                    'That is why localization modules has to contain only one ' +
                    'object with properties pointing to strings.', manifestPath)
                && console.log(log.last);
              }
              // Support both hierarchical and flat localization modules
              object[key] = traverseManifest(value, localizedManifestParent[key] ||
                                                    localizedManifestParent);
            }
          }
        }
        return object;
      }

      return traverseManifest(manifest, localizedManifest);
    },
  });

  return WidgetModel;

});

csui.define('csui/models/widget/widget.collection',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/models/widget/widget.model',
  'csui/models/server.module/server.module.collection',
  'csui/models/tool.item.config/tool.item.config.collection',
  'csui/models/tool.item.mask/tool.item.mask.collection'
], function (require, module, _, $, Backbone, WidgetModel,
    ServerModuleCollection, ToolItemConfigCollection, ToolItemMaskCollection) {
  'use strict';

  var widgets = module.config().widgets || [];
  // Support either array of module IDs or a map with keys pointing
  // to arrays of module IDs; the latter can be used for decentralized
  // configuration (multiple calls to require.config, which merge maps,
  // but not arrays)
  if (!_.isArray(widgets)) {
    widgets = Array.prototype.concat.apply([], _.values(widgets));
  }
  // Convert the array of widget names to model attributes
  widgets = _.map(widgets, function (name) {
    return {
      id: name
    };
  });

  var WidgetCollection = Backbone.Collection.extend({

    model: WidgetModel,

    constructor: function WidgetCollection(models, options) {
      // Store the options before calling the parent constructor;
      // model processing in _prepareModel may access the options
      this.options = _.defaults({}, options, {
        includeView: true,
        includeManifest: true,
        includeServerModule: true,
        includeToolItems: true
      });
      if (this.options.includeToolItems) {
        this.options.includeManifest = true;
      }
      models || (models = widgets);
      WidgetCollection.__super__.constructor.call(this, models, options);
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching the widgets is supported.');
      }
      var self = this;
      options = _.extend({}, this.options, options);
      if (options.includeToolItems) {
        options.includeManifest = true;
      }
      var serverModulesPromise = this._resolveServerModules(options),
          toolItemsPromise     = this._resolveToolItems(options),
          toolItemMasksPromise = this._resolveToolItemMasks(options);
      return $.when(serverModulesPromise, toolItemsPromise, toolItemMasksPromise)
              .then(_.bind(this._resolveWidgets, this, options))
              .then(function () {
                var response = self.toJSON();
                options.success && options.success(response, options);
                self.trigger('sync', self, response, options);
              });
    },

    _prepareModel: function (attrs, options) {
      options || (options = {});
      _.defaults(options, {
        includeView: this.options.includeView,
        includeManifest: this.options.includeManifest,
        includeServerModule: this.options.includeServerModule,
        includeToolItems: this.options.includeToolItems
      });
      return WidgetCollection.__super__._prepareModel.call(this, attrs, options);
    },

    _resolveServerModules: function (options) {
      var serverModules = options.serverModules;
      if (serverModules || !options.includeServerModule) {
        return $.Deferred().resolve().promise();
      }
      serverModules = options.serverModules = new ServerModuleCollection();
      return serverModules.fetch({ignoreErrors: options.ignoreErrors !== false});
    },

    _resolveToolItems: function (options) {
      var toolItems = options.toolItems;
      if (toolItems || !options.includeToolItems) {
        return $.Deferred().resolve().promise();
      }
      toolItems = options.toolItems = new ToolItemConfigCollection();
      return toolItems.fetch({ignoreErrors: options.ignoreErrors !== false});
    },

    _resolveToolItemMasks: function (options) {
      var toolItemMasks = options.toolItemMasks;
      if (toolItemMasks || !options.includeToolItems) {
        return $.Deferred().resolve().promise();
      }
      toolItemMasks = options.toolItemMasks = new ToolItemMaskCollection();
      return toolItemMasks.fetch({ignoreErrors: options.ignoreErrors !== false});
    },

    _resolveWidgets: function (options) {
      var resolvableModels = this.filter(function (model) {
            // A resolvable widget must have an ID and it was already resolved
            // neither with a success nor with a failure
            return model.has('id') &&
                   !(model.has('view') || model.has('manifest') || model.has('error'));
          }),
          promises = _.invoke(resolvableModels, 'fetch', {
            ignoreErrors: options.ignoreErrors !== false,
            ignoreManifestErrors: options.ignoreManifestErrors !== false,
            includeView: options.includeView,
            includeManifest: options.includeManifest,
            includeServerModule: options.includeServerModule,
            includeToolItems: options.includeToolItems,
            serverModules: options.serverModules,
            toolItems: options.toolItems,
            toolItemMasks: options.toolItemMasks
          });
      return $.when.apply($, promises);
    }

  });

  return WidgetCollection;

});

csui.define('csui/models/zipanddownload/zipanddownload.preflight',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin'
], function (module, _, $, Backbone, Url, ConnectableMixin, UploadableMixin) {
  'use strict';

  var config = _.extend({
    idAttribute: null
  }, module.config());

  var PreFlightModel = Backbone.Model.extend({

    constructor: function PreFlightModel(attributes, options) {
      attributes || (attributes = {});
      options || (options = {});
      this.options = options;

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options.connector = options.collection && options.collection.connector ||
                               options.container && options.container.connector ||
                               options.nodes.models && options.nodes.models[0].connector;
      this.makeConnectable(options)
          .makeUploadable(options);
    },

    urlBase: function () {
      var queryString = "",
          url         = this.options.connector.getConnectionUrl().getApiBase('v2');
      url = Url.combine(url, 'zipanddownload');

      if (this.preflight) {
        // Create a new permission model by POST
        url = Url.combine(url, 'preflight', queryString);
      } else {
        url = Url.combine(url, queryString);
      }
      return url;
    },

    url: function () {
      var url   = this.urlBase(),
          query = null;
      return query ? url + '?' + query : url;
    },

    parse: function (response, options) {
      return response;
    }
  });
  ConnectableMixin.mixin(PreFlightModel.prototype);
  UploadableMixin.mixin(PreFlightModel.prototype);

  return PreFlightModel;
});

csui.define('csui/models/zipanddownload/zipanddownload.stages',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/connectable/connectable.mixin'
], function (_, $, Backbone, URL, ConnectableMixin) {
  'use strict';

  var StagesModel = Backbone.Model.extend({
    constructor: function StageModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options);
    },

    url: function () {
      var url = this.options.connector.getConnectionUrl().getApiBase('v2');
      return URL.combine(url, 'zipanddownload', this.get('id'));
    },

    parse: function (response) {
      this.updateLocation(response.results.data.jobs);
      return response.results.data.jobs;
    },

    updateLocation: function (jobs) {
      if (jobs.complete && jobs.unprocessed_items_list && jobs.unprocessed_items_list.length > 0) {
        _.each(jobs.unprocessed_items_list, function (model, value) {
          if (model.path) {
            var locations = model.path.split('\\');
            if (locations.length > 0 && locations[locations.length - 1] !== "") {
              model.parentLocation = locations[locations.length - 1];
            } else if (locations.length > 0) {
              model.parentLocation = locations[locations.length - 2];
            }
          }
        });
      }
    }
  });
  ConnectableMixin.mixin(StagesModel.prototype);
  return StagesModel;
});
/**
 * This utility will send the mime type information needed by SmartUI.
 * For example, if we upload any un-recognized file as part of document upload, default browser
 * file input returns blank for such files, in this case, let's list out those frequently
 * un-recognized file types. For example, drawing files, jar, war files etc.,
 */
csui.define('csui/utils/mime.types',[
  'csui/lib/underscore'
], function (_) {
  'use strict';

  function getMimeType(fileName) {
    if (!fileName || fileName.indexOf('.') === -1) {
      return '';
    }

    var mimeType = '',
        name     = fileName.split('.').pop();

    switch (name) {
    case 'dwg':
    case 'dxf':
    case 'svf':
      mimeType = 'drawing/dwg';
      break;
    case 'jar':
    case 'war':
      mimeType = 'application/x-zip';
      break;
    case 'XLS5':
    case 'xlb':
    case 'xlsx':
      mimeType = 'application/vnd.ms-excel';
      break;
    case 'pptx':  //chrome does not provide the 'type' information for office docs while drand drop from desktop.
    case 'ppt':
      mimeType = 'application/vnd.ms-powerpoint';
      break;
    case 'docx':
    case 'doc':
      mimeType = 'application/msword';
      break;
    case 'vob':
      mimeType = 'video/mpeg';
      break;
    case 'odf':
    case 'xsm':
      mimeType = 'application/vnd.oasis.opendocument.formula';
      break;
    }

    return mimeType;
  }

  return {
    getMimeType: getMimeType
  };

});

csui.define('csui/utils/classic.nodes/classic.nodes',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external Classic UI node rules
  'csui-ext!csui/utils/classic.nodes/classic.nodes'
], function (_, Backbone, Url, RulesMatchingMixin, rules) {
  'use strict';

  var ClassicNodeModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      url: null,
      urlQuery: null,
      force: false
    },

    constructor: function ClassicNodeModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(ClassicNodeModel.prototype);

  var ClassicNodeCollection = Backbone.Collection.extend({
    model: ClassicNodeModel,
    comparator: 'sequence',

    constructor: function ClassicNodeCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByNode: function (node, options) {
      var model = this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
      if (model) {
        return {
          url: this._getUrl(model, node, options),
          forced: model.get('forced')
        };
      }
    },

    isForced: function (node, options) {
      return this.some(function (item) {
        return item.get('forced') &&
               item.matchRules(node, item.attributes);
      });
    },

    isSupported: function (node, options) {
      return this.some(function (item) {
        return item.matchRules(node, item.attributes);
      });
    },

    getUrl: function (node, options) {
      var model = this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
      if (model) {
        return this._getUrl(model, node, options);
      }
    },

    _getUrl: function (model, node, options) {
      var url = model.get('url');
      if (url) {
        // Receive a complete URL
        if (typeof url === 'string') {
          url = this._replaceParameters(url, node.attributes);
        } else if (typeof url === 'function') {
          url = url(node);
        }
      } else {
        var urlQuery = model.get('urlQuery');
        if (urlQuery) {
          // Receive a URL query to be appended to the CGI URL
          if (typeof urlQuery === 'string') {
            urlQuery = this._replaceParameters(urlQuery, node.attributes);
          } else if (typeof urlQuery === 'function') {
            urlQuery = urlQuery(node);
          }
          var connector = options && options.connector || node.connector;
          if (connector) {
            url = new Url(connector.connection.url).getCgiScript();
          } else {
            url = '';
          }
          urlQuery = Url.combineQueryString(urlQuery);
          url = Url.appendQuery(url, urlQuery);
        }
      }
      return url;
    },

    _replaceParameters: function (expression, node) {
      var attributes = node.attributes,
          parameter = /{([^}]+)}/g,
          match, names, value, index;
      // Go over every parameter placeholder found
      while ((match = parameter.exec(expression))) {
        names = match[1].split('.');
        value = attributes;
        // Nested object property names are separated by dots
        _.find(names, function (name) {
          value = value[name];
          if (value == null) {
            value = '';
            return true;
          }
        });
        // Replace the placeholder with the value found
        index = match.index;
        expression = expression.substring(0, index) +
                     encodeURIComponent(value) +
                     expression.substring(index + match[0].length);
      }
      return expression;
    }
  });

  var classicNodes = new ClassicNodeCollection();

  if (rules) {
    classicNodes.add(_.flatten(rules, true));
  }

  return classicNodes;
});


csui.define('csui/utils/defaultactionitems',[
  'csui/lib/underscore', 'csui/models/actionitems',
  // Load and register external default action rules
  'csui-ext!csui/utils/defaultactionitems'
], function (_, ActionItemCollection, rules) {
  'use strict';

  var defaultActionItems = new ActionItemCollection();

  if (rules) {
    defaultActionItems.add(_.flatten(rules, true));
  }

  return defaultActionItems;
});

csui.define('csui/utils/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/impl/nls/root/lang',{

  // nodesprites - node types
  NodeTypeSearchQuery: 'Search',
  NodeTypeSearchForm: 'Search form',
  NodeTypeURL: 'Web address',
  // nodesprites - general formats
  NodeTypeAudio: 'Audio',
  NodeTypeCompressed: 'Compressed File',
  NodeTypeImage: 'Image',
  NodeTypeText: 'Text Document',
  NodeTypeHtml: 'Html Document',
  NodeTypeUnknown: 'Unknown',
  NodeTypeVideo: 'Video',
  // nodesprites - application formats
  NodeTypeDOC: 'Microsoft Word',
  NodeTypePDF: 'Portable Document Format',
  NodeTypePPT: 'Microsoft Powerpoint',
  NodeTypePresentation: 'Presentation',
  NodeTypeXLS: 'Microsoft Excel',
  NodeTypeSpreadsheet: 'Spreadsheet',
  NodeTypeFormula: 'Formula',
  NodeTypePublisher: 'Microsoft Publisher',
  NodeTypeVisio: 'Microsoft Visio',
  NodeTypeMPP: 'Microsoft Project',
  NodeTypeONE: 'Microsoft OneNote',
  NodeTypeSDD: 'Document template',
  NodeTypeDWG: 'Autocad Drawing',

  //templates - thumbnail
  Loading:"Loading...",
  NotAvailable:"Not available."

});



csui.define('csui/utils/nodesprites',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'i18n!csui/utils/impl/nls/lang',
  // Load and register external cell views
  'csui-ext!csui/utils/nodesprites'
], function (_, Backbone, RulesMatchingMixin, lang, extraIcons) {

  var NodeSpriteModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      className: null
    },

    constructor: function NodeSpriteModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(NodeSpriteModel.prototype);

  var NodeSpriteCollection = Backbone.Collection.extend({

    model: NodeSpriteModel,
    comparator: "sequence",

    constructor: function NodeSpriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findClass: function (compareType, key, val) {
      var nodeSprite = this.find(function (item) {
        var values = item.get(compareType);
        if (values === undefined) {
          return undefined;
        }
        if (_.isArray(values[key])) {
          var keyValues = values[key];
          for (var i = 0; i < keyValues.length; i++) {
            if (keyValues[i] === val) {
              return true;
            }
          }
        }

        return (values[key] === val);
      });
      return nodeSprite ? nodeSprite.get('className') : undefined;
    },

    findTypeByNode: function (node) {
      var typeName = node.get('type_name') || lang.NodeTypeUnknown;

      var nodeSprite = this.findByNode(node);
      if (nodeSprite) {
        var spriteName = _.result(nodeSprite.attributes, 'mimeType');
        if (spriteName) {
          typeName = spriteName;
        }
      }

      return typeName;
    },

    findClassByNode: function (node) {
      var nodeSprite = this.findByNode(node);
      return nodeSprite && _.result(nodeSprite.attributes, 'className') || '';
    },

    findByNode: function (node) {
      // FIXME: Show the original icon with a shortcut overlay, as soon as agreed
      // If the node is a shortcut and the original_id is expanded to contain
      // the node data, we can show the original icon with a small arrow overlay.
      //if (node.original && node.original.has('type')) {
      //  node = node.original;
      //}
      return this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
    }

  });

  // MS Office: http://filext.com/faq/office_mime_types.php
  // OpenOffice: https://www.openoffice.org/framework/documentation/mimetypes/mimetypes.html

  var nodeSprites = new NodeSpriteCollection([
    {
      // excel
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
          'application/vnd.ms-excel.sheet.macroEnabled.12',
          'application/vnd.ms-excel.template.macroEnabled.12',
          'application/vnd.ms-excel.addin.macroEnabled.12',
          'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_excel',
      iconName: 'csui_mime_excel',
      mimeType: lang.NodeTypeXLS,
      sequence: 50
    },
    {
      // visio
      equalsNoCase: {
        mime_type: [
          'application/visio',
          'application/x-visio',
          'application/vnd.visio',
          'application/visio.drawing',
          'application/vsd',
          'application/x-vsd',
          'image/x-vsd',
          'application/vnd.visio2013',
          'application/vnd.ms-visio.drawing',
          'application/vnd.ms-visio.viewer',
          'application/vnd.ms-visio.stencil',
          'application/vnd.ms-visio.template'
        ]
      },
      className: 'csui-icon mime_visio',
      iconName: 'csui_mime_visio',
      mimeType: lang.NodeTypeVisio,
      sequence: 50
    },
    {
      // spreadsheets
      equalsNoCase: {
        mime_type: [
          'application/vnd.oasis.opendocument.spreadsheet',
          'application/vnd.oasis.opendocument.spreadsheet-template',
          'application/vnd.sun.xml.calc',
          'application/vnd.sun.xml.calc.template',
          'application/vnd.stardivision.calc',
          'application/x-starcalc'
        ]
      },
      className: 'csui-icon mime_spreadsheet',
      iconName: 'csui_mime_spreadsheet',
      mimeType: lang.NodeTypeSpreadsheet,
      sequence: 50
    },
    {
      // powerpoint
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.openxmlformats-officedocument.presentationml.template',
          'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
          'application/vnd.ms-powerpoint.addin.macroEnabled.12',
          'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
          'application/vnd.ms-powerpoint.template.macroEnabled.12',
          'application/vnd.ms-powerpoint.slideshow.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_powerpoint',
      iconName: 'csui_mime_powerpoint',
      mimeType: lang.NodeTypePPT,
      sequence: 50
    },
    {
      // presentations
      equalsNoCase: {
        mime_type: [
          'application/vnd.google-apps.presentation', // GSLIDE - Google Drive Presentation
          'application/x-iwork-keynote-sffkey', // KEY, KEYNOTE — Apple Keynote Presentation
          'application/vnd.wolfram.mathematica', // NB — Mathematica Slideshow
          'application/vnd.wolfram.player', // NBP — Mathematica Player slideshow
          'application/vnd.oasis.opendocument.presentation', // ODP — OpenDocument Presentation
          'application/vnd.oasis.opendocument.presentation-template', // OTP - ODP Template
          'application/vnd.sun.xml.impress',
          'application/vnd.sun.xml.impress.template',
          'application/vnd.stardivision.impress',
          'application/vnd.stardivision.impress-packed',
          'application/x-starimpress',
          'application/vnd.lotus-freelance', // PRZ — Lotus Freelance Graphics
          'application/vnd.stardivision.impress', // SDD - Star Office's StarImpress
          'application/vnd.corel-presentations', // SHW — Corel Presentations slide show creation
          'application/vnd.sun.xml.impress', // SXI — OpenOffice.org XML (obsolete) Presentation
          'application/vnd.ms-officetheme', // THMX — Microsoft PowerPoint theme template
          'application/vnd.sun.xml.impress.template '// STI — OpenOffice Impress template

          // the following extensions could not mapped to a mime-type
          // todo: intro mapping to file extensions
          // WATCH — Dataton Watchout Presentation
          // PEZ — Prezi Desktop Presentation
          // SHF — ThinkFree Show
          // SHOW — Haansoft(Hancom) Presentation software document
          // SLP — Logix-4D Manager Show Control Project
          // SSPSS — SongShow Plus Slide Show

        ]
      },
      className: 'csui-icon mime_presentation',
      iconName: 'csui_mime_presentation',
      mimeType: lang.NodeTypePresentation,
      sequence: 50
    },
    {
      // MS Office publisher
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-publisher',
          'application/x-mspublisher'
        ]
      },
      className: 'csui-icon mime_publisher',
      iconName: 'csui_mime_publisher',
      mimeType: lang.NodeTypePublisher,
      sequence: 50
    },
    {
      // formulas
      equalsNoCase: {
        mime_type: [
          'application/vnd.oasis.opendocument.formula',
          'application/vnd.sun.xml.math',
          'application/vnd.stardivision.math',
          'application/x-starmath'
        ]
      },
      className: 'csui-icon mime_formula',
      iconName: 'csui_mime_formula',
      mimeType: lang.NodeTypeFormula,
      sequence: 50
    },
    {
      // pdf
      equalsNoCase: {
        mime_type: [
          'application/vnd.pdf',
          'application/x-pdf',
          'application/pdf'
        ]
      },
      className: 'csui-icon mime_pdf',
      iconName: 'csui_mime_pdf',
      mimeType: lang.NodeTypePDF,
      sequence: 50
    },
    {
      // word
      equalsNoCase: {
        mime_type: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
          'application/vnd.ms-word.document.macroEnabled.12',
          'application/vnd.ms-word.template.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_word',
      iconName: 'csui_mime_word',
      mimeType: lang.NodeTypeDOC,
      sequence: 50
    },
    {
      // dwg
      equalsNoCase: {
        mime_type: [
          'application/dwg',
          'drawing/dwg'
        ]
      },
      className: 'csui-icon mime_dwg',
      iconName: 'csui_mime_dwg',
      mimeType: lang.NodeTypeDWG,
      sequence: 50
    },
    {
      // MS OneNote
      equalsNoCase: {
        mime_type: [
          'application/onenote',
          'application/msonenote'
        ]
      },
      className: 'csui-icon mime_onenote',
      iconName: 'csui_mime_onenote',
      mimeType: lang.NodeTypeONE,
      sequence: 50
    },
    {
      // MS project
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-project',
          'application/msproj',
          'application/msproject',
          'application/x-msproject',
          'application/x-ms-project',
          'application/mpp'
        ]
      },
      className: 'csui-icon mime_project',
      iconName: 'csui_mime_project',
      mimeType: lang.NodeTypeMPP,
      sequence: 50
    },
    {
      // image
      startsWithNoCase: {mime_type: 'image/'},
      className: 'csui-icon mime_image',
      iconName: 'csui_mime_image',
      mimeType: lang.NodeTypeImage,
      sequence: 50
    },
    {
      // audio
      startsWithNoCase: {mime_type: 'audio/'},
      className: 'csui-icon mime_audio',
      iconName: 'csui_mime_audio',
      mimeType: lang.NodeTypeAudio,
      sequence: 50
    },
    {
      // text
      startsWithNoCase: {mime_type: 'text/'},
      className: 'csui-icon mime_paper',
      iconName: 'csui_mime_paper',
      mimeType: lang.NodeTypeText,
      sequence: 50
    },
    {
      // text
      equalsNoCase: {mime_type: 'text/html'},
      className: 'csui-icon mime_html',
      iconName: 'csui_mime_html',
      mimeType: lang.NodeTypeHtml,
      // startsWith 'text/' operation happens first, which would decide the icon otherwise;
      // it has the sequence number 50 in common
      // do not set sequence to 30 that would take over the 'type' that has this MIME type
      // and do not set to 50 because this object with this MIME type would have a different icon
      sequence: 40
    },
    {
      // video
      startsWithNoCase: {mime_type: 'video/'},
      className: 'csui-icon mime_video',
      iconName: 'csui_mime_video',
      mimeType: lang.NodeTypeVideo,
      sequence: 50
    },
    {
      // zip
      equalsNoCase: {
        mime_type: [
          'application/x-rar-compressed',
          'application/zip',
          'application/x-zip',
          'application/x-zip-compressed'
        ]
      },
      className: 'csui-icon mime_zip',
      iconName: 'csui_mime_zip',
      mimeType: lang.NodeTypeCompressed,
      sequence: 50
    },
    {
      // compound document
      equals: {type: 136},
      className: 'csui-icon compound_document',
      iconName: 'csui_mime_compound_document',
      withColorSchemaIconName: 'csui_colorschema_mime_compound_document',
      sequence: 100
    },
    {
      // compound document release
      equals: {type: 138},
      className: 'csui-icon csui-mime-compound-release',
      iconName: 'csui_mime_compound_release32',
      sequence: 100
    },
    {
      // compound document revision
      equals: {type: 139},
      className: 'csui-icon csui-mime-compound-revision',
      iconName: 'csui_mime_compound_revision32',
      sequence: 100
    },
    {
      // document
      equals: {type: 144},
      className: 'csui-icon mime_document',
      iconName: 'csui_mime_document',
      sequence: 100
    },
    {
      // CAD
      equals: {type: 736},
      className: 'csui-icon mime_drawing',
      iconName: 'csui_mime_drawing',
      sequence: 100
    },
    {
      // saved search query
      equals: {type: 258},
      className: 'csui-icon csui-icon-saved-search-query',
      iconName: 'csui_mime_saved_search',
      mimeType: lang.NodeTypeSearchQuery,
      sequence: 100
    },
    {
      // custom search form
      equals: {type: 292},
      className: 'csui-icon csui-icon-query-form-search',
      iconName: 'csui_mime_query_form_search',
      mimeType: lang.NodeTypeSearchForm,
      sequence: 100
    },
    {
      // URL link
      equals: {type: 140},
      className: 'csui-icon url1',
      iconName: 'csui_mime_url',
      mimeType: lang.NodeTypeURL,
      sequence: 100
    },
    {
      // shortcut
      equals: {type: 1},
      className: 'csui-icon shortcut1',
      iconName: 'csui_mime_shortcut',
      withColorSchemaIconName: 'csui_colorschema_mime_shortcut',
      sequence: 100
    },
    {
      // generation
      // note: since the RestAPI at the moment does not return the document version, showing the
      // latest document mime-type icon with the shortcut overlay is incorrect.  Use the
      // generation icon for now.  When the RestAPI and UI supports Generation, switch this to
      // generation-overlay.
      equals: {type: 2},
      className: 'csui-icon mime_generation',
      iconName: 'csui_mime_generation',
      sequence: 100
    },
    {
      // category
      equals: {type: 131},
      className: 'csui-icon category1',
      iconName: 'csui_mime_category',
      sequence: 100
    },
    {
      // project
      equals: {type: 202},
      className: 'csui-icon csui-icon-project',
      iconName: 'csui_mime_cs_project',
      withColorSchemaIconName: 'csui_colorschema_mime_cs_project',
      sequence: 100
    },
    {
      // collection
      equals: {type: 298},
      className: 'csui-icon collection',
      iconName: 'csui_mime_collection',
      withColorSchemaIconName: 'csui_colorschema_mime_collection',
      sequence: 100
    },
    {
      equals: {type: 141},
      className: 'csui-icon csui-icon-enterprise-volume',
      iconName: 'csui_mime_enterprise',
      sequence: 100
    },
    {
      equals: {type: 142},
      className: 'csui-icon csui-icon-personal-volume',
      iconName: 'csui_mime_enterprise',
      sequence: 100
    },
    {
      equals: {type: 133},
      className: 'csui-icon csui-icon-category-volume',
      iconName: 'csui_mime_category_volume',
      sequence: 100
    },
    {
      // Category Folder
      equals: {type: 132},
      className: 'csui-icon csui-icon-node-category-folder',
      iconName: 'csui_mime_category_volume',
      sequence: 100
    },
    {
      // LiveReport
      equals: {type: 299},
      className: 'csui-icon csui-icon-node-livereport',
      iconName: 'csui_mime_livereport',
      withColorSchemaIconName: 'csui_colorschema_mime_livereport',
      sequence: 100
    },
    {
      // Milestone
      equals: {type: 212},
      className: 'csui-icon csui-icon-node-milestone',
      iconName: 'csui_mime_milestone',
      sequence: 100
    },
    {
      // Poll
      equals: {type: 218},
      className: 'csui-icon csui-icon-node-poll',
      iconName: 'csui_mime_poll',
      sequence: 100
    },
    {
      // Prospector
      equals: {type: 384},
      className: 'csui-icon csui-icon-node-prospector',
      iconName: 'csui_mime_prospector',
      sequence: 100
    },
    {
      // Task
      equals: {type: 206},
      className: 'csui-icon csui-icon-node-task',
      iconName: 'csui_mime_task',
      sequence: 100
    },
    {
      // Task Group
      equals: {type: 205},
      className: 'csui-icon csui-icon-node-task-group',
      iconName: 'csui_mime_task_group',
      sequence: 100
    },
    {
      // Task List
      equals: {type: 204},
      className: 'csui-icon csui-icon-node-task-list',
      iconName: 'csui_mime_task_list',
      withColorSchemaIconName: 'csui_colorschema_mime_task_list',
      sequence: 100
    },
    {
      // Perspective
      equals: {type: 957 },
      className: 'csui-icon csui-icon-perspective',
      iconName: 'csui_mime_perspective',
      sequence: 100
    },
    {
      // Rule
      equals: {type: 958 },
      className: 'csui-icon csui-icon-rule',
      iconName: 'csui_mime_rule',
      sequence: 100
    },
    {
      // Perspective Assets Folder
      equals: {type: 955},
      className: 'csui-icon csui-icon-perspective-assets-folder',
      iconName: 'csui_mime_perspective_assets_folder',
      sequence: 100
    },
    {
      // Perspective Assets Volume
      equals: {type: 954},
      className: 'csui-icon csui-icon-perspective-assets-volume',
      iconName: 'csui_mime_perspective_assets_volume',
      sequence: 100
    },
    {
      // Virtual Folder
      equals: {type: 899},
      className: 'csui-icon csui-icon-node-virtual-folder',
      iconName: 'csui_mime_virtual_folder',
      withColorSchemaIconName: 'csui_colorschema_mime_virtual_folder',
      sequence: 100
    },
    {
      // Custom View
      equals: {type: 146},
      className: 'csui-icon mime_custom_view',
      iconName: 'csui_mime_custom_view',
      // Custom View has a MIME type, which would decide the icon otherwise;
      // the MIME type icons have the sequence number 50 in common
      sequence: 30
    },
    {
      // Workflow Step
      equals: {type: 153},
      className: 'csui-icon assignment-workflow',
      iconName: 'csui_mime_assignment_workflow',
      sequence: 100
    },
    {
      // Workflow Map
      equals: {type: 128},
      className: 'csui-icon mime_workflow_map',
      iconName: 'csui_mime_workflow_map',
      withColorSchemaIconName: 'csui_colorschema_mime_workflow_map',
      sequence: 100
    },
    {
      // Workflow Status
      equals: {type: 190},
      className: 'csui-icon mime_workflow_status',
      iconName: 'csui_mime_workflow_status',
      withColorSchemaIconName: 'csui_colorschema_mime_workflow_status',
      sequence: 100
    },
    {
      // Channel
      equals: {type: 207},
      className: 'csui-icon mime_channel',
      iconName: 'csui_mime_channel',
      withColorSchemaIconName: 'csui_colorschema_mime_channel',
      sequence: 100
    },
    {
      // News item
      equals: {type: 208},
      className: 'csui-icon mime_news',
      iconName: 'csui_mime_news_item',
      sequence: 100
    },
    {
      // Discussion
      equals: {type: 215},
      className: 'csui-icon mime_discussion',
      iconName: 'csui_mime_conversation',
      sequence: 100
    },
    {
      // XML DTD
      equals: {type: 335},
      className: 'csui-icon mime_xml_dtd',
      iconName: 'csui_mime_xml',
      withColorSchemaIconName: 'csui_colorschema_mime_xml',
      // XML DTD has a MIME type, which would decide the icon otherwise;
      // the MIME type icons have the sequence number 50 in common
      sequence: 30
    },
    {
      // form
      equals: {type: 223},
      className: 'csui-icon mime_form',
      iconName: 'csui_mime_form',
      withColorSchemaIconName: 'csui_colorschema_mime_form',
      sequence: 100
    },
    {
      // form template
      equals: {type: 230},
      className: 'csui-icon mime_form_template',
      iconName: 'csui_mime_layout_template',
      withColorSchemaIconName: 'csui_colorschema_mime_layout_template',
      sequence: 100
    },
    {
      // pulse comments
      equals: {type: 1281},
      className: 'csui-icon icon-pulse-comment',
      iconName: 'csui_mime_pulse_comment',
      sequence: 100
    },
    {
      // wiki pages
      equals: {type: 5574},
      className: 'csui-icon mime_wiki_page',
      iconName: 'csui_mime_wiki_page',
      sequence: 10
    },
    // wikis
    {
      equals: {type: 5573},
      className: 'csui-icon mime_wiki',
      iconName: 'csui_mime_wiki',
      withColorSchemaIconName: 'csui_colorschema_mime_wiki',
      sequence: 10
    },


    {
      // default container
      equals: {container: 'nonselectable'},
      className: 'csui-icon mime_folder_nonselectable',
      iconName: 'csui_mime_folder_nonselectable32',
      sequence: 1000
    },
    {
      // default container; covers folder-like nodes too
      equals: {container: true},
      className: 'csui-icon mime_folder',
      iconName: 'csui_mime_folder',
      withColorSchemaIconName: 'csui_colorschema_mime_folder',
      sequence: 1000
    },
    {
      // facets volume
      equals: {type: 901},
      className: 'csui-icon mime_facets_volume',
      iconName: 'csui_mime_facets_volume',
      sequence: 100
    },
    {
      // custom column
      equals: {type: 902},
      className: 'csui-icon csui-icon-custom-column',
      iconName: 'csui_mime_custom_column',
      sequence: 100
    },
    {
      // facets tree
      equals: {type: 903},
      className: 'csui-icon mime_facets_tree',
      iconName: 'csui_mime_facets_tree',
      sequence: 100
    },
    {
      // facets
      equals: {type: 904},
      className: 'csui-icon mime_facets',
      iconName: 'csui_mime_facets',
      sequence: 100
    },
    {
      // default node
      className: 'csui-icon mime_document',
      iconName: 'csui_mime_document',
      sequence: 10000
    },
    {
      // SDD document
      startsWithNoCase: {mime_type: 'application/sdd'},
      className: 'csui-icon mime_application',
      iconName: 'csui_mime_application',
      mimeType: lang.NodeTypeSDD,
      sequence: 50
    }
  ]);

  if (extraIcons) {
    nodeSprites.add(_.flatten(extraIcons, true));
  }

  return nodeSprites;

});


csui.define('csui/utils/node.info.sprites',[
  'csui/lib/underscore', 'csui/lib/backbone',
  // Load and register external node information sprites
  'csui-ext!csui/utils/node.info.sprites'
], function (_, Backbone, extraNodeInfoSprites) {

  var NodeSpriteModel = Backbone.Model.extend({

    defaults: {
      sequence: 100
    },

    constructor: function NodeSpriteModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var NodeSpriteCollection = Backbone.Collection.extend({

    model: NodeSpriteModel,
    comparator: "sequence",

    constructor: function NodeSpriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var nodeSprites = new NodeSpriteCollection();

  if (extraNodeInfoSprites) {
    nodeSprites.add(_.flatten(extraNodeInfoSprites, true));
  }

  return nodeSprites;

});


csui.define('csui/utils/smart.nodes/smart.nodes',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external Smart UI node rules
  'csui-ext!csui/utils/smart.nodes/smart.nodes'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var SmartNodeModel = Backbone.Model.extend({
    defaults: {
      sequence: 100
    },

    constructor: function SmartNodeModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(SmartNodeModel.prototype);

  var SmartNodeCollection = Backbone.Collection.extend({
    model: SmartNodeModel,
    comparator: "sequence",

    constructor: function SmartNodeCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    isSupported: function (node, options) {
      return this.some(function (item) {
        return item.matchRules(node, item.attributes);
      });
    }
  });

  var smartNodes = new SmartNodeCollection();

  if (rules) {
    smartNodes.add(_.flatten(rules, true));
  }

  return smartNodes;
});

csui.define('csui/utils/user.session/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });
  
csui.define('csui/utils/user.session/impl/nls/root/lang',{

  errorTerminateSession: 'Terminating the session failed.',    
  errorContinueSession: 'Continuing the session failed.',

  errorHttpPrefix: 'HTTP'

});


csui.define('csui/utils/user.session/user.session',[
  'module',
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/base',
  'i18n!csui/utils/user.session/impl/nls/lang'
  ], function (module, require, _, $, log, Url, base, lang) {
    'use strict';
    log = log(module.id);

    var singleton = function() {
      log.info("user.session: module.config is: " + JSON.stringify(module.config())) && console.log(log.last);
      var DEFAULT_KINDNESS_PERIOD = 30 * 1000;                // at least 30 sec kindness time needed for refresh-call with still valid ticket
      var DEFAULT_COOKIE_EXPIRATION_MODE = 1;                 // last request
      var DEFAULT_ENABLE_EXPIRATION_HANDLING = false;         // disabled
      var DEFAULT_SESSION_INACTIVITY_TIME = 30 * 60 * 1000;
      var DEFAULT_SESSION_REACTION_TIME = 3 * 60 * 1000;

      var config = _.extend({
            signInPageUrl: 'signin.html',       // only for development
            kindnessPeriod: DEFAULT_KINDNESS_PERIOD,
            cookieExpirationMode: DEFAULT_COOKIE_EXPIRATION_MODE,
            enableExpirationHandling: DEFAULT_ENABLE_EXPIRATION_HANDLING    
          }, module.config()),
          redirectEnabled = config.enableExpirationHandling == null ? DEFAULT_ENABLE_EXPIRATION_HANDLING : config.enableExpirationHandling,
          cookieExpirationMode = config.cookieExpirationMode == null ? DEFAULT_COOKIE_EXPIRATION_MODE : config.cookieExpirationMode,
          sessionInactivity = config.sessionInactivity == null ? DEFAULT_SESSION_INACTIVITY_TIME : config.sessionInactivity,
          sessionReactionTime = config.sessionReactionTime == null ? DEFAULT_SESSION_REACTION_TIME : config.sessionReactionTime,
          kindnessPeriod = config.kindnessPeriod == null ? DEFAULT_KINDNESS_PERIOD : config.kindnessPeriod,

          // CS provides 3 modes: 
          //     0 = never expires (no additional params available)
          //     1 = expire after last request
          //     2 = expire after last login
          isCookieExpirationEnabled   = (cookieExpirationMode > 0);

      // print the finally used config values
      var usedConfig = {
        enableExpirationHandling: redirectEnabled,
        cookieExpirationMode: cookieExpirationMode,          
        sessionInactivity: sessionInactivity,
        sessionReactionTime: sessionReactionTime,
        kindnessPeriod: kindnessPeriod
      };
      log.warn("user.session: used config: " + JSON.stringify(usedConfig)) && console.warn(log.last);


      var timerId;
      var expWarnDialog;
      var logoutInitiated = false;


      function getSessionReactionTime() {
        return sessionReactionTime;
      }

      function getSessionInactivity() {
        return sessionInactivity;
      }

      function isSessionExpirationEnabled() {
        return redirectEnabled;
      }

      function getCookieExpirationMode() {
        return cookieExpirationMode;
      }

      function currentDateUTC() {
        return (new Date()).toUTCString();
      }

      // returns the overall expiration time, used to correct wrong/missing values
      function _getOverallExpirationTime() {
        return getSessionInactivity() + getSessionReactionTime();
      }

      // Ensures that the 'expires' and 'serverDate' exists
      function _ensureExpiresTime(session) {
        if ( session ) {
          if (!session.expires || !session.serverDate) {
            var dat = new Date();
            session.serverDate = dat.toUTCString();
            session.expires = new Date(dat.getTime() + _getOverallExpirationTime()).toUTCString();          
            log.warn("user.session: _ensureExpiresTime: Adding 'serverDate' and 'expires' information to session (expires: " + session.expires + ").") && console.warn(log.last);
          } else if( new Date(session.expires).getTime() <= new Date(session.serverDate).getTime() ) {
            var dat2 = new Date();
            session.serverDate = dat2.toUTCString();
            session.expires = new Date(dat2.getTime() + _getOverallExpirationTime()).toUTCString();
            log.warn("user.session: _ensureExpiresTime: Provided 'serverDate' is newer or equal than 'expires' value, exceptionally replacing values (expires: " + session.expires + ").") && console.warn(log.last);
          }
        } else {
          log.error("user.session: _ensureExpiresTime: The provided argument 'session' is undefined!") && console.error(log.last);
        }
      }

      // Returns the expiration start time duration for the timer in seconds.
      // After the duration the ExpirationWarningDialog should be shown.
      function _calcExpirationStartTime(authenticator) {
        var session = authenticator.connection.session;
        var diffTime = 0;

        _ensureExpiresTime(session);

        if ( session && session.expires !== undefined && 
            (typeof session.expires === "string") && session.expires.length > 0 ) {

          var expireDate = new Date(session.expires);
          if (isNaN(expireDate.getTime())) { 
            expireDate = new Date(new Date().getTime() + _getOverallExpirationTime());
            log.info("user.session: _calcExpirationStartTime: Got unparseable date value for expires '" + session.expires + "', using fallback value '" + expireDate.toUTCString() + "'.") && console.log(log.last);
            session.expires = expireDate.toUTCString();
          }
          var expireTime = expireDate.getTime();
          expireTime -= kindnessPeriod;
          if (expireTime < 0) { expireTime = 0; }

          var currentDate = new Date(session.serverDate);
          if (isNaN(currentDate.getTime())) {
            currentDate = new Date();
            log.warn("user.session: _calcExpirationStartTime: Got unparseable date value for serverDate '" + session.serverDate + "', using fallback value '" + currentDate.toUTCString() + "'.") && console.warn(log.last);
            session.serverDate = currentDate.toUTCString();
          }
          var currentTime = currentDate.getTime();
          log.info("user.session: _calcExpirationStartTime: srvDate: " 
            + session.serverDate + ", expires: " + session.expires + " (Date: " + currentDateUTC() + ").") 
            && console.log(log.last);

          if ( currentTime >= expireTime ) {
            diffTime = 0;
          } else {
            diffTime = expireTime - currentTime;
          }
          diffTime /= 1000; // secs
        } else {
          log.error("user.session: _calcExpirationStartTime: The provided authenticator.connection.session has no expiration information.") && console.error(log.last);
          // if we want to allow this you can return e.g. 5 secs, within a REST-call with expiration information has to provide the start time
        }
        log.info("user.session: _calcExpirationStartTime: secs until expiration: " + diffTime) && console.log(log.last);
        return diffTime;
      }

      // helper if countdown of expiration warning dialog should be displayed
      function _shouldDisplayExpirationWarning() {
        if ( this.isSessionExpirationEnabled() === true && isCookieExpirationEnabled ) {
          // == 1 for only 'expire after last request'
          // > 0 for mode 1 and 2
          return ( this.getCookieExpirationMode() == 1 );
        } else {
          return false;
        }
      }

      // The authenticator.connection.session contains the 'ticket', 'serverDate' and 'expires' information.
      function updateSessionTicket(authenticator, request) {
        if (authenticator && authenticator.isAuthenticated()) {
          if (request && request.settings && request.settings.url) {
            var url = new Url(request.settings.url).getAbsolute().toLowerCase(),
                match = url.match(/^.*\/(api\/[^?]+)/);
            // Only REST API request handlers can supply a fresh ticket and
            // renew the expiration warning timeout. Custom handlers written
            // without the RESTAPIObject are not standardized and will not be
            // able to take part on the expiration warning feature.
            if (match) {
              var call = match[1];
              log.debug("user.session: updateSessionTicket: Resetting expiration timer based on call '" + call + "'.") && console.log(log.last);
              this.clearExpirationTimer();
              this._createExpirationTimer(authenticator);
            }
          } else {
            log.debug("user.session: updateSessionTicket: Resetting expiration timer based on unspecified call.") && console.log(log.last);
            this.clearExpirationTimer();
            this._createExpirationTimer(authenticator);
          }
        } else {
          log.warn("user.session: updateSessionTicket: Authenticator has to be 'authenticated' before updating session ticket!") && console.warn(log.last);
        }
      }
      
      function startExpirationTimer(authenticator) {
        if (authenticator && authenticator.isAuthenticated()) {
          log.debug("user.session: startExpirationTimer: Creating new expiration timer with provided authenticator...") && console.log(log.last);
          this.clearExpirationTimer();
          this._createExpirationTimer(authenticator);
        } else {
          console.warn("user.session: startExpirationTimer: Unable to start expiration timer, you have to provide an (still) authenticated 'authenticator'! Verify your parameter(s) for startExpirationTimer() function.");
        }
      }
      
      function clearExpirationTimer() {
        log.debug("user.session: clearExpirationTimer: called...") && console.log(log.last);
        if ( timerId ) {
          clearInterval(timerId);
          timerId = undefined;
        }
      }

      // doOnce is called inside this function just once, but with each invokation of this function
      // it can get called once.
      function _createExpirationTimer(authenticator) {
        var timer = _calcExpirationStartTime(authenticator);
        var self = this;
        var reactionTimeSecs = this.getSessionReactionTime()/1000;
        var doOnce = (function() {
          var executed = false;
          return function(curTimer) {
              if (!executed) {
                  executed = true;
          log.info("user.session: expirationTimer: current time for expiration warning count down: " + self.currentDateUTC()) && console.log(log.last);
                  self.displayExpirationWarning(authenticator, 
                    { startWithWarningContent: true, startTime: curTimer });
              }
          };
        })();

        timerId = setInterval(function () {
          if (--timer < reactionTimeSecs) {
            log.info("user.session: current expiration value: " + timer) && console.log(log.last);
            if ( timer >= 0 ) {
              // create dialog with separate timer, so upcoming REST-calls do not influence the timer;
              // an automatic logout is initiated as soon as the timer reached 0
              doOnce(timer);
            } else {
              self.clearExpirationTimer();
              log.info("user.session: expirationTimer: Switching to LoggedOut dialog content due to expired session...") && console.log(log.last);
              // trigger logout event on authenticator
              self.sendAuthenticatorEvent(authenticator);
              // show loggedOut content
              self.performSessionExpired(authenticator, false);
            }
          }
        }, 1000);
      }

      function stopExpirationWarningViewTimer(dialog) {
        if ( dialog ){
          log.debug("user.session: Sending event 'clear:timer' to dialog...") && console.log(log.last);
          dialog.triggerMethod('clear:timer', 'someValue');
        } else {
          log.debug("user.session: Skipping sending event 'clear:timer' to dialog, because dialog is already destroyed.") && console.log(log.last);
        }
      }

      function _showExpirationWarningDialog(authenticator, options) {
        var self = this;
        // we use here dynamical loading to allow the expiration warning dialog
        // to be in a different bundle than UserSession which gets required in authenticator
        csui.require([ 'csui/utils/expiration.warning/expiration.warning.dialog'
          ], function(ExpirationWarningDialog) {
            
            var dlgOptions = {
              userSession: self,
              authenticator: authenticator,
              startWithWarningContent: options.startWithWarningContent,
              startTime: options.startTime,
              clearExpirationTimer: function() {  // callback function to clear timer
                self.clearExpirationTimer();
              }
            };
            
            expWarnDialog = ExpirationWarningDialog.createExpirationWarningDialog(dlgOptions);

            ExpirationWarningDialog.showExpirationWarningDialog(expWarnDialog)          
            .always(function(result) {
              log.debug("user.session: _showExpirationWarningDialog: Expiration dialog was finished, setting internal dialog to undefined.") && console.log(log.last);
              expWarnDialog = undefined;
            });        

        });
      }

      // In case the remaining time is already lower than the sessionReactionTime when loading
      // the page then this function is called with each REST-call.
      // => there should be only one expiration warning dialog.
      function displayExpirationWarning(authenticator, options) {
        if ( expWarnDialog === undefined && this.isSessionExpirationEnabled() === true) {     // we want just one dialog
          if (options && options.startWithWarningContent === true) {
            if ( this._shouldDisplayExpirationWarning() ) {
              return this._showExpirationWarningDialog(authenticator, options);    
            }
          } else {
            // just loggedOut content for 2 (= after login) without countdown
            if ( isCookieExpirationEnabled ) {
              options = options || {};
              options.startWithWarningContent = false;
              return this._showExpirationWarningDialog(authenticator, options);
            }
          }        
        }
      }

      function redirectToTargetPage(authenticator) {
        log.debug("user.session: redirectToTargetPage: Called ...") && console.log(log.last);
        // At this point of time the session in authenticator is normally invalid or cleared.
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
        var targetUrl = Url.appendQuery(cgiUrl, 'func=csui.redirecttotarget');

        // redirect to target
        location.href = targetUrl;
      }

      function performSessionExpired(authenticator, doRedirect) {
        var self = this;
        if (this.isSessionExpirationEnabled() === true) {
          if (!logoutInitiated) {
            logoutInitiated = true;
            log.debug("user.session: performSessionExpired: Initiating automatic logout ...") && console.log(log.last);
            // initiate automatic logout
            this.clearExpirationTimer();

            if (doRedirect === true) {
              // redirect without logout    
              log.info("user.session: performSessionExpired: Session expired, performing requested redirect (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.redirectToTargetPage(authenticator);
            } else {
              // perform signOut
              log.info("user.session: performSessionExpired: Session expired, performing signOut (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.signOut(authenticator, { onErrorRedirect: true, isSessionExpired: true })
              .done(function() {
                logoutInitiated = false;
                log.debug("user.session: performSessionExpired: Automatic logout requests successfully sent.") && console.log(log.last);
              })
              .fail(function() {
                logoutInitiated = false;
                log.info("user.session: performSessionExpired: Sending automatic logout requests returned error.") && console.log(log.last);
              })
              .always(function() {
                log.info("user.session: performSessionExpired: Sending automatic logout requests finished, spawning redirect timer.") && console.log(log.last);
                // the timer based on kindnessPeriod may last longer than the session is valid, 
                // but redirectToTargetPage() supports this
                var timerRedirectId = setTimeout(function () {
                  logoutInitiated = false;
                  if ( timerRedirectId ) {
                    clearTimeout(timerRedirectId);
                    timerRedirectId = undefined;
                  }
                  log.info("user.session: performSessionExpired: Redirecting to target page...'") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                }, kindnessPeriod);
              });
            }

            // keep dialog on page to hide content
          } else {
            log.debug("user.session: performSessionExpired: A logout is already executed.") && console.log(log.last);
          }
        } else {
          log.debug("user.session: performSessionExpired: Skipping automatic logout due to disabled expiration handling.") && console.log(log.last);
          this.clearExpirationTimer();
        }
      }

      function continueSession(authenticator) {
        var self = this;
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

        // performs 'GET auth' call
        var authUrl = Url.combine(cgiUrl, 'api/v1/auth');
        authenticator.makeAjaxCall({
          url: authUrl,
          headers: { 
              OTCSTicket: authenticator.connection.session.ticket
            },
          success: function (response, textStatus, request) {
              log.debug('Receiving request response from {0}.', authUrl) && console.log(log.last);
              response = authenticator.parseResponse(response, request);
              // update session and call indirectly updateSessionTicket
              authenticator.updateAuthenticatedSession(response, request);
            }
        })
        .done(function() {
          // the modal alert dialog handles destroy itself when you press a button
          // self._dialogViewDestroy(dialog);
          self.startExpirationTimer(authenticator);
          log.info("expiration.warning.dialog: Processed continue session (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
        })
        .fail(function(req) {            
          self.sendAuthenticatorEvent(authenticator, 'failedTicketRefresh');          
          // the error parameter is the request and the error-messages are in base.MessageHelper
          var errMsg = lang.errorContinueSession;
          var errDetails = new base.RequestErrorMessage(req);
          var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
          log.error("expiration.warning.dialog: Processing continue session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
          csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
            ModalAlert
              .showError(errMsg + '\n' + errResponse)
              .always(function () {
                self.redirectToTargetPage(authenticator);
              });
          });             
        });      
      }

      function sendAuthenticatorEvent(authenticator, reasonStr) {
        if (authenticator) {
          authenticator.trigger(reasonStr || 'loggedOut', { sender: authenticator });
        }
      }

      // The cmdData can contain optional flags:
      //   unauthenticateReason - user specified unauthenticateReason reason
      //   onErrorRedirect - if true, on error directly a redirect is performed 
      //                     otherwise a modal-error is displayed
      //   isSessionExpired - flag, if signOut-reason is an expired session (e.g. automatic logout)
      function signOut(authenticator, cmdData) {
        var deferred = $.Deferred();
        var self = this;
        cmdData || (cmdData = {});

        if (authenticator && authenticator.isAuthenticated()) {
          var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

          csui.require(['csui/utils/routing',
                   'csui/utils/open.authenticated.page'
            ], function (routing, openAuthenticatedPage) {

            // Development HTML pages do not use the OTDS login page
            if (routing.routesWithSlashes()) {

              if (self.isSessionExpirationEnabled() === true) {

                if (authenticator && authenticator.makeAjaxCall && typeof authenticator.makeAjaxCall === 'function') {
                  // Invalidate the authenticated session, get the secure request token
                  // for the classic logout page and perform the logout by navigating there.
                  // Since csui.DoLogout is a ClassicUI call you have to provide a cookie.

                  // get secure request token
                  var tokenUrl = Url.combine(cgiUrl, 'api/v1/auth/logouttoken');
                  authenticator.makeAjaxCall({
                    url: tokenUrl,
                    headers: {
                      OTCSTicket: authenticator.connection.session.ticket
                    },
                    success: function (response, textStatus, request) {
                      log.debug('Receiving request response from {0}.', tokenUrl) && console.log(log.last);
                      response = authenticator.parseResponse(response, request);
                      // update session and call indirectly updateSessionTicket
                      authenticator.updateAuthenticatedSession(response, request);
                    }
                  }).then(function (response) {
                    // perform csui.DoLogout
                    var queryStr = 'func=csui.dologout&secureRequestToken=' + encodeURIComponent(response.token);
                    if (cmdData.isSessionExpired === true) {
                      // inform OTDS about expired session
                      queryStr += '&authcontext=sessionexpired';
                    }
                    var logoutFct = Url.appendQuery(cgiUrl, queryStr);
                    openAuthenticatedPage(authenticator.connection, logoutFct, {
                      openInNewTab: false
                    }).always(function() {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.debug("user.session: signOut: The logout request was sent to server (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                      deferred.resolve();
                    });
                  }, function(req) {
                    // the error parameter is the request and the error-messages are in base.MessageHelper
                    var errMsg = lang.errorTerminateSession;
                    var errDetails = new base.RequestErrorMessage(req);
                    var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
                    if (cmdData.onErrorRedirect === true) {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.info("user.session: signOut: Terminate session was not successful, redirecting ... (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      self.redirectToTargetPage(authenticator);
                    } else {
                      log.error("user.session: signOut: Terminate session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
                        ModalAlert
                          .showError(errMsg + '\n' + errResponse)
                          .always(function () {
                            authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                            // redirect without logout    
                            self.redirectToTargetPage(authenticator);
                          });                        
                      });
                    }
                    deferred.reject(req);     
                  });
                } else {
                  // we have no makeAjaxCall, so perform just redirect to target page
                  authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                  log.debug("user.session: signOut: makeAjaxCall is not available, so performing redirect to target page (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                  deferred.resolve();
                }

              } else {
                // no session expiration warning enabled
                // let the authenticators do their work, do not unauthenticate since it clears the session

                log.debug("user.session: signOut: Session expiration handling is disabled, skipping logout (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                deferred.resolve();
              }

            } else {
              
              // This is used on the development pages.
              // Invalidate the authenticated session and navigate to the login page.
              authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
              var signInPageUrl = config.signInPageUrl,
                  query = location.search;
              query += query ? '&' : '?';
              query += 'nextUrl=' + encodeURIComponent(location.pathname);
              var logoutUrl = signInPageUrl + query + location.hash;
              log.debug("user.session: signOut: Performed unauthenticate with redirect to development signIn page.") && console.log(log.last);
              location.href = logoutUrl;

              deferred.resolve();
            }
          });   // require

        } else {
          // not authenticated
          log.info("user.session: signOut: Authenticator is not 'authenticated' anymore, just returning success.") && console.log(log.last);
          deferred.resolve();
        }

        return deferred.promise();
      }    



      return {
        // this can be used by everyone and specifies the authentication expiration
        // configuration
        getSessionReactionTime: getSessionReactionTime,
        getSessionInactivity: getSessionInactivity,
        isSessionExpirationEnabled: isSessionExpirationEnabled,
        getCookieExpirationMode: getCookieExpirationMode,
        currentDateUTC: currentDateUTC,

        // these are helpers which can be used
        signOut: signOut,
        continueSession: continueSession,
        redirectToTargetPage: redirectToTargetPage,

        // these internal functions are needed by the dialog and views,
        // you should avoid to call these functions directly
        updateSessionTicket: updateSessionTicket,
        startExpirationTimer: startExpirationTimer,
        displayExpirationWarning: displayExpirationWarning,
        performSessionExpired: performSessionExpired,      
        clearExpirationTimer: clearExpirationTimer,
        stopExpirationWarningViewTimer: stopExpirationWarningViewTimer,      
        sendAuthenticatorEvent: sendAuthenticatorEvent,    

        // private functions
        _createExpirationTimer: _createExpirationTimer,
        _shouldDisplayExpirationWarning: _shouldDisplayExpirationWarning,
        _showExpirationWarningDialog: _showExpirationWarningDialog
      };
    };

    return singleton();

  });
  
csui.define('csui/utils/authenticators/interactive.credentials.authenticator',[
  'require', 'module', 'csui/lib/underscore',
  'csui/utils/authenticators/request.authenticator'
], function (require, module, _, RequestAuthenticator) {
  'use strict';

  // Warns, that the developer did not specify any authentication ticket
  // or other header.  There is no interactive authentication in CS UI
  // Widgets.  Integrators have to authenticate, preferably by SSO.
  var InteractiveCredentialsAuthenticator = RequestAuthenticator.extend({
    interactive: function() {
      return true;
    },

    constructor: function InteractiveCredentialsAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
    },

    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }

      RequestAuthenticator.prototype.authenticate.call(this, options,
          succeeded, _.bind(this.openSignInDialog, this, succeeded));
    },

    openSignInDialog: function (succeeded) {
      if (this.reauthenticating) {
        return;
      }
      var self = this;
      self.reauthenticating = true;
      csui.require([
        'csui/utils/impl/signin.dialog/signin.dialog', 'csui/controls/progressblocker/blocker'
      ], function (SignInDialog, BlockingView) {
        var dialog = new SignInDialog({
          connection: self.connection
        });
        BlockingView.suppressAll();
        dialog.show()
              .done(function (args) {
                self.connection.session = args.session;
                self.reauthenticating = false;
                BlockingView.resumeAll();
                succeeded(self.connection);
              });
      });
    }
  });

  return InteractiveCredentialsAuthenticator;
});


/* START_TEMPLATE */
csui.define('hbs!csui/utils/authenticators/impl/redirecting.form.authenticator',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"on":(depth0 != null ? lookupProperty(depth0,"on") : depth0),"states":"true","iconName":(depth0 != null ? lookupProperty(depth0,"iconName") : depth0)},"loc":{"start":{"line":4,"column":8},"end":{"line":4,"column":59}}})) != null ? stack1 : "")
    + "        \r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"icon circular "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconRight") || (depth0 != null ? lookupProperty(depth0,"iconRight") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconRight","hash":{},"loc":{"start":{"line":6,"column":34},"end":{"line":6,"column":47}}}) : helper)))
    + "\"></div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<button class=\"csui-signin-close csui-with-iframe\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseButtonTooltip") || (depth0 != null ? lookupProperty(depth0,"dialogCloseButtonTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseButtonTooltip","hash":{},"loc":{"start":{"line":1,"column":58},"end":{"line":1,"column":86}}}) : helper)))
    + "\"\r\n    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseAria") || (depth0 != null ? lookupProperty(depth0,"dialogCloseAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseAria","hash":{},"loc":{"start":{"line":2,"column":16},"end":{"line":2,"column":35}}}) : helper)))
    + "\">    \r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"iconName") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":3,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "</button>\r\n";
}});
Handlebars.registerPartial('csui_utils_authenticators_impl_redirecting.form.authenticator', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/utils/authenticators/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/authenticators/impl/nls/root/lang',{

  dialogCloseButtonTooltip: 'Close',
  dialogCloseButtonAria: 'Close sign in dialog'

});



csui.define('css!csui/utils/authenticators/impl/redirecting.form.authenticator',[],function(){});
csui.define('csui/utils/authenticators/redirecting.form.authenticator',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/utils/log',
  'csui/utils/authenticators/request.authenticator',
  'csui/utils/user.session/user.session',
  'hbs!csui/utils/authenticators/impl/redirecting.form.authenticator',
  'i18n!csui/utils/authenticators/impl/nls/lang',
  'css!csui/utils/authenticators/impl/redirecting.form.authenticator'
], function (require, module, _, Backbone, $, log, RequestAuthenticator, 
             UserSession, CloseButton, lang) {
  'use strict';
  log = log(module.id);

  var config                      = module.config(),
      authenticationIFrameTimeout = config.authenticationIFrameTimeout || 3000,
      showCloseButtonOnError      = config.showCloseButtonOnError;

  // Warns, that the developer did not specify any authentication ticket
  // or other header.  There is no interactive authentication in CS UI
  // Widgets.  Integrators have to authenticate, preferably by SSO.
  var RedirectingFormAuthenticator = RequestAuthenticator.extend({
    interactive: function() {      
      return false;      
    },

    constructor: function RedirectingFormAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
    },

    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }
      RequestAuthenticator.prototype.authenticate.call(this, options,
          succeeded, _.bind(this.initiateLoginSequence, this, succeeded, failed));
    },

    
    updateAuthenticatedSession: function (response, request) {
      // call the parent implementation
      RequestAuthenticator.prototype.updateAuthenticatedSession.call(this, response, request);

      if (this.connection.session && this.connection.session.ticket) {        
        // inform user session about updated ticket; in rare cases UserSession can be undefined 
        // if something went wrong in UserSession
        if ( UserSession ) {
          UserSession.updateSessionTicket(this, (request ? request : response));
        } else {
          log.info("redirecting.form.authenticator: updateAuthenticatedSession: UserSession is undefined, unable to updateSessionTicket in UserSession.") && console.log(log.last);
        }
      } else {
        log.error("redirecting.form.authenticator: updateAuthenticatedSession: Cannot get 'ticket' from just updated session, invalid request!") && console.error(log.last);
      }

    },

    unauthenticate: function (options) {
      var authen = this.isAuthenticated();
      if (authen && options && options.reason 
        && (options.reason === 'logged-out' || options.reason === 'expired') ) {
          if (UserSession && UserSession.isSessionExpirationEnabled() === true) {
            // Avoid popup of expiration warning dialog e.g. during ticket refresh.
            // Clear expiration timer.
            log.debug("redirecting.form.authenticator: unauthenticate: clearing expiration timer based on logged-out or expired.") && console.log(log.last);
            UserSession.clearExpirationTimer();
          }
      }
      // the parent clears the session and sends 'loggedOut'
      return RequestAuthenticator.prototype.unauthenticate.apply(this, arguments);
    },


    initiateLoginSequence: function (succeeded, failed) {
      // this method is trying to reauthenticate with OTDS in the background
      var self = this;
      var timer, dialog, urlOrigin;
      var skipFailedEvent = false;

      // the initiateLoginSequence is only called if the authenticate failed;
      if ( !isTruthy( self.getUserId() ) ) {
        showErrorMessage();
      } else {
        window.addEventListener('message', receiveMessage, false);
        createIFrame()
          .done(waitForLogin);
      }

      function showErrorMessage() {
        csui.require([
          'csui/controls/dialog/dialog.view',
          'csui/widgets/error.global/error.global.view'
        ], function (DialogView, ErrorGlobalView) {
          // wrong credentials is a programmer error and we must not translate this message
          var errorModel    = new Backbone.Model({
              message:  'The userId is undefined, the preceding authentication failed. Please initialize CSUI in a correct way.',
              hideNavigationButtons: true,
              showCloseButton: showCloseButtonOnError,
              errorCode: 401,
              showLogout: false
            }),
            errorGlobalView = new ErrorGlobalView({
              model: errorModel
            });

            var edialog = new DialogView({
              standardHeader: false,
              view: errorGlobalView,
              fullSize: true
            });
  
            edialog
              .on('destroy', handleDestroy)
              .on('childview:destroy', handleDestroy)
              .show();

            function handleDestroy() {
              reportFailedTicketRefresh();
              edialog.off('destroy', handleDestroy);
              edialog.off('childview:destroy', handleDestroy);
              // destroy the dialog and not just the view (but without receiving events again)
              edialog.destroy();
            }

          // get rid of rotating wheel
          suppressBlockingView();
        });
      }      

      function reportFailedTicketRefresh()  {
        if (skipFailedEvent === false && !self.isAuthenticated()) {
          log.warn("redirecting.form.authenticator: Sending 'failedTicketRefresh' event...") && console.log(log.last);
          self.trigger('failedTicketRefresh', { sender: self });
        }        
      }

      function createIFrame() {
        var deferred = $.Deferred();
        csui.require([
          'csui/lib/marionette', 
          'csui/controls/dialog/dialog.view',
          'csui/utils/url'          
        ], function (Marionette, DialogView, Url) {
          var src = Url.appendQuery(new Url(self.connection.url).getCgiScript(), 'func=csui.ticket');
          src = Url.appendQuery(src, 'userid=' + self.getUserId());
          urlOrigin = new Url(self.connection.url).getOrigin();

          var view = new Marionette.View({
            el: $('<iframe>', {
              width: '100%',
              height: '100%',
              src: src
            })
          });

          var ControlView = Marionette.ItemView.extend({

            ui: {
              closeButton: 'button.csui-signin-close'
            },

            templateHelpers: function () {
              return {
                dialogCloseButtonTooltip: lang.dialogCloseButtonTooltip,
                dialogCloseAria: lang.dialogCloseButtonAria,
                iconName: 'csui_action_close_white32',
                on: 'false'
              };
            },

            template: CloseButton,

            events: {
              'click @ui.closeButton': 'onButtonClick'
            },

            onButtonClick: function(event) {
              // use the matching implementation for destruction of the dialog from the parent
              dialog.onClickClose(event);
            }

          });

          dialog = new DialogView({
            className: 'csui-signin-close',
            standardHeader: false,
            view: view,
            fullSize: true,
            footerView: new ControlView()
          });
          view.render();

          //
          // Comment out code below because on a real server with SSO, it always fails.
          // The iframe load event is triggered 3 times:
          // - The first 2 times have undefined location. Thus, error is triggered.
          // - Only the third time has href pointing to the csui.ticket URL.
          //
          //view.el.addEventListener('load', function () {
          //  try {
          //    // If we cannot access the URL, the iframe was blocked by the content security policy.
          //    var href = !!this.contentWindow.location.href;
          //  } catch (error) {
          //    reportError(error);
          //  }
          //});
          dialog
            .on('destroy', function () {
              reportFailedTicketRefresh();
            })
            .show({render: false});

          dialog.$el.css({'z-index': '1061'});  // higher than popover
          dialog.$el.addClass('binf-hidden');
          deferred.resolve();
        }, deferred.reject);
        return deferred.promise();
      }

      function removeIFrame() {
        resumeBlockingView();
        // prevent failedTicketRefresh event from being triggered by destroy
        skipFailedEvent = true;
        dialog && dialog.destroy();
        skipFailedEvent = false;
      }

      function suppressBlockingView() {
        csui.require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.suppressAll();
            });
      }

      function resumeBlockingView() {
        csui.require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.resumeAll();
            });
      }

      function receiveMessage(event) {
        // the IFrame was created with urlOrigin, so check that we communicate only with our IFrame
        if (event.origin !== urlOrigin) {
          log.warn('redirecting.form.authenticator: event.origin and urlOrigin differ, aborting!') && console.warn(log.last);
          return;
        }
        if (event.data === 'csuiTicketLoaded') {
          log.info('redirecting.form.authenticator: Sending getOrigin back to child.') && console.log(log.last);
          event.source.postMessage('getOrigin', '*');
        } else {
          if (event.data.ticket) {
            log.debug('redirecting.form.authenticator: Redirecting Form Authenticator received new ticket.') && console.log(log.last);
            window.removeEventListener('message', receiveMessage, false);
            timer && clearTimeout(timer);
            timer = undefined;
            removeIFrame();
            var session = self.connection.session || (self.connection.session = {});
            session.ticket = event.data.ticket;
            session.expires = event.data.expires;
            session.serverDate = event.data.serverDate;
            succeeded && succeeded(self.connection);
            // if this ticket refresh will be used with expiration warning, inform here UserSession
            if (UserSession) {
              UserSession.updateSessionTicket(self);
            }
            // signal loggedIn (= ticket refreshed), like normal login-page does
            log.info("redirecting.form.authenticator: Sending 'loggedIn' event...") && console.log(log.last);
            self.trigger('loggedIn', {
              sender: self,
              connection: self.connection
            });            
          }
        }
      }

      function waitForLogin() {
        // If the server doesn't post a message after a few seconds, show the OTDS page.
        timer = setTimeout(enableInteactiveLogin, authenticationIFrameTimeout);
      }

      function enableInteactiveLogin() {
        // Show modal dialog containing the iFrame that shows the OTDS login page.
        if (dialog) {
          dialog.$el.removeClass('binf-hidden');
          suppressBlockingView();
        }
      }

      function reportError(error) {
        csui.require(['csui/dialogs/modal.alert/modal.alert'
        ], function (ModalAlert) {
          ModalAlert.showError(error.message);
        });
        failed(error, self.connection);
      }

      // avoid undefined, null, 0 and ''
      function isTruthy(n) {
        return !!n;
      }

    }
  });

  return RedirectingFormAuthenticator;
});

csui.define('csui/utils/authenticators/core.authenticators',[
  'module', 'csui/lib/underscore',
  'csui/utils/authenticators/ticket.authenticator',
  'csui/utils/authenticators/interactive.credentials.authenticator',
  'csui/utils/authenticators/redirecting.form.authenticator'
], function (module, _, TicketAuthenticator,
    InteractiveCredentialsAuthenticator, RedirectingFormAuthenticator) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
      .config['csui/utils/interactiveauthenticator'] || {},
      enableInteractiveAuthenticator = config.enabled,
      originalConfig = module.config();
  config = _.extend({
    // If there is no ticket, show a modal dialog with a login form and
    // allow the user to enter credentials and get a ticket.
    enableInteractiveAuthenticator: originalConfig.enableRedirectingFormAuthenticator === undefined &&
                                    enableInteractiveAuthenticator !== false,
    // If there is no ticket, try to get it using a request in a hidden
    // iframe. Using response redirection it either posts back a ticket
    // automatically, or it renders a login form and waits. The iframe
    // will be shown to the user, who will log in manually and let the
    // redirection to the pahe posting back tyhe ticket continue.
    enableRedirectingFormAuthenticator: false
  }, originalConfig);

  // If no custom authentication means are detected, authentication
  // will assume the native ticket. There are two authenticators, which
  // can be enabled to prompt for login, or fetch the ticket
  // automatically, is it is missing.
  var FallbackAuthenticator =
    config.enableInteractiveAuthenticator ?
      InteractiveCredentialsAuthenticator :
      config.enableRedirectingFormAuthenticator ?
        RedirectingFormAuthenticator :
        TicketAuthenticator;

  return [
    {
      sequence: 500,
      authenticator: FallbackAuthenticator
    }
  ];
});

csui.define('csui/models/compound.document/releases/server.adaptor.mixin',[
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
csui.define('csui/models/node.createform/server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var path = 'forms/nodes/create',
              params = {
                parent_id: this.docParentId ? this.docParentId : this.node.get("id"),
                type: this.type
              },
              resource = path + '?' + $.param(params);
          return Url.combine(this.node.connector.connection.url, resource);
        },

        parse: function (response) {
          var forms = response.forms;

          // TODO this should be sent by server, remove when possible
          _.each(forms, function (form) {
            form.id = form.schema.title;
          });
          forms && forms.length && (forms[0].id = "general");

          return forms;
        }

      });
    }
  };


  return ServerAdaptorMixin;
});

csui.define('csui/models/server.info/server.adaptor.mixin',[
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
          var url = Url.combine(this.connector.getConnectionUrl().getApiBase('v1'), 'serverInfo');
          return url;
        },
        parse: function (response) {
          this._changing = false;
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});
csui.define('csui/models/permission/permission.precheck.server.adaptor',[
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
              this.get("id"), '/descendents/subtypes/exists');
          if (this.get("subType") !== undefined) {
            url = Url.appendQuery(url, 'sub_types=' + this.get("subType"));
          }
          if (this.get("include_sub_items")) {
            url = Url.appendQuery(url, 'include_sub_items=' + this.get("include_sub_items"));
          }
         return url;
        },

        parse: function (response, options) {
          return response;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});
csui.define('csui/models/appliedcategories/category.server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var id = this.id, url;
          if (id) {
            url = Url.combine(this.node.urlBase(), 'categories', id);
          } else {
            url = Url.combine(this.node.urlBase(), 'categories');
          }
          return url;
        },

        parse: function (response, options) {
          return this.sortInitially(response.data);
        },

        sortInitially: function (data) {
          //default initial sort (only on arrays) is based on `name`.
          return _.isArray(data) ? _.sortBy(data, function (ele) {return ele.name.toLowerCase()}) :
                 data;
        }
      });
    }
  };


  return ServerAdaptorMixin;
});

csui.define('csui/models/appliedcategories/category',['csui/lib/backbone',
'csui/models/mixins/expandable/expandable.mixin',
'csui/models/mixins/resource/resource.mixin',
'csui/models/mixins/uploadable/uploadable.mixin',
'csui/models/appliedcategories/category.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
  UploadableMixin, ServerAdaptorMixin) {
    'use strict';

  var CategoryModel = Backbone.Model.extend({

    idAttribute: null,
    
    constructor: function CategoryModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.node = options.node;
      this.id = options.id;

      this.makeResource(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ExpandableMixin.mixin(CategoryModel.prototype);
  UploadableMixin.mixin(CategoryModel.prototype);
  ResourceMixin.mixin(CategoryModel.prototype);
  ServerAdaptorMixin.mixin(CategoryModel.prototype);

  return CategoryModel;
});

csui.define('csui/models/appliedcategories/systemattributes.server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var id = this.id,
              url = this.connector.getConnectionUrl().getApiBase('v2');
          url = Url.combine(url, "nodes", id, 'systemattributes');
          return url;
        },

        parse: function (response, options) {
          return response;
        }
      });
    }
  };


  return ServerAdaptorMixin;
});

csui.define('csui/models/appliedcategories/systemattributes.model',['csui/lib/backbone',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/appliedcategories/systemattributes.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
    UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var SystemAttributesModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function SystemAttributesModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.node = options.node;
      this.id = options.id;

      this.makeResource(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ExpandableMixin.mixin(SystemAttributesModel.prototype);
  UploadableMixin.mixin(SystemAttributesModel.prototype);
  ResourceMixin.mixin(SystemAttributesModel.prototype);
  ServerAdaptorMixin.mixin(SystemAttributesModel.prototype);

  return SystemAttributesModel;
});

csui.define('csui/models/appliedcategories/category.validation.server.adaptor.mixin',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var url = this.connector.getConnectionUrl().getApiBase('v1');
          url = Url.combine(url, 'validation/nodes/categories/enforcement');
          return url;
        },

        parse: function (response, options) {
          return response;
        }
      });
    }
  };


  return ServerAdaptorMixin;
});

csui.define('csui/models/appliedcategories/category.validation.model',['csui/lib/backbone',
  'csui/models/mixins/expandable/expandable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/uploadable/uploadable.mixin',
  'csui/models/appliedcategories/category.validation.server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
    UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var CategoryValidationModel = Backbone.Model.extend({

    idAttribute: null,

    constructor: function CategoryValidationModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  ExpandableMixin.mixin(CategoryValidationModel.prototype);
  UploadableMixin.mixin(CategoryValidationModel.prototype);
  ResourceMixin.mixin(CategoryValidationModel.prototype);
  ServerAdaptorMixin.mixin(CategoryValidationModel.prototype);

  return CategoryValidationModel;
});

csui.define('csui/models/navigation.history',[
  'module','csui/lib/underscore', 'csui/lib/backbone', 'csui/models/view.state.model'
], function (module, _, Backbone, viewStateModel) {
  'use strict';


  var NavigationHistory = Backbone.History.extend({
    constructor: function NavigationHistory(options) {
      Backbone.History.prototype.constructor.apply(this, arguments);

      var config = _.extend({
        urlCanChange: true
      }, module.config());

      this.urlCanChange = config.urlCanChange;
    },

    is: 'CSUINavigationHistory',

    checkUrl: function(e) {
      if (this.urlCanChange) {
        Backbone.History.prototype.checkUrl.call(this, e);
      }
    },

    _updateHash: function (location, fragment, replace) {
      if (this.urlCanChange) {
        Backbone.History.prototype._updateHash.call(this, location, fragment, replace);
      }
    },

    matchRoot: function () {
      if (this.urlCanChange) {
        return Backbone.History.prototype.matchRoot.call(this);
      }
      return true;
    }

  });

  var history = new NavigationHistory();
  Backbone.history = history;
  return history;
});

csui.define('bundles/csui-models',[
  // Models
  'csui/models/audit/audit.collection',
  'csui/models/authenticated.user.node.permission',
  'csui/models/favorite2',
  'csui/models/favorite2group',
  'csui/models/favorite2groups',
  'csui/models/favorites2',
  'csui/models/favorite2column',
  'csui/models/favorite2columns',
  'csui/models/favorite.model',
  'csui/models/permission/nodepermission.model',
  'csui/models/permission/nodeuserpermissions',
  'csui/models/server.module/server.module.collection',
  'csui/models/specificnodemodel',
  'csui/models/version',
  'csui/models/view.state.model',
  'csui/models/perspective/personalization.model',
  'csui/models/perspective/personalize/delta.generator',
  'csui/models/perspective/personalize/delta.resolver',
  'csui/models/compound.document/reorganize/reorganize.collection',

  // Model mixins
  'csui/models/widget/widget.collection',
  'csui/models/widget/widget.model',
  'csui/models/zipanddownload/zipanddownload.preflight',
  'csui/models/zipanddownload/zipanddownload.stages',

  // TODO: Remove this private module, once
  // csui/models/widget/search.results/search.metadata/search.columns
  // stops their bad practice.
  'i18n!csui/models/impl/nls/lang',

  // Utilities
  'csui/utils/mime.types',
  'csui/utils/classic.nodes/classic.nodes',
  'csui/utils/defaultactionitems',
  'csui/utils/nodesprites',
  'csui/utils/node.info.sprites',
  'i18n!csui/utils/impl/nls/lang',
  'csui/utils/smart.nodes/smart.nodes',
  'csui/utils/perspective/perspective.util',
  'csui/utils/user.session/user.session',

  // Authenticators
  'csui/utils/authenticators/core.authenticators',
  'csui/utils/authenticators/interactive.credentials.authenticator',
  'csui/utils/authenticators/redirecting.form.authenticator',

  // Server Adaptors
  // TODO: Move them to the csui-server-adaptors bundle.
  'csui/models/compound.document/releases/server.adaptor.mixin',
  'csui/models/audit/server.adaptor.mixin',
  'csui/models/node.createform/server.adaptor.mixin',
  'csui/models/permission/server.adaptor.mixin',
  'csui/models/permission/permission.action.server.adaptor.mixin',
  'csui/models/server.info/server.adaptor.mixin',
  'csui/models/permission/permission.precheck.server.adaptor',
  'csui/models/appliedcategories/category',
  'csui/models/appliedcategories/category.server.adaptor.mixin',
  'csui/models/appliedcategories/systemattributes.model',
  'csui/models/appliedcategories/systemattributes.server.adaptor.mixin',
  'csui/models/appliedcategories/category.validation.server.adaptor.mixin',
  'csui/models/appliedcategories/category.validation.model',
  'csui/models/compound.document/reorganize/server.adaptor.mixin',

  'csui/models/navigation.history'
], {});

