/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone",
  "csui/lib/marionette", "csui/utils/log", 'csui/utils/base',
  'csui/models/node/node.model',
  'csui/utils/contexts/factories/node',
  'csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/controls/toolbar/toolbar.command.controller',
  'xecmpf/utils/contexts/factories/eventactioncenter/eventactioncentercolumncollection',
  'xecmpf/utils/contexts/factories/eventactioncenter/eventactioncenterfactory',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/controls/mixins/view.state/multi.node.fetch.mixin',
  'csui/controls/mixins/view.state/node.selection.restore.mixin',
  'csui/widgets/nodestable/nodestable.view',
  'csui/utils/commands',
  'csui/controls/globalmessage/globalmessage',
  'xecmpf/widgets/eac/toolbaritems',
  'xecmpf/widgets/eac/headermenuitems',
  'xecmpf/widgets/eac/headermenuitems.mask',
  'i18n!xecmpf/widgets/eac/impl/nls/lang',
  'css!xecmpf/widgets/eac/impl/eac'
], function (module, $, _, Backbone, Marionette, log, base, NodeModel,
    NodeModelFactory, TableToolbarView, ToolbarCommandController,
    EventActionCenterTableColumns, EventActionCenterFactory,
    LayoutViewEventsPropagationMixin,   NodeViewStateMixin,
    MultiNodeFetchMixin, NodeSelectionRestoreMixin,
    NodesTable, commands, GlobalMessage, toolbarItems, headermenuItems, headermenuItemsMask, lang) {
  'use strict';

  var EventActionCenterView = NodesTable.extend({

    constructor: function EventActionCenterView(options) {
      options = _.defaults(options, {
        orderBy: 'name desc',
        tableColumns: new EventActionCenterTableColumns(),
        toolbarItems: toolbarItems,
        headermenuItems: headermenuItems.clone(),
        urlParamsList: [],
        showSelectionCounter: true
      });

      NodesTable.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();

    },
    initialize: function () {

      var that = this;
	  
      this.container = this.options.container || this.context.getModel(NodeModelFactory);

      this.container.set('type', 806);
      this.container.set('name', 'Event action center');

      this.trigger('update:model', this.container);
      this.collection = this.options.collection;
      if (!this.collection) {
        this.collection = this.context.getCollection(EventActionCenterFactory, {
          options: this._restoreCollectionOptionsFromViewState()
        });
      }
  
     
      this.initSelectionMixin(this.options, this.collection);
      this._allCommands = this.defaultActionController.actionItems.getAllCommandSignatures(
          commands);
      this.commandController = new ToolbarCommandController({commands: commands});

      if (this.collection) {
        this.listenTo(this.collection, 'sync', function () {
          this.clearAllSelectedNodes();

        });
      }
      this.listenTo(this.commandController, 'click:toolitem:action', this._toolbarActionTriggered);
      this.listenTo(this.commandController, 'before:execute:command', this._beforeExecuteCommand);
      this.listenTo(this.commandController, 'after:execute:command', this._afterExecuteCommand);
      this.collection.setResourceScope(EventActionCenterFactory.getDefaultResourceScope());
      this.collection.setDefaultActionCommands(this._allCommands);
      this.collection.setEnabledDelayRestCommands(true);

      if (this.collection.delayedActions) {
        this.listenTo(this.collection.delayedActions, 'error',
            function (collection, request, options) {
              var error = new base.Error(request);
              GlobalMessage.showMessage('error', error.message);
            });
      }

      this.columns = this.collection.columns ||
                     this.context.getCollection(EventActionCenterFactory);

      this.columns = this.collection.columns;

      this._setToolBar();

      this.setTableView({
        orderBy: this.options.orderBy,
        filterBy: this.options.filterBy,
        nameEdit: false,
        haveDetailsRowExpandCollapseColumn: false,
        showSelectionCounter: true,
        tableColumns: this.options.tableColumns,
        tableTexts: {
          zeroRecords: lang.emptyListText
        }
      });

      this.tableView.listenTo(this.tableView, 'clicked:cell', function (event) {  
        var winEvent = window.event;
        if (event.colIndex !== 0 && !($(winEvent.target).hasClass('icon-toolbarAdd'))) {
          this.triggerMethod('execute:defaultAction', event.model);
        }            
      });
      var self = this;
      this.tableView.$el.on('keydown', function (event) {
        if (event.originalEvent.keyCode === 13) {
          for(var i=0; i< self.collection.length; i++) {
            if((event.target.getAttribute('aria-label') === self.collection.models[i].get('system_name') && $(event.target).siblings('.csui-table-cell-generic-text[data-csui-attribute="name"]').attr('aria-label') === self.collection.models[i].get('name')) || 
              (event.target.getAttribute('aria-label') === self.collection.models[i].get('name') && $(event.target).siblings('.csui-table-cell-generic-text[data-csui-attribute="system_name"]').attr('aria-label') === self.collection.models[i].get('system_name')) ||
              (event.target.getAttribute('aria-label') === self.collection.models[i].get('action_plan_text') && $(event.target).siblings('.csui-table-cell-generic-text[data-csui-attribute="name"]').attr('aria-label') === self.collection.models[i].get('name') &&
              $(event.target).siblings('.csui-table-cell-generic-text[data-csui-attribute="system_name"]').attr('aria-label') === self.collection.models[i].get('system_name'))){
              self.triggerMethod('execute:defaultAction', self.collection.models[i]);
            }
          }
        } 
      });

      this.listenTo(this.tableView, 'render', function () {
        this.$el.remove('.csui-table-empty-default');
        if (this.tableView.tableBodyView) { 
          this.tableView.tableBodyView.accFocusedCell.column = 1;
        }
        if(this.tableView.collection.length === 0) {
          this.$el.find('.icon-toolbarAdd').prop('tabindex','0');
          this.$el.find('.icon-toolbarAdd').trigger('focus');
        }
        if (this.tableView.collection.length > 1) {
          var isInlineForm = this.tableView.$el.find(".csui-table-row-shows-inlineform");
          if (isInlineForm.length) {
            isInlineForm.find("td.csui-inlineform-parent").attr("colspan", 3);
          }
        }
        if (this.tableView.collection.length === 0) {
          this.$el.find('thead button').hide();
        }
        else {
          this.$el.find('thead button').show();
        }
      });
      this._setTableRowSelectionToolbarEventListeners();
      this.setPagination();
      if (this.options.collection) {
        this.collection.fetched = false;
      }
    },
    _setToolBar: function () {
      var parentNode = new NodeModel({id: undefined},
          {connector: this.collection.connector});
      this.collection.node = parentNode;
      this.tableToolbarView = new TableToolbarView({
        context: this.options.context,
        toolbarItems: this.options.toolbarItems,
        headermenuItems: this.options.headermenuItems,
        headermenuItemsMask: this.options.headermenuItemsMask,
        container: this.container,
        collection: this.collection,
        originatingView: this,
        blockingParentView: this.options.blockingParentView || this,
        addableTypes: this.addableTypes,
        toolbarCommandController: this.commandController
      });
    }
    
  });


  _.extend(EventActionCenterView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(EventActionCenterView.prototype, NodeViewStateMixin);
  _.extend(EventActionCenterView.prototype, MultiNodeFetchMixin);
  _.extend(EventActionCenterView.prototype, NodeSelectionRestoreMixin);

  return EventActionCenterView;
});
