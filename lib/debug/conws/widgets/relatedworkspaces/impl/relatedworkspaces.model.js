// Fetches the list of related workspaces
csui.define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/nodes',
  'csui/models/browsable/browsable.mixin',
  'csui/models/mixins/node.resource/node.resource.mixin',
  'csui/models/mixins/expandable/expandable.mixin',
  'conws/utils/workspaces/impl/workspaces.collection.mixin',
  'csui/models/node/node.model'
], function (module, $, _, Backbone, Url,
    NodeCollection, BrowsableMixin, NodeResourceMixin, ExpandableMixin,
    WorkspacesCollectionMixin) {

  var config = module.config();

  var RelatedWorkspacesCollection = NodeCollection.extend({

    constructor: function RelatedWorkspacesCollection(models, options) {
      // Core filter values needed for rest api
      this.wherePart = ["where_workspace_type_id", "where_relationtype"];
      NodeCollection.prototype.constructor.apply(this, arguments);
      options || (options = {});
      this.options = options;

      this.makeBrowsable(options);
      this.makeNodeResource(options);
      this.makeExpandable(options);
      this.makeWorkspacesCollection(options);

    }
  });

  BrowsableMixin.mixin(RelatedWorkspacesCollection.prototype);
  NodeResourceMixin.mixin(RelatedWorkspacesCollection.prototype);
  ExpandableMixin.mixin(RelatedWorkspacesCollection.prototype);
  WorkspacesCollectionMixin.mixin(RelatedWorkspacesCollection.prototype);

  _.extend(RelatedWorkspacesCollection.prototype, {

    url: function () {
      var queryParams = this.options.query || {};

      // Paging
      queryParams = this.mergeUrlPaging(config, queryParams);

      // Sorting
      queryParams = this.mergeUrlSorting(queryParams);

      // Filtering
      queryParams = this.mergeUrlFiltering(queryParams);

      // URLs like /nodes/:id/relatedworkspaces
      //var url = this.node.urlBase() + '/relatedworkspaces';
      // Alternative for URLs like /businessworkspaces/:id
      var workspaceNodeId = this.node.get('id');
      var apiBase = new Url(this.getBaseUrl()).getApiBase('v2'),
          url = Url.combine(apiBase,'businessworkspaces', workspaceNodeId, 'relateditems');
      queryParams = _.omit(queryParams, function (value, key) {
        return value == null || value === '';
      });
      queryParams.global_metadata = undefined;
      return url + '?' + this.queryParamsToString(queryParams);
    }

  });

  return RelatedWorkspacesCollection;

});
