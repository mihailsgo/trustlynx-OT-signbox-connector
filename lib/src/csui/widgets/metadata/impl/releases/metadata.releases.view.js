/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/marionette3',
  'csui/utils/contexts/factories/connector',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/table/table.view',
  'csui/utils/accessibility',
  'csui/models/nodechildren',
  'csui/models/compound.document/releases/releases.collection',
  'csui/widgets/metadata/impl/releases/metadata.releases.columns',
  'csui/widgets/metadata/impl/releases/toolbaritems',
  'csui/widgets/metadata/impl/releases/toolbaritems.masks',
  'csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/utils/commands',
  'csui/utils/commands/compound.document/releases.commands',
  'csui/controls/tableactionbar/tableactionbar.view',
  'hbs!csui/widgets/metadata/impl/releases/metadata.releases',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/impl/releases/metadata.releases'
], function (module, _, Marionette, ConnectorFactory, LayoutViewEventsPropagationMixin, TableView, Accessibility, NodeChildrenCollection,
  ReleasesCollection, metadataReleaseTableColumns, toolbarItems, ToolbarItemsMasks, TableRowSelectionToolbarView,
  ToolbarCommandController, DefaultActionBehavior,
  commands, releasesCommands, TableActionBarView, template, lang) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();
  
  var config = module.config();
  _.defaults(config, {
    toolbarItems: toolbarItems,
    showInlineActionBarOnHover: !accessibleTable,
  });

  var MetadataReleasesTableView = Marionette.View.extend({
    className: 'csui-compound-document-releases',
    template: template,

    ui: {
      tableView: '.csui-releases-table',
      tableRowSelectionToolbarView: '.csui-metadata-releases-rowselection-toolbar-view'
    },

    regions: {
      tableRegion: '@ui.tableView',
      tableRowSelectionToolbarRegion: '@ui.tableRowSelectionToolbarView'
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    constructor: function MetadataReleasesTableView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
      options.toolbarItems || (options.toolbarItems = toolbarItems);
      options.toolbarItemsMasks || (options.toolbarItemsMasks = new ToolbarItemsMasks());
      _.defaults(this.options, {
        showInlineActionBarOnHover: config.showInlineActionBarOnHover
      }, {
        forceInlineActionBarOnClick: false,
        inlineActionBarStyle: "csui-table-actionbar-bubble",
        toolbarItems: toolbarItems
      });
      this.collection.commands = this.collection.options.commands;
      this.collection.fetch();
      this.context = options.context;
      this.connector = this.context.getObject(ConnectorFactory);
      this.commands = options.commands || commands;
      if (releasesCommands) {
        this.commands.push(releasesCommands.models);
      }
      this.commandController = new ToolbarCommandController({
        commands: this.commands
      });
      this.listenTo(this.commandController, 'before:execute:command', this._beforeExecuteCommand);
      this.listenTo(this.commandController, 'after:execute:command', this._afterExecuteCommand);
      this._setTableView();
      this._setTableRowSelectionToolbar({
        toolItemFactory: this.options.toolbarItems.tableHeaderToolbar,
        toolbarItemsMask: this.options.toolbarItemsMasks,
        commands: this.options.commands || commands,
      });
      this._setTableRowSelectionToolbarEventListeners();
      this.propagateEventsToRegions();
    },

    initialize: function () {
      var defaultActionItems = this.defaultActionController.actionItems;
      this.collection = new ReleasesCollection(undefined, {
        connector: this.options.context.getObject(ConnectorFactory),
        node: this.options.model,
        orderBy: 'create_date desc',
        autoreset: true,
        commands: commands.getAllSignatures(),
        defaultActionCommands: defaultActionItems.getAllCommandSignatures(commands),
        delayRestCommands: true
      });
      this.collection.setEnabledDelayRestCommands(true);
    },

    onRender: function () {
      var tableRegion = this.getRegion('tableRegion');
      this.tableRowSelectionToolbarRegion = this.getRegion('tableRowSelectionToolbarRegion');
      this.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
      tableRegion.show(this.tableView);
      this.listenTo(this.tableView, 'tableRowSelected', function () {
        this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
      });
    },
    _beforeExecuteCommand: function () {
      this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
    },

    _afterExecuteCommand: function (toolbarActionContext) {
      switch (toolbarActionContext.commandSignature) {
        case 'Delete':
          if (!toolbarActionContext || toolbarActionContext.cancelled) {
            return;
          }
          var checkboxView = this.tableView._selectAllCheckboxRegion.currentView;
          checkboxView.model.set('checked', false);
          break;
      }
    },

    _setTableView: function () {
      if (!this.inlineToolbarItemsMasks) {
        this.inlineToolbarItemsMasks = new ToolbarItemsMasks(this.options);
      }
      var args = _.extend({
        connector: this.model.connector,
        collection: this.collection,
        context: this.context,
        originatingView: this,
        tableColumns: metadataReleaseTableColumns,
        selectColumn: true,
        haveDetailsRowExpandCollapseColumn: true,
        actionItems: this.defaultActionController.actionItems,
        commands: this.commands,
        customLabels: {
          emptyTableText: lang.releasesNoResultsPlaceholder
        },
        focusView: 'tableHeader',
        inlineBar: {
          viewClass: TableActionBarView,
          options: _.extend({
            collection: this.options.toolbarItems.inlineToolbar,
            toolItemsMask: this.inlineToolbarItemsMasks.toolbars.inlineActionBar,
            delayedActions: this.collection.delayedActions,
            container: this.container,
            containerCollection: this.collection
          }, this.options.toolbarItems.inlineToolbar &&
          this.options.toolbarItems.inlineToolbar.options, {
            inlineBarStyle: this.options.inlineActionBarStyle,
            forceInlineBarOnClick: this.options.forceInlineActionBarOnClick,
            showInlineBarOnHover: this.options.showInlineActionBarOnHover
          })
        },
        tableAria: _.str.sformat(lang.releasesTableAria, this.options.model.get('name'))
      }, this.options);

      this.tableView = new TableView(args);
      if (this.tableView.collection && this.tableView.collection.length === 0 && this.collection.fetched) {
        this.tableView._showEmptyViewText = true;
      }
      this.listenTo(this.tableView, 'execute:defaultAction', function (node) {
        var nextNode, nextNodeId, childrenCollection, childNode;
        nextNode = this.options.context.getModel('nextNode');
        childrenCollection = new NodeChildrenCollection(undefined, { node: node, autoreset: true });
        childrenCollection.fetch().done(function (resp) {
          childNode = _.has(resp.data[0], 'id') && resp.data[0].id;
          nextNodeId = !!childNode ? childNode : node;
          nextNode.set('id', nextNodeId);
        });
      });
    },

    _setTableRowSelectionToolbar: function (options) {
      this._tableRowSelectionToolbarView = new TableRowSelectionToolbarView({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,
        commands: commands,
        selectedChildren: this.tableView.selectedChildren,
        container: this.collection.node,
        context: this.options.context,
        originatingView: this.options.originatingView,
        collection: this.collection
      });
    },

    _setTableRowSelectionToolbarEventListeners: function () {
      this.listenTo(this.tableView.selectedChildren, 'reset', function () {
        if (this.tableView.selectedChildren.length > 0) {
          this.tableRowSelectionToolbarRegion.$el.addClass(
            'csui-metadata-releases-rowselection-toolbar-visible');
        } else {
          this.tableRowSelectionToolbarRegion.$el.removeClass(
            'csui-metadata-releases-rowselection-toolbar-visible');
        }
      });
    }

  });
  _.extend(MetadataReleasesTableView.prototype, LayoutViewEventsPropagationMixin);

  return MetadataReleasesTableView;
});