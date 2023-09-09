// The model for fetching the workspaces from the server
csui.define(['module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/models/nodes',
  'csui/models/browsable/browsable.mixin',
  'csui/models/mixins/resource/resource.mixin',
  'csui/models/mixins/expandable/expandable.mixin',
  'conws/utils/workspaces/impl/workspaces.collection.mixin'
], function (module, $, _, Backbone, Url,
    NodeCollection, BrowsableMixin, ResourceMixin, ExpandableMixin,
    WorkspacesCollectionMixin) {

  var config = module.config();

  var MyWorkspacesCollection = NodeCollection.extend({

      constructor: function MyWorkspacesCollection(models, options) {
        // Core filter values needed for rest api
        this.wherePart = ["where_workspace_type_id"];
        NodeCollection.prototype.constructor.apply(this, arguments);
        options || (options = {});
        this.options = options;

        this.makeBrowsable(options);
        this.makeResource(options);
        this.makeExpandable(options);
        this.makeWorkspacesCollection(options);
      }
  });

  BrowsableMixin.mixin(MyWorkspacesCollection.prototype);
  ResourceMixin.mixin(MyWorkspacesCollection.prototype);
  ExpandableMixin.mixin(MyWorkspacesCollection.prototype);
  WorkspacesCollectionMixin.mixin(MyWorkspacesCollection.prototype);

  _.extend(MyWorkspacesCollection.prototype, {

      url: function () {
          // Get query from options, e.g. workspace type already passed
          var queryParams = this.options.query || {};

          // Paging
          queryParams = this.mergeUrlPaging(config, queryParams);

          // Sorting, only sorting in case expanded_view is enabled
          if (queryParams.expanded_view === "true") {
            queryParams = this.mergeUrlSorting(queryParams);
          } else if (queryParams.sort) {
            delete queryParams.sort;
          }

          // Filtering
          queryParams = this.mergeUrlFiltering(queryParams);

          queryParams.global_metadata = undefined;
          var apiBase = new Url(this.getBaseUrl()).getApiBase('v2'),
              url = Url.combine(apiBase, 'businessworkspaces');
          // Add params to query
          return url + '?' + this.queryParamsToString(queryParams);
        }
      }
  );

  return MyWorkspacesCollection;

});