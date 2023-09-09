csui.define(["module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone",
  "csui/lib/marionette", "csui/utils/log",
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/widgets/header/impl/header.model.factory',
  'conws/widgets/relatedworkspaces/commands',
  'conws/widgets/relatedworkspaces/toolbaritems',
  'conws/widgets/relatedworkspaces/toolbaritems.masks',
  'conws/widgets/relatedworkspaces/headermenuitems',
  'conws/widgets/relatedworkspaces/headermenuitems.masks',
  'conws/utils/workspaces/impl/workspaceutil',
  'conws/utils/workspaces/workspacestable.view',
  'i18n!conws/widgets/relatedworkspaces/impl/nls/lang',
  'css!conws/widgets/relatedworkspaces/impl/relatedworkspacestable'
], function (module, $, _, Backbone,
    Marionette, log,
    WorkspaceContextFactory,
    HeaderModelFactory,
    commands,
    toolbarItems,
    ToolbarItemsMasks,
    headermenuItems,
    HeaderMenuItemsMasks,
    workspaceUtil, WorkspacesTableView, lang) {

  var RelatedWorkspacesTableView = WorkspacesTableView.extend({

    constructor: function RelatedWorkspacesTableView(options) {

      // get workspace context
      if (!options.workspaceContext) {
        options.workspaceContext = options.context.getObject(WorkspaceContextFactory);
        options.workspaceContext.setWorkspaceSpecific(HeaderModelFactory);
      }

      WorkspacesTableView.prototype.constructor.apply(this, arguments);

      // get the model from the model factory
      this.collection.workspace = options.workspaceContext.getModel(HeaderModelFactory);
      // opening the expanded view is done long after navigation.
      // so we fetch header model, to have data up to date.
      this.collection.workspace.fetch();
      this.listenTo(this.collection.workspace,"sync",function() {
        // when the model containing the actions changes, refresh the add toolbar.
        if (this.tableToolbarView && this.tableToolbarView.addToolbarView) {
          this.tableToolbarView.addToolbarView.collection.refilter();
        }
      });
    },

    initialize: function() {
      this.options.commands = commands;
      this.options.hasTableRowSelection = true;
      this.options.toolbarItems = toolbarItems;
      this.options.toolbarItemsMasks = new ToolbarItemsMasks();
      this.options.headermenuItems = headermenuItems;
      this.options.headermenuItemsMasks = new HeaderMenuItemsMasks();
      WorkspacesTableView.prototype.initialize.apply(this, arguments);
    },

    onRender: function () {
      var collection = this.collection;

      // Set order if passed as configuration, otherwise use default
      if (!_.isUndefined(this.collection.options.relatedWorkspaces.attributes.sortExpanded)) {
        collection.orderBy = this.collection.options.relatedWorkspaces.attributes.sortExpanded;
      } else {
        collection.orderBy = workspaceUtil.orderByAsString(this.options.data.orderBy);
      }

      this.options.tableAria = "";
      if(!_.isUndefined(collection.options.attributes.title)) {
        this.options.tableAria = _.str.sformat(lang.expandTableAria, collection.options.attributes.title);
      }

      this.doRender(collection);
    },

    _getCollectionUrlQuery: function () {

      var query = {where_relationtype: this.options.data.relationType};

      // only fetch specific properties for table view
      query.fields = encodeURIComponent("properties{" + this.getColumnsToFetch() + "}");
      query.action = "properties-properties";

      // Fetch users expanded, to show name
      query.expand_users = "true";

      return query;
    },

    _beforeExecuteCommand: function (toolbarActionContext) {
      WorkspacesTableView.prototype._beforeExecuteCommand.apply(this, arguments);
    },

    _toolbarActionTriggered: function (toolbarActionContext) {
      WorkspacesTableView.prototype._toolbarActionTriggered.apply(this, arguments);
      if (!toolbarActionContext || toolbarActionContext.cancelled) {
         // command was cancelled
         return;
       }
  
      var view = this;
      var newNodes;
      
      switch (toolbarActionContext.commandSignature) {
        case 'AddRelation':

          // indicate, that view has changed data.
          view.changed = true;

          newNodes = toolbarActionContext.newNodes;
          if (newNodes && newNodes.length>0) {

            // prepare all new nodes on top of the view, marked as new (green) rows.
            newNodes.forEach(function(newNode){
              newNode.isLocallyCreated = true;
              newNode.attributes && delete newNode.attributes.csuiIsSelected;
              newNode.collection = view.collection;
              newNode.selectable = true;
            });

            // to update pagination, currently no other chance (discussed with cs.core.ui team)
            // than to set totalCount directly followed by a reset.
            this.collection.totalCount = this.collection.totalCount + newNodes.length;

            // add all new nodes on top, but not more than page size.
            if (newNodes.length>this.collection.topCount) {
              newNodes = newNodes.slice(0,this.collection.topCount);
            } else if (newNodes.length<this.collection.topCount) {
              newNodes = newNodes.concat(this.collection.slice(0,this.collection.topCount-newNodes.length));
            }
            this.collection.updateSelectableState(newNodes);
            var showSelectColumn = !!(this.options.showSelectColumn && this.collection.existsSelectable);
            if (this.tableView && this.tableView.options && this.tableView.options.selectColumn!==showSelectColumn) {
              // in this case check box column has to appear.
              this.tableView.options.selectColumn = showSelectColumn;
              this.collection.reset(newNodes,{silent:true});
              this.collection.columns.trigger('reset',this.collection.columns);
              this.tableView.resetScrollToTop();
              this.paginationView && this.paginationView.collectionChange();
            } else {
              // in this case check box column is already there.
              this.collection.reset(newNodes);
              this.tableView && this.tableView.resetScrollToTop();
            }
          }
          break;

        case 'RemoveRelation':
          // TODO: keep selected nodes as good as possible
          // after partial deletion (and error during a previous deletion).

          // indicate, that view has changed data.
          this.changed = true;
          
          this.collection.fetch().then(function(){
            if (view.collection.totalCount<=view.collection.skipCount) {
              // We are positioned beyond the last page. Thus, an empty table is displayed.
              if (view.collection.totalCount>0) {
                // But we have a non-empty collection.
                if (view.collection.totalCount<=view.collection.topCount) {
                  // And we have only one page. Thus, no paging buttons are there.
                  // We help the user to get a result by automatically fetching the first page.
                  view.collection.skipCount = 0;
                  view.collection.fetch();
                }
                // If totalCount>topCount, we have more than one page and paging buttons
                // are displayed. Thus, the user can navigate to a result accessing the buttons.
              }
            }
          });
          this.allSelectedNodes.reset([]);
          break;
      }
    }

  });

  return RelatedWorkspacesTableView;
});
