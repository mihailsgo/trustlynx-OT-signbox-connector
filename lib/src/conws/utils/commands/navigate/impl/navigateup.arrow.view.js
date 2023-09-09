/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'module',
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
    var EnabledNavigateupCommand = NavigateupCommand.extend({

      enabled: function( status, options ) { return true; },

    });

    var ItemViewWithFlyoutView = Marionette.ItemView.extend({
      template: false,
      tagName: "ul",
      className: "csui-toolbar binf-nav binf-nav-pills csui-align-left",

      constructor: function NavigateupArrowView() {
        Marionette.ItemView.prototype.constructor.apply(this,arguments);
        if (this.options.status.context && this.options.status.context.hasObject("workspaceContext")) {
          if (!this.options.status.context.hasCollection("ancestors")) {
            this.options.status.context.getFactory("ancestors").fetch();
          }
          this.listenTo(this.options.status.context.getCollection("ancestors"),'reset sync error',this._reRender);
        }
      },

      _reRender: function() {
        if (this.toolItemView) {
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
            flyout: "CwsUpFlyout"
          }
        ];
        this.ancestorsData = this._getAncestorsData();
        if (this.ancestorsData===undefined) {
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
                ancestorsData = undefined;
              }
            }
          }
        }
        return ancestorsData;
      },
      _toolItemAction: function (args) {
        var commandData = args.toolItem.get("commandData");
        if (!commandData || !commandData.nodeid) {
          this._toolItemViewAction(this.toolItemView,args);
        }

      },
      _toolItemChildAction: function (toolItemView, args) {
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