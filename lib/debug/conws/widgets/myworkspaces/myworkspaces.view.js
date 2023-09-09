// Shows a list of my workspaces of a specific type
csui.define(['csui/lib/marionette', 'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/jquery',
    'conws/widgets/myworkspaces/impl/myworkspaceslistitem.view',
    'conws/widgets/myworkspaces/impl/myworkspaces.model.factory',
    'conws/widgets/myworkspaces/impl/myworkspacestable.view',
    'i18n!conws/widgets/myworkspaces/impl/nls/lang',
	'csui/utils/base',
    'conws/utils/workspaces/impl/workspaceutil',
    'conws/utils/workspaces/workspaces.view'
], function (Marionette, module, _, Backbone, $,
             MyWorkspacesListItem,
             MyWorkspacesCollectionFactory,
             MyWorkspacesTableView,
             lang,
			 BaseUtils,
             workspaceUtil,
             WorkspacesView) {

    var MyWorkspacesView = WorkspacesView.extend({

        constructor: function MyWorkspacesView(options) {
            this.viewClassName = 'conws-myworkspaces';

            WorkspacesView.prototype.constructor.apply(this, arguments);

            // Show expand icon always
            this.limit = -1;
        },

        childView: MyWorkspacesListItem,

        childViewOptions: function () {
            return {
                // page context needed for default action on child view
                context: this.options.context,
                checkDefaultAction: true,
                preview: this.options.data                      &&
                         this.options.data.collapsedView        &&
                         this.options.data.collapsedView.preview,
                templateHelpers: function () {
                    return {
                        name: this.model.get('name'),
                        enableIcon: true
                        //icon now loaded in workspaces.view: onRenderItem
                    };
                }
            }
        },

        emptyViewOptions: {
            templateHelpers: function () {
                return {
                    text: this._parent._getNoResultsPlaceholder()
                };
            }
        },

        workspacesCollectionFactory: MyWorkspacesCollectionFactory,
        workspacesTableView: MyWorkspacesTableView,
        dialogClassName: 'myworkspaces',
        lang: lang,

        // Attributes identify collection/models for widget
        // In case two widgets has returns same attributes here, they share the collection!!
        _getCollectionAttributes: function () {
            var attributes = {
                workspaceTypeId: this.options.data.workspaceTypeId,
                sortExpanded: this.options.data.expandedView && workspaceUtil.orderByAsString(this.options.data.expandedView.orderBy),
				title:  BaseUtils.getClosestLocalizedString(this.options.data.title, lang.dialogTitle)
            };
            return attributes;
        },

        _getCollectionUrlQuery: function () {
            var options = this.options.data,
                query = {};
            if (!_.isUndefined(options.workspaceTypeId)) {
                query.where_workspace_type_id = options.workspaceTypeId;
            }

            // only fetch properties for limited view
            query.fields = encodeURIComponent("properties{id,container,name,type,type_name}");
            query.action = "properties-properties";

            // Fetch only recently accessed workspaces, which workspaces these are
            // is defined by the server. Also the order is already set by server, this must not
            // be done/passed from client to server
            query.expanded_view = "false";

            return _.isEmpty(query) ? undefined : query;
        },

        templateHelpers: function() {
           var data = _.extend(WorkspacesView.prototype.templateHelpers.apply(this, arguments),{
               searchAria: lang.searchAria,
               expandAria: lang.expandAria
           });
           return data;
        }

    });

    return MyWorkspacesView;
});
