/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/base', 'csui/lib/marionette',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/namedlocalstorage',
  'csui/widgets/nodestable/nodestable.view',
  'csui/utils/commands',
  'csui/controls/globalmessage/globalmessage',
  'csui/widgets/nodestable/toolbaritems',
  'csui/widgets/nodestable/toolbaritems.masks',
  'csui/widgets/search.results.table/search.results.table.header.view',
  'csui/controls/mixins/view.state/multi.node.fetch.mixin',
  'csui/controls/mixins/view.state/node.selection.restore.mixin',
  'csui/controls/pagination/nodespagination.view',
  'hbs!csui/widgets/generic.expanded.table/impl/generic.expanded.table',
  'i18n!csui/widgets/generic.expanded.table/impl/nls/root/lang',
  'csui/behaviors/table.rowselection.toolbar/table.rowselection.toolbar.behavior',
  'csui/controls/table/rows/description/search.description.view',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'css!csui/widgets/generic.expanded.table/impl/generic.expanded.table'
], function (_, Backbone, base, Marionette, LayoutViewEventsPropagationMixin, NamedLocalStorage,
    NodesTable, commands, GlobalMessage, toolbarItems, ToolbarItemsMasks, SearchResultsTableHeaderView,
    MultiNodeFetchMixin, NodeSelectionRestoreMixin, PaginationView, template, lang,
    TableRowSelectionToolbarBehavior, DescriptionRowView,
    nodeExtraData) {
    'use strict';

    var GenericExpandedTableView = NodesTable.extend({
      template: template,
  
      className: 'csui-search-results-table-view',
  
      regions: {
        toolbarRegion: '.csui-rowselection-toolbar',
        tableRegion: '#tableviewRA',
        paginationRegion: '#paginationviewRA',
        headerRegion: '.csui-perspective-toolbar'
      },

      localStorage: new NamedLocalStorage('widgetOptions'),
  
      constructor: function GenericExpandedTableView(options) {
        options.showSelectionCounter = false;
        if (!options.enableViewState) {
          options.enableViewState = false;
        }
        this.context = options.context;
        this.query_id = this.context._applicationScope.get('query_id');
        NodesTable.prototype.constructor.apply(this, arguments);
        this.propagateEventsToRegions();
        this.listenTo(this.collection, 'sync', this.updateCollectionModels);
      },
  
      behaviors: _.extend({
        TableRowSelectionToolbar: {
          behaviorClass: TableRowSelectionToolbarBehavior
        }
      }, NodesTable.prototype.behaviors),
  
      updateCollectionModels: function() {
        this.columns = this.collection.searching && this.collection.searching.sortedColumns;
        this.collection.columns = this.columns;
        if (this.tableView) {
          this.tableView.columns = this.columns;
        }
        if (!this.options.isExpandedView && (!this.headerView ||
          this.headerView && !this.headerView._isRendered)) {
          this._setPerspectiveHeaderView();
        }
        this.onRender();
      },
  
      initialize: function () {
        this.collection = this.options.collection;
        if (!this.collection) {
          var collectionState = this.enableViewState ? this._restoreCollectionOptionsFromViewState() : {orderBy: 'relevance'};
          this.collection = this.context.getCollection(this.options.collectionFactory, {
            options: {
              query_id: this.query_id,
              collectionState: collectionState
            }
          });
          if (!!collectionState.orderBy) {
            this.options.orderBy = collectionState.orderBy;
          }
        }
        this.collection.setExpand('properties', ['parent_id', 'reserved_user_id']);

        this._allCommands = this.defaultActionController.actionItems.getAllCommandSignatures(
          commands);
        this.collection.setResourceScope(this.options.collectionFactory.getDefaultResourceScope(true));
        this.collection.setDefaultActionCommands(this._allCommands);
        this.collection.setEnabledDelayRestCommands(true);
        this.collection.setFields(nodeExtraData.getModelFields());
        this.collection.setExpand(nodeExtraData.getModelExpand());

        if (this.collection.delayedActions) {
          this.listenTo(this.collection.delayedActions, 'error',
            function (collection, request, options) {
              var error = new base.Error(request);
              GlobalMessage.showMessage('error', error.message);
            });
        }

        this.columns = this.collection.columns ||
          this.context.getCollection(this.options.columnCollectionFactory);

        _.defaults(this.options, {
          tableColumns: this.options.tableColumns.deepClone(),
          toolbarItems: toolbarItems,
          urlParamsList: []
        });

        if (!this.options.toolbarItemsMasks) {
          this.options.toolbarItemsMasks = new ToolbarItemsMasks();
        }
        this.initSelectionMixin(this.options, this.collection);
        if (this.settings && this.settings.get('display')) {
          var selectedSummary = this.settings.get('display').summary_description.selected;
          this.showSummaryOnly = (selectedSummary === 'SO') ? true : false;
        }
        if (this.options.collection) {
          this.collection.fetched = false;
        }
        if (!this.tableView) {
          this.setSearchTableView();
        }
        this.setPagination();
      },

      setSearchTableView: function () {
        this.setTableView({
          orderBy: this.options.orderBy,
          filterBy: this.options.filterBy,
          nameEdit: false,
          descriptionRowView: DescriptionRowView,
          descriptionRowViewOptions: {
            firstColumnIndex: 2,
            lastColumnIndex: 2,
            showDescriptions: false,
            showSummary: true,
            collapsedHeightIsOneLine: true,
            displayInEntireRow: true,
            showSummaryOnly: this.showSummaryOnly,
            descriptionColspan: 7,
            tableRowSummaryAvailable: true
          },
          haveDetailsRowExpandCollapseColumn: false,
          tableColumns: this.options.tableColumns,
          allSelectedNodes: this.getAllSelectedNodes(),
          tableTexts: {
            zeroRecords: lang.emptyListText
          }
        });
        this.tableView.selectedSettings = this.settings && this.settings.get('display') ? this.settings.get('display').summary_description.selected : undefined;
        this.addTableViewSelectionEvents(this.tableView);
      },

      setPagination: function () {
        var widgetOptions = this.localStorage.get(this.query_id),
            curPageNum    = widgetOptions && widgetOptions.CurrentPageNumber;
        this.options.pageSize = widgetOptions && widgetOptions.pageSize || this.options.pageSize;

        if (curPageNum > 1) {
          this.collection.activePageNumber = curPageNum;
        }

        this.paginationView = new PaginationView({
          collection: this.collection,
          pageSize: this.options.pageSize,
          defaultDDList: [10, 25, 50, 100],
          pageNumber: curPageNum
        });

        this.listenTo(this.paginationView, 'pagesize:updated', function (paginationView) {
          this.paginationView.pageSize = this.options.pageSize = paginationView.pageSize;
          var options       = this.localStorage.get(this.query_id),
              pageNum       = this.paginationView.currentPageNum,
              widgetOptions = _.extend(options, {
                CurrentPageNumber: pageNum,
                pageSize: this.options.pageSize
              });
          this.localStorage.set(this.query_id, widgetOptions);
        });

        this.listenTo(this.collection, 'new:page', function () {
          var pageSize      = this.paginationView.pageSize,
              pageNum       = this.paginationView.currentPageNum,
              skipCount     = pageSize * pageNum,
              options       = this.localStorage.get(this.query_id),
              widgetOptions = _.extend(options, {
                CurrentPageNumber: pageNum,
                skipCount: skipCount
              });
          this.collection.activePageNumber = pageNum;
          this.localStorage.set(this.query_id, widgetOptions);
        });

        return true;
      },

      _setPerspectiveHeaderView: function () {
        var showSearchSettingsButton = !!this.options.enableSearchSettings,
          widgetOptions = this.localStorage.get(this.query_id),
          widgetDisplayName = widgetOptions && widgetOptions.name;
        this.headerView = new SearchResultsTableHeaderView({
          title: widgetDisplayName || this.getTitle(),
          icon: 'title-customviewsearch',
          context: this.context,
          originatingView: this,
          localStorage: this.localStorage ? this.localStorage : this.options.localStorage,
          enableSearchSettings: showSearchSettingsButton,
          collection: this.collection,
          settings: !!this.settings ? this.settings : false
        });
        this.headerView.data = {};
      },
  
      _resetSortOrderBy: function () {
      },
  
      getTitle: function () {
        return lang.dialogTitle;
      },
  
      onRender: function () {
        if (this.headerView && !this.headerView._isRendered) {
          this.headerView && this.headerRegion.show(this.headerView);
        }
        if (this.headerView) {
          this.trigger('show:description:Icon');
        }
        if (this.tableView && !this.tableView._isRendered) {
          this.tableRegion.show(this.tableView);
          this.paginationRegion.show(this.paginationView);
        } else if (this.tableView) {
          if (this.collection.skipCount !== this.collection.actualSkipCount) {
            this.collection.skipCount = this.collection.actualSkipCount;
          }
          this.tableView.selectedSettings = this.settings && this.settings.get('display') ? this.settings.get('display').summary_description.selected : undefined;
          this.tableView.render();
          var totalCount       = this.paginationView && this.paginationView._getTotalCount(),
              showPageSizeMenu = this.paginationView && this.paginationView._showPageSizeMenu(),
              selectedPageSize = this.paginationView && this.paginationView.selectedPageSize || 10;

          if ((totalCount > selectedPageSize) && showPageSizeMenu) {
            this.paginationView && this.paginationView._initializePageTabMenu(true, true);
          }
        }
        if (this.collection.skipCount !== this.collection.actualSkipCount) {
          this.collection.skipCount = this.collection.actualSkipCount;
        }
      },
  
       getUrlParameters: function () {
         return [];
       }
    });
  
    _.extend(GenericExpandedTableView.prototype, LayoutViewEventsPropagationMixin);
    _.extend(GenericExpandedTableView.prototype, MultiNodeFetchMixin);
    _.extend(GenericExpandedTableView.prototype, NodeSelectionRestoreMixin);
  
    return GenericExpandedTableView;
  });
  