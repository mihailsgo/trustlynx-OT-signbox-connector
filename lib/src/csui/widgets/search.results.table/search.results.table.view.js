/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/utils/base',
  'csui/widgets/generic.expanded.table/generic.expanded.table.view',
  'csui/utils/contexts/factories/search.results.table.columns',
  'csui/utils/contexts/factories/search.results.table.factory',
  'csui/widgets/search.results.table/search.results.table.columns',
  'csui/utils/contexts/factories/search.settings.factory',
  'csui/controls/settings/settings.view',
  'csui/controls/globalmessage/globalmessage',
  'csui/models/nodes',
  'csui/utils/commands/properties',
  'csui/utils/accessibility',
  'csui/models/nodechildrencolumn',
  'i18n!csui/widgets/search.results.table/impl/nls/lang',
  'css!csui/widgets/search.results.table/impl/search.results.table'
], function (module, _, $, Backbone, base, GenericExpandedTableView,SearchResultsColumnsCollectionFactory, SearchResultsCollectionFactory,
    SearchResultsTableColumns, SearchSettingsFactory, SettingsView, GlobalMessage,
    NodeCollection, PropertiesCommand, Accessibility, NodeChildrenColumnModel, lang) {
  'use strict';
    var accessibleTable = Accessibility.isAccessibleTable(),
      config = _.extend({
        defaultPageSize: 10,
        enableSearchSettings: true // enable/disable search settings
      }, module.config());


  var SearchResultsTableView = GenericExpandedTableView.extend({

    className: 'csui-search-results-table-view',

    constructor: function SearchResultsTableView(options) {
      options.collectionFactory = SearchResultsCollectionFactory;
      options.columnCollectionFactory = SearchResultsColumnsCollectionFactory;
      options.tableColumns = SearchResultsTableColumns;
      options.pageSize = config.defaultPageSize;
      options.enableSearchSettings = config.enableSearchSettings;
      options.tableAria = lang.searchResultsTableAria;
      GenericExpandedTableView.prototype.constructor.call(this, options);
      this.listenTo(this, "update:table", _.bind(function () {
        this.tableView.options.tableColumns.trigger('update');
      }, this));

      this.listenTo(this, 'create:SettingsDropdown', this._createSettingsDropdown);      
      this.listenTo(this, 'toggle:description', function (args) {
        this.tableView.showDetailRowDescriptions(args.showDescriptions);
      });
      this.listenTo(this.collection, 'sync', this.executeEndProcess);
      if (options.enableSearchSettings) {
        var templateId = options.context._applicationScope.get("query_id");
        this.loadSearchSettings(templateId);
      }     
    },

    _createSettingsDropdown: function (event) {   

      var eventTarget = event.currentTarget;
      if (!eventTarget.classList.contains('csui-setting-icon')) {
        return; // event bubbled from dropdown to toolbar item => ignore it
      }
      if (!this.settingsView || (this.settingsView && this.settingsView.isDestroyed())) {
        $(document).on('mouseup.dropdown.' + this.cid, _.bind(this._closeSettingsMenu, this));
        this.headerView.data = {};
        this.settingsView = new SettingsView({
          model: this.settings,
          tableCollection: this.collection,
          data: this.headerView.data,
          searchResultsView: this
        });
        this.listenTo(this.settingsView, 'close:menu', _.bind(function (event) {
          this._destroySettingsDropdown(event);
        }, this));
        this.headerView.settingsRegion.show(this.settingsView);
        this.$el.children().find('.csui-setting-icon').attr('aria-expanded', true);
        this.settingsView.$el.find('.binf-show').trigger('focus');
        this.settingsView.isVisible = true;
        this.listenTo(this.settingsView, 'update:showSummaryDescriptions', function () {
          this.selectedSettings = this.settingsView.model.get(
              'display').summary_description.selected;
           this.headerView.selectedSettings = this.selectedSettings;
           this.updateHeader();
        });
      } else {
        this._destroySettingsDropdown();
        this.$el.find('.csui-search-settings').attr('aria-expanded', false);
      }
    },

    updateHeader: function () {
      this.headerView.updateToggleDescription();
      this.headerView.updateToggleDescriptionIcon();
    },

    _destroySettingsDropdown: function (event) {
      this.settingsView.destroy();
      $(document).off('mouseup.dropdown.' + this.cid);
      if (!!this.headerView.data.summary_description || !!this.headerView.data.display_regions) {
        this.blockActions();
        this.collection.isSortOptionSelected = true;
        this.formData = new FormData();
        var self = this;
        _.mapObject(this.headerView.data, function (value, key) {
          if (key === 'display_regions') {
            self.formData.append(key, value);
          } else if (key === 'summary_description') {
            self.formData.append(key, value);
          }
        });
        this.settingsView.model.save(null, {
          parse: false,
          data: this.formData,
          processData: false,
          cache: false,
          contentType: false
        }).done(_.bind(function (response) {
          if (!!self.headerView.data.summary_description) {
            self.settingsView.model.get(
              'display').summary_description.selected = self.headerView.data.summary_description;
            self.settingsView.trigger('update:showSummaryDescriptions');
            self.collection.settings_changed = false;
          }
          if (!!self.headerView.data.display_regions) {
            self.unblockActions();
            self.collection.settings_changed = true;
            self.settingsView.options.tableCollection.fetch();
          }
          if (!self.collection.settings_changed) {
            self.executeEndProcess();
            self.trigger('update:table');
          }
          this.$el.find(".csui-setting-icon").trigger('focus');
        }, this)).fail(function (error) {
          error = new base.Error(error);
          GlobalMessage.showMessage('error', error.message);
          self.unblockActions();
        });
      }
      if (this.settingsView.isChanged) {
        this.trigger('update:table');
        this.settingsView.isChanged = false;
      }
    },

    executeEndProcess: function () {
      if (!this.tableView) {
        this.setColumns();
        this.paginationRegion.show(this.paginationView);
      }

      if (this.collection.length) {
        this.trigger('render:metadata');
        this.columns = this.collection.searching && this.collection.searching.sortedColumns;
        this.getAdditionalColumns();
        this.trigger('update:table');
        this.collection.settings_changed = false;
      }
      this.unblockSearchResultsActions();
    },

    unblockSearchResultsActions: function () {
      this.unblockActions();
    },

    setColumns: function() {
      this.columns = this.collection.searching && this.collection.searching.sortedColumns;
      if (accessibleTable) {
        this.getAdditionalColumns();
      }
    },

    getAdditionalColumns: function () {
      if (accessibleTable) {
        var selectedSettings = this.headerView && this.headerView.selectedSettings;
        selectedSettings = (selectedSettings) ? selectedSettings :
                           this.settings && this.settings.get(
                               'display').summary_description.selected;
        switch (selectedSettings) {
        case 'SD' :
        case 'SP' :
        case 'DP' :
        {
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'description'}) ||
              !this.columns.findWhere({column_key: 'description'})) {
            this.getDescriptionColumn();
          }
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'summary'}) ||
              !this.columns.findWhere({column_key: 'summary'})) {
            this.getSummaryColumn();
          }
          break;
        }
        case 'SO' :
        {
          this.removeDescriptionColumn();
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'summary'}) ||
              !this.columns.findWhere({column_key: 'summary'})) {
            this.getSummaryColumn();
          }
          break;
        }
        case 'DO' :
        {
          this.removeSummaryColumn();
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'description'}) ||
              !this.columns.findWhere({column_key: 'description'})) {
            this.getDescriptionColumn();
          }
          break;
        }
        case 'NONE' :
        {
          this.removeSummaryColumn();
          this.removeDescriptionColumn();
        }
        }
      }
    },

    getDescriptionColumn: function () {
      this.columns.push(new NodeChildrenColumnModel({
        column_key: 'description',
        name: lang.descriptionColumnTitle,
        sortable: false,
        permanentColumn: true,
        type: -1,
        definitions_order: 505
      }));
    },

    getSummaryColumn: function () {
      this.columns.push(new NodeChildrenColumnModel({
        column_key: 'summary',
        name: lang.summaryColumnTitle,
        sortable: false,
        permanentColumn: true,
        type: -1,
        definitions_order: 506
      }));
    },

    
    removeDescriptionColumn: function () {
      if (this.tableView && this.tableView.columns.findWhere({column_key: 'description'})) {
        this.tableView.columns.findWhere({column_key: 'description'}).destroy();
      }
    },

    removeSummaryColumn: function () {
      if (this.tableView && this.tableView.columns.findWhere({column_key: 'summary'})) {
        this.tableView.columns.findWhere({column_key: 'summary'}).destroy();
      }
    },

    _closeSettingsMenu: function (e) {
      var loaderDisabled = !!this.$el.find(
        '.load-container.binf-hidden').length;
      if (!loaderDisabled || (this.headerView.ui.settingsMenu.is && this.headerView.ui.settingsMenu.is(e && e.target)) ||
        (this.settingsView && this.settingsView.$el.has(e && e.target).length)) {
        e.stopPropagation();
      } else if (!(this.settingsView && this.settingsView.isDestroyed())) {
        this._destroySettingsDropdown(e);
        this.$el.find(".csui-setting-icon").trigger('focus').attr('aria-expanded', false);
      }
    },

    loadSearchSettings: function (templateId) {
      this.options.templateId = templateId;
      if (this.settings && this.settings.options) {
        this.settings.options.templateId = templateId;
      }
      this.settings = this.options.settings ||
        this.context.getCollection(SearchSettingsFactory, this.options);
      this.settings.fetch();
    },

    openVersionHistory: function (args) {
      var nodes = new NodeCollection();
      nodes.push(args.model);
      var status = {
        nodes: nodes,
        container: args.model.collection.node,
        collection: args.model.collection,
        selectedTab: new Backbone.Model({ title: 'Versions' })
      };
      status = _.extend(status, { originatingView: this });
      var propertiesCmd = new PropertiesCommand();
      propertiesCmd.execute(status, this.options)
        .always(function (args) {
        });
    }    
  });

  return SearchResultsTableView;
});
