csui.define(["module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone",
    "csui/lib/marionette", "csui/utils/log",
    'conws/utils/workspaces/impl/workspaceutil',
    'conws/utils/workspaces/workspacestable.view',
    'i18n!conws/widgets/myworkspaces/impl/nls/lang',
], function (module, $, _, Backbone,
             Marionette, log,
             workspaceUtil, WorkspacesTableView, lang) {

    var MyWorkspacesTableView = WorkspacesTableView.extend({

        constructor: function MyWorkspacesTableView(options) {
            WorkspacesTableView.prototype.constructor.apply(this, arguments);
        },

        onRender: function () {
            var collection = this.collection;

            // Set order if passed as configuration, otherwise use default
            if (!_.isUndefined(this.collection.options.myworkspaces.attributes.sortExpanded)) {
                collection.orderBy = this.collection.options.myworkspaces.attributes.sortExpanded;
            }else{
              collection.orderBy = workspaceUtil.orderByAsString(this.options.data.orderBy);
            }

            this.options.tableAria = "";
            if(!_.isUndefined(collection.options.attributes.title)) {
              this.options.tableAria = _.str.sformat(lang.expandTableAria, collection.options.attributes.title);
            }

            this.doRender(collection);
        },

        _getCollectionUrlQuery: function () {
            var query = {};

            // only fetch specific properties for table view
            query.fields = encodeURIComponent("properties{" + this.getColumnsToFetch() + "}");
            query.action = "properties-properties";

            // Fetch all workspaces
            query.expanded_view = "true";

            // Fetch users expanded to show proper name
            query.expand_users = "true";

            return query;
        }

    });

    return MyWorkspacesTableView;
});
