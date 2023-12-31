/**
 * Created by stefang on 10.07.2019.
 */
// Fetches the list of related workspaces
csui.define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/nodes',
  'csui/models/browsable/browsable.mixin',
  'csui/models/mixins/node.resource/node.resource.mixin',
  'csui/models/mixins/expandable/expandable.mixin',
  'conws/utils/workspaces/impl/workspaces.collection.mixin'
], function (module, $, _, Backbone, Url,
    NodeCollection, BrowsableMixin, NodeResourceMixin, ExpandableMixin,
    WorkspacesCollectionMixin) {

  var config = module.config();

  function Searching(columns) {
    this.set(columns);
  }

  Searching.prototype.set = function set(columns) {
    this.sortedColumns = columns || {};
  };

  function Sorting(columns,orderby) {
    this.set(columns,orderby);
  }

  Sorting.prototype.set = function set(columns,orderby) {
    var links= {};
    var orderBy = orderby || "name asc";
    var sort_key = orderBy.replace(/( asc| desc)$/,"");
    var sort_order = orderBy.slice(sort_key.length+1);
    var sort_spec = sort_order ? sort_order + '_' + sort_key : sort_key;
    var sort_name = sort_key.charAt(0).toUpperCase() + sort_key.slice(1);
    if (columns) {
      columns.each(function(el){
        var el_key = el.get("column_key");
        var el_name = el.get("name");
        if (sort_key===el_key) {
          sort_name = el_name;
        } else if (el.get("sort")) {
          links["asc_"+el_key] = { name: el_name };
          links["desc_"+el_key] = { name: el_name };
        }
      });
    }

    if (!sort_order) {
      links[sort_key] = { name: sort_name };
    } else {
      links["asc_"+sort_key] = { name: sort_name };
      links["desc_"+sort_key] = { name: sort_name };
    }
    
    this.links = links;
    this.sort = [ sort_spec ];
  };

  var RelatedWorkspacesSearchResultCollection = NodeCollection.extend({

    constructor: function RelatedWorkspacesSearchResultCollection(models, options) {
      // Core filter values needed for rest api
      this.wherePart = ["where_workspace_type_ids", "where_rel_type"];
      NodeCollection.prototype.constructor.apply(this, arguments);
      this.options = _.pick(options,"query", "connector", "node", "search",
            "autofetch", "autoreset", "stateEnabled","workspace", "orderBy");
      this.workspace = options.workspace;

      // "DO" means "description only". for details see csui/widgets/search.result/search.results.view and related.
      this.selectedSettings = "DO";

      // just to fake searchFacets for search.results.view:
      this.searchFacets = new Backbone.Collection();
      this.searchFacets.filters = [];
      this.searchFacets.ensureFetched = function(options) {
        return $.Deferred().resolve(this, {}, options).promise();
      };
      this.searchFacets.getAvailableFacets = function() { return []; };
      this.searchFacets.clearFilter = function() {};

      this.makeBrowsable(options);
      this.makeNodeResource(options);
      this.makeExpandable(options);
      this.makeWorkspacesCollection(options);

      this.completeColumns = new this.columns.constructor(options.columns.toJSON(), { dataCollectionName: this.dataCollectionName });
      this.columns.reset(_.each(options.columns.toJSON(),function(el){delete el.sort;delete el.sort_key;}));
      this.searching = new Searching(this.columns);
      this.sorting = new Sorting(this.completeColumns,this.orderBy);

    }
  });

  BrowsableMixin.mixin(RelatedWorkspacesSearchResultCollection.prototype);
  NodeResourceMixin.mixin(RelatedWorkspacesSearchResultCollection.prototype);
  ExpandableMixin.mixin(RelatedWorkspacesSearchResultCollection.prototype);
  WorkspacesCollectionMixin.mixin(RelatedWorkspacesSearchResultCollection.prototype);

  var super_parse = RelatedWorkspacesSearchResultCollection.prototype.parse;

  _.extend(RelatedWorkspacesSearchResultCollection.prototype, {

    url: function () {
      var queryParams = this.options.query || {};

      // clean up query, including any old or unsupported filters.
      this._cleanupQuery(queryParams);

      // Paging
      queryParams = this.mergeUrlPaging(config, queryParams);

      // Sorting
      queryParams = this.mergeUrlSorting(queryParams);

      // Filtering
      this.filters = _.omit(this.options.search.attributes,"query_id","forcePerspectiveChange","dummy");
      queryParams = this.mergeUrlFiltering(queryParams);

      
      // The search.results.view sets node to node with undefined id.
      // But we need to keep the scope bound to our given workspace node.
      // So we use this.options.node instead this.node
      var workspaceNodeId = this.options.node.get('id');

      // URLs like /nodes/:id/relatedworkspaces
      //var url = this.node.urlBase() + '/relatedworkspaces';
      // Alternative for URLs like /businessworkspaces/:id
      var apiBase = new Url(this.getBaseUrl()).getApiBase('v2'),
          url = Url.combine(apiBase,'businessworkspaces', workspaceNodeId, 'relateditemspicklist');
      queryParams = _.omit(queryParams, function (value, key) {
        return value == null || value === '';
      });
      queryParams.global_metadata = undefined;
      return url + '?' + this.queryParamsToString(queryParams);
    },

    parse: function(response,options) {
      this.completeColumns.resetColumns(response, this.options);
      var definitions = (response.meta_data && response.meta_data[this.dataCollectionName]) || {};
      _.each(definitions,function(el){delete el.sort;delete el.sort_key;});
      var result = super_parse.apply(this,arguments);
      this.searching.set(this.columns);
      this.sorting.set(this.completeColumns,this.orderBy);
      if (result) {
        var rel_source = this.options.node.get('id');
        var rel_type = this.options.query && this.options.query.where_rel_type;
        result.forEach(function(el){
          el.data || (el.data = {});
          el.data.properties || (el.data.properties = {});
          // set source id of relation
          el.data.properties.rel_source = rel_source;
          // set relation type that will be used in addrelateditem command.
          el.data.properties.rel_type = rel_type;
          // set OTName, so results view does not think we are in a rename operation (CWS-5809)
          el.data.properties.OTName = el.data.properties.name;
        });
      }
      return result;
    },

    setPreviousOrder: function (attributes, fetch) {
      if (!_.isEqual(this.previousOrderBy,attributes)) {
        this.previousOrderBy = attributes;
        if (fetch !== false) {
          this.fetch({skipSort: false});
        }
        return true;
      }
    },

    getResourceScope: function () {
      return {
        query:_.deepClone(this.options.query),
        node: this.node
      };
    },

    setResourceScope: function (scope) {
      scope.query && (this.options.query = scope.query);
      scope.node && (this.node = scope.node);
    },

    isFetchable: function () {
      return this.options.node.isFetchable();
    }

  });

  return RelatedWorkspacesSearchResultCollection;

});
