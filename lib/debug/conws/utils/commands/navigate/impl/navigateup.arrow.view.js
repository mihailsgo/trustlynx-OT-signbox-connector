csui.define([ 'module',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/log',
  'csui/models/commands',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/controls/toolbar/toolitems.filtered.model',
  'csui/controls/toolbar/toolitems.factory',
  'conws/utils/commands/navigate/impl/flyout.toolitem.view',
  'conws/utils/navigate/navigate.util',
  'conws/utils/commands/navigate/navigateup',
  'i18n!conws/utils/commands/nls/commands.lang',
  'css!conws/utils/commands/navigate/impl/navigate',
],function(module, _, Marionette, Log,
  CommandCollection,
  ToolbarCommandController,
  FilteredToolItemsCollection,
  ToolItemsFactory,
  FlyoutToolItemView2,
  NavigateUtil,
  NavigateupCommand,
  lang){

    'use strict';

    var log = new Log( module.id );

    /**
     * in order to have the menu items enabled we provide a commands list to the FlyoutToolItemView.
     * the only command we need is the navigate up command.
     * in order to avoid evaluating the expensive .enabled(), which is superfluous,
     * as it has already been checked due to the toolitem registered in the nodes table toolbar,
     * we declare our own command here, which is always enabled.
     * also to easily forward the tool item events we let this command have the same signature.
     */
    var EnabledNavigateupCommand = NavigateupCommand.extend({

      enabled: function( status, options ) { return true; },

    });

    var ItemViewWithFlyoutView = Marionette.ItemView.extend({

      // no template needed. however set tag and class same as toolbar, so css from csui is applied.
      template: false,
      tagName: "ul",
      className: "csui-toolbar binf-nav binf-nav-pills csui-align-left",

      constructor: function NavigateupArrowView() {
        Marionette.ItemView.prototype.constructor.apply(this,arguments);
        // here we have:
        // this.options === {
        //   blockingParentView: NodesTableView,
        //   context: PerspectiveContext,
        //   status: {
        //     collection: NodeChildren2Collection,
        //     container: NodeModel,
        //     context: PerspectiveContext,
        //     data: { addableType: NodeAddableTypecollection },
        //     nodes: Nodes,
        //     originatingView: NodesTableView
        //   },
        //   model: false,
        //   originatingView: NodesTableView,
        //   toolbarCommandController: ToolbarCommandController,
        //   toolbarItemsMask: undefined,
        //   useIconsForDarkBackground: false
        // };
        if (this.options.status.context && this.options.status.context.hasObject("workspaceContext")) {
          if (!this.options.status.context.hasCollection("ancestors")) {
            this.options.status.context.getFactory("ancestors").fetch();
          }
          this.listenTo(this.options.status.context.getCollection("ancestors"),'reset sync error',this._reRender);
        }
      },

      _reRender: function() {
        if (this.toolItemView) {
          // if we are already rendered, then re-render, if needed.
          var ancestorsData = this._getAncestorsData();
          if (!_.isEqual(this.ancestorsData||0,ancestorsData||0)) {
            this.render();
          }
        }
      },

      onRender: function() {

        log.debug("navigateup arrow onrender start") && console.log(log.last);

        var command = new EnabledNavigateupCommand();
        var toolItemData = [
          {
            signature: command.get("signature"),
            name: lang.CommandNameNavigateUp,
            toolItemAria: lang.CommandNameNavigateUp,
            iconName: "conws_action_navigate_up",
            menuWithMoreOptions: true,
            // toolItemAriaExpand: false,
            // group: 'main',
            // enabled: true,
            flyout: "CwsUpFlyout"
          }
        ];
        this.ancestorsData = this._getAncestorsData();
        if (this.ancestorsData===undefined) {
          // dropdown is about to be rendered before ancestors are fetched.
          // As the dropdown is still closed, nobody can see, that it is empty.
          // So we render dots to indicate that it's loading.
          // In constructor we have setup a listener to re-render anytime ancestors change.
          // potential TODO: build dropdown with bubbling dots instead of static dots.
          toolItemData.push({
            signature: command.get("signature"),
            name: "...",
            commandData: { nodeid: 0 },
            flyout: "CwsUpFlyout"
          });
        } else {
          this.ancestorsData.forEach(function(el){
            toolItemData.push({
              signature: command.get("signature"),
              name: el.name,
              commandData: { nodeid: el.id },
              flyout: "CwsUpFlyout"
            });
          });
        }
        var toolItemsFactory = new ToolItemsFactory({ main: toolItemData });
        var commands = new CommandCollection([command]);
        var commandController = new ToolbarCommandController({ commands: commands });
        var filteredCollection = new FilteredToolItemsCollection(
            toolItemsFactory, {
              status: this.options.status,
              // from toolitems.filtered.model.js: todo: move filteredCollection to
              // commandController and do not access the commands via the commandController here
              commands: commands/*this.toolbarCommandController.commands*/,
              delayedActions: this.options.status.collection && this.options.status.collection.delayedActions,
              mask: undefined
            });
        var flyoutOptions = {
          longPress: true,
          blockingParentView: this.options.blockingParentView,
          command: commands.at(0),
          model: filteredCollection.at(0),
          noMenuRoles: true,
          originatingView: this.options.originatingView,
          toolbarCommandController: commandController,
          toolbarItemsMask: undefined,
          useIconsForDarkBackground: false
        }
        this.toolItemView = new FlyoutToolItemView2(flyoutOptions);
        this.listenTo(this.toolItemView,"toolitem:action",this._toolItemAction);
        this.listenTo(this.toolItemView,"childview:toolitem:action",this._toolItemChildAction);
        this.toolItemView.render();
        this.toolItemView.makeFocusable(); // for key board navigation
        this.$el.empty();
        this.$el.append(this.toolItemView.$el);

        log.debug("navigateup arrow onrender done") && console.log(log.last);
      },

      _getAncestorsData: function() {
        var ancestorsData = [];
        var status = this.options.status;
        if (status.context && status.context.hasCollection("ancestors")) {
          var wkspid = NavigateUtil.checkWorkspaceHierarchy(status.context).wkspid;
          if (wkspid) {
            var ancestors = status.context.getCollection("ancestors");
            if (!ancestors.error) {
              if (ancestors.fetched && ancestors.length && ancestors.at(-1).get("id")===ancestors.node.get("id")) {
                // ancestors are up to date. extract what we need.
                // from parent up to workspace include in menu.
                // skip last entry, it is the shown container itself.
                for (var index = ancestors.length-2; index>=0; index-- ) {
                  var el = ancestors.at(index);
                  ancestorsData.unshift({
                    name: el.get("name"),
                    id: el.get("id")
                  });
                  if (el.get("id")===wkspid) {
                    break;
                  }
                }
              } else {
                // not up to date. indicate this to caller by returning undefined.
                ancestorsData = undefined;
              }
            }
          }
        }
        return ancestorsData;
      },

      // This method is triggered as a 'toolitem:action' event; such
      // events always get the toolItem as the first argument.
      _toolItemAction: function (args) {
        var commandData = args.toolItem.get("commandData");
        if (!commandData || !commandData.nodeid) {
          this._toolItemViewAction(this.toolItemView,args);
        }

      },

      // This method is triggered as a nested 'childview:toolitem:action' event; such
      // events always get the childView as the first argument.
      _toolItemChildAction: function (toolItemView, args) {
        // action triggered by
        var commandData = args.toolItem.get("commandData");
        if (commandData && commandData.nodeid) {
          this._toolItemViewAction(toolItemView,args);
        }
      },

      _toolItemViewAction: function (toolItemView, args) {
        var executionContext = {
          context: this.options.status.context,
          nodes: this.options.status.nodes,
          container: this.options.status.container,
          collection: this.options.status.collection,
          originatingView: this.options.status.originatingView,
          toolItemView: toolItemView
        };
        this.options.toolbarCommandController.toolitemClicked(args.toolItem, executionContext);
      }

    });

  return ItemViewWithFlyoutView;
});