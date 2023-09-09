/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'module', 'nuc/lib/jquery', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/lib/marionette', 'nuc/utils/log', 'nuc/utils/base', 'i18n',
  'nuc/models/utils/v1tov2',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/columns',
  'csui/utils/contexts/factories/children',
  'csui/utils/contexts/factories/columns2',
  'csui/utils/contexts/factories/children2',
  'csui/utils/contexts/factories/node',
  'csui/models/node/node.addable.type.factory',
  'csui/models/node/node.facet2.factory',
  'csui/utils/contexts/factories/appcontainer',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/utils/contexts/factories/objecttypes.factory',
  'nuc/models/node/node.model',
  'csui/models/nodes',
  'csui/controls/progressblocker/blocker',
  'csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/controls/table/inlineforms/inlineform.factory',
  'csui/controls/facet.panel/facet.panel.view',
  'csui/controls/facet.bar/facet.bar.view',
  'csui/controls/table/table.view',
  'csui/controls/table/table.columns',
  'csui/controls/treebrowse/node.tree.view',
  'csui/controls/table/rows/description/description.view',
  'i18n!csui/widgets/nodestable/impl/nls/lang',
  'i18n!csui/utils/commands/nls/localized.strings',
  'i18n!csui/controls/table/impl/nls/lang',
  'csui/controls/pagination/nodespagination.view',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/utils/defaultactionitems',
  'csui/utils/toolitem.masks/children.toolitems.mask',
  'csui/utils/toolitem.masks/creation.toolitems.mask',
  'csui/widgets/nodestable/toolbaritems',
  'csui/widgets/nodestable/toolbaritems.masks',
  'csui/widgets/nodestable/headermenuitems',
  'csui/widgets/nodestable/headermenuitems.mask',
  'csui/utils/commands',
  "csui/utils/url",
  'csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view',
  'csui/controls/tableactionbar/tableactionbar.view',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/controls/draganddrop/draganddrop.view',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/controls/mixins/view.state/multi.node.fetch.mixin',
  'csui/controls/mixins/view.state/node.selection.restore.mixin',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/thumbnail/thumbnail.view',
  'csui/controls/thumbnail/thumbnail.content',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/dragndrop.supported.subtypes',
  'csui/utils/accessibility',
  'csui/utils/contexts/factories/next.node',
  'nuc/utils/namedlocalstorage',
  'csui/behaviors/item.error/item.error.behavior',
  'hbs!csui/widgets/nodestable/impl/nodestable',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/synchronized.context',
  'nuc/lib/jquery.when.all',
  'csui/lib/jquery.ui/js/jquery-ui',
  'csui/lib/jquery.redraw',
  'css!csui/widgets/nodestable/impl/nodestable'
], function (require, module, $, _, Backbone, Marionette, log, base, i18n, v1tov2,
    ConnectorFactory,
    ColumnCollectionFactory,
    ChildrenCollectionFactory,
    Column2CollectionFactory,
    Children2CollectionFactory,
    NodeModelFactory,
    AddableTypeCollectionFactory,
    Facet2CollectionFactory,
    AppContainerFactory,
    UserModelFactory,
    LargeFileSettingsFactory,
    ObjectTypesFactory,
    NodeModel,
    NodeCollection,
    BlockingView,
    TableToolbarView,
    inlineFormViewFactory,
    FacetPanelView,
    FacetBarView,
    TableView,
    tableColumns,
    NodeTreeView,
    DescriptionRowView,
    lang,
    cmdLang,
    controlLang,
    PaginationView,
    DefaultActionBehavior,
    defaultActionItems,
    ChildrenToolItemsMask,
    CreationToolItemsMask,
    toolbarItems,
    ToolbarItemsMasks,
    headermenuItems,
    HeaderMenuItemsMask,
    commandsCollection,
    URL,
    TableRowSelectionToolbarView,
    TableActionBarView,
    ToolbarCommandController,
    DragAndDrop,
    LayoutViewEventsPropagationMixin,
    NodeViewStateMixin,
    MultiNodeFetchMixin,
    NodeSelectionRestoreMixin,
    GlobalMessage,
    ThumbnailView,
    thumbnailColumns,
    ModalAlert,
    DragndropSupportedSubtypes,
    Accessibility,
    NextNodeModelFactory,
    NamedLocalStorage,
    ItemErrorBehavior,
    template,
    nodeExtraData,
    SynchronizedContext) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();
  var enforceDescriptionColumnInA11yMode = Accessibility.shouldEnforceDescriptionColumn();
  var fast = /\bfast\b(?:=([^&]*)?)?/i.exec(location.search);
  fast = fast ? fast[1] !== 'false' : undefined;

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [30, 50, 100],
    showInlineActionBarOnHover: !accessibleTable,
    forceInlineActionBarOnClick: false,
    inlineActionBarStyle: "csui-table-actionbar-bubble",
    clearFilterOnChange: true,
    resetOrderOnChange: false,
    resetLimitOnChange: true,
    fixedFilterOnChange: false,
    showCondensedHeaderToggle: true,
    resetOrderByOnBrowse: true,
    useV2RestApi: false,
    useAppContainer: false,
    isThumbnailEnabled: false,
    enableObjectTypes:false
  });
  if (fast !== undefined) {
    config.useAppContainer = fast;
  }

  var NodesTableView = Marionette.LayoutView.extend({
    className: function () {
      var className = 'csui-nodestable';
      if (accessibleTable) {
        className += ' csui-no-animation';
      }
      return className + " initialLoading";
    },
    template: template,

    ui: {
      facetTableContainer: '.csui-facet-table-container',
      outerTableContainer: '.csui-outertablecontainer',
      innerTableContainer: '.csui-innertablecontainer',
      tableView: '.csui-table-tableview',
      thumbnail: '.csui-thumbnail-wrapper',
      toolbarContainer: '.csui-alternating-toolbars',
      sidePanel: '.csui-side-panel',
      treeView: '.csui-table-treeview',
      facetView: '.csui-table-facetview',
      paginationView: '.csui-table-paginationview'
    },

    regions: {
      facetBarRegion: '.csui-table-facetbarview',
      tableToolbarRegion: '.csui-table-tabletoolbar',
      tableRowSelectionToolbarRegion: '.csui-table-rowselection-toolbar',
      facetRegion: '.csui-table-facetview',
      treeRegion: '.csui-table-treeview',
      tableRegion: '.csui-table-tableview',
      thumbnailRegion: '.cs-thumbnail-wrapper',
      paginationRegion: '.csui-table-paginationview'
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      ItemError: {
        behaviorClass: ItemErrorBehavior,
        model: function () {
          return this.container;
        }
      }
    },

    constants: {
      DEFAULT_SORT: "name asc",
      DEFAULT_SORT_CD: 'order asc' // default sort order on Compound Documents
    },

    is: 'NodesTableView',

    constructor: function NodesTableView(options) {
      this.options = options;

      options || (options = {});
      _.defaults(options, config, {
        data: {},
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        toolbarItems: toolbarItems.clone(),
        headermenuItems: headermenuItems.clone(),
        clearFilterOnChange: config.clearFilterOnChange,
        resetOrderOnChange: config.resetOrderOnChange,
        resetLimitOnChange: config.resetLimitOnChange,
        fixedFilterOnChange: config.fixedFilterOnChange,
        showDescriptions: this.getContainerPrefs('isDescriptionShown'),
        enableDragNDrop: true,
        showSelectionCounter: true,
        resetOrderByOnBrowse: config.resetOrderByOnBrowse,
        urlParamsList: ['order_by', 'page', 'filter']
      });

      this.context = options.context;

      var currentUserId = options.context.getModel(UserModelFactory).get('id');
      if (!currentUserId) {
        var userFactory = options.context.getFactory(UserModelFactory);
        if (userFactory && userFactory.initialResponse) {
          currentUserId = userFactory.initialResponse.data.id;
        }
      }

      this._getConfiguredStartingContainerId = function () {
        return options.data.containerId;
      };

      this._useAppContainer = options.data.containerId ? false : config.useAppContainer;

      var perspectiveContainer = this.options.container || this.context.getModel(NodeModelFactory),
          startingContainerId = this._getConfiguredStartingContainerId() ||
                                perspectiveContainer.get('id');

      this._getStartingContainerId = function () {
        return startingContainerId;
      };

      if (perspectiveContainer && perspectiveContainer.get("persist")) {
        this.namedLocalStorage = new NamedLocalStorage('nodestablePreferences:' + currentUserId);
      }
      if (options.enableViewState !== undefined) {
        this.enableViewState = options.enableViewState;
      } else {
        this.enableViewState = true;
      }
      if (this.options.data && this.options.data.containerId &&
          (this.options.data.containerId !== this.context.getModel(NodeModelFactory).get('id'))) {
        this.enableViewState = false;
      }

      if (this.enableViewState) {
        this._addUrlParametersSupport(options.context);
      }

      var pageSize = options.data.pageSize || options.pageSize,
          pageSizes = options.data.pageSizes || options.ddItemsList;

      if (this.namedLocalStorage && this.namedLocalStorage.get('pageSize') !== undefined) {
        pageSize = this.namedLocalStorage.get('pageSize');
        if (options.data.pageSize) {
          options.data.pageSize = pageSize;
        } else {
          options.pageSize = Math.max(pageSize, config.defaultPageSize);
        }
      }

      if (!_.contains(pageSizes, pageSize)) {
        pageSizes.push(pageSize);
        options.data.pageSizes = pageSizes.sort();
      }

      this.tableColumns = tableColumns.deepClone();

      this.commands = options.commands || commandsCollection;

      this.commandController = new ToolbarCommandController({commands: this.commands});
      this.listenTo(this.commandController, 'before:execute:command', this._beforeExecuteCommand);
      this.listenTo(this.commandController, 'after:execute:command', this._afterExecuteCommand);
      this.listenTo(this.commandController, 'click:toolitem:action', this._toolbarActionTriggered);

      if (!options.connector) {
        options.connector = this.context.getObject(ConnectorFactory);
      }
      this.connector = options.connector;
      var self = this;
 
      this.largeFileSettingsFactory = this.context.getFactory(LargeFileSettingsFactory);
      this.largeFileSettingsModel = this.largeFileSettingsFactory && this.largeFileSettingsFactory.property;
      if(config.enableObjectTypes){
        this.objectTypesFactory = this.context.getFactory(ObjectTypesFactory, {
          permanent: true
        });
      }
      if (!options.toolbarItemsMasks) {
        options.toolbarItemsMasks = new ToolbarItemsMasks();
      }
      if (!options.headermenuItemsMask) {
        options.headermenuItemsMask = new HeaderMenuItemsMask();
      }
      if (_.isEmpty(this.options.data)) {
        var viewStateModel = this.context.viewStateModel;
        this.loadingText = viewStateModel &&
                           viewStateModel.get(viewStateModel.CONSTANTS.BACK_TO_TITLE);
        this.loadingText = _.str.sformat(lang.loadingText, this.loadingText);
      }
      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);

      this.propagateEventsToRegions();

      this.listenTo(this, 'before:regions:reinitialize', this.initialize.bind(this, this.options))
          .listenTo(this, 'dom:refresh', this._refreshRightTableToolbar)
          .listenTo(this, 'enable:blocking', this._rememberFocusInTable)
          .listenTo(this, 'disable:blocking', this._restoreFocusInTable)
          .listenTo(this, 'popover:open', this._popoverOpen);
      this.listenTo(this.collection, 'change', function (model) {
        if (!!model.inlineFormView) {
          this.changedModelIndex = this.collection.indexOf(model);
        }
      });

      this.listenTo(this.collection, 'reset', _.bind(function () {
        var id = this.collection && this.collection.node && this.collection.node.get('id');
        id && this.setSelectionKey(id);
        if (this.paginationView && this.namedLocalStorage) {
          this.paginationView.options.pageSize = this.paginationView.selectedPageSize;
          this.namedLocalStorage.set('pageSize',
              Math.max(this.paginationView.selectedPageSize, config.defaultPageSize));
          if (this.tableView) {
            this.tableView.options.descriptionRowViewOptions.showDescriptions =
                this.options.showDescriptions =
                    !accessibleTable && this.getContainerPrefs('isDescriptionShown');
          }
        }

        if (!this.container || startingContainerId === this.container.get('id')) {
          var orderBy = this.getContainerPrefs('orderBy');
          if (!this.options.isContainerChanged) {
            orderBy = this.collection.orderBy;
          }
          this.options.isContainerChanged = false;
          this.setContainerPrefs({orderBy: orderBy});
        }
      }, this));

      this.listenTo(this.context, 'request', this._resetSortOrderBy);
      this.listenTo(this.context, "sync", function () {
        if (this.container && _.has(this.container.attributes, "type") &&
          _.contains(this.excludeContainerTypes(), this.container.attributes.type)) {
          if (!!this.facetView && !!this.facetView.$el.length) {
            this._hideFacetPanelView();
            this.ui.sidePanel.addClass('csui-sidepanel-hidden');
          }
        }
        else if (this.namedLocalStorage && this.namedLocalStorage.get('isFacetOpen') && !this.showFilter) {
          this._completeFilterCommand();
        }
      });
      this.listenToOnce(this.collection, "sync", function () {
        this.$el.removeClass("initialLoading");
      });
      this.listenTo(this.collection, "sync", function () {
        if (!this.collection.length && !document.activeElement.classList.contains('csui-progresspanel')) {
          $(document.querySelector('.csui-help .csui-acc-tab-region')).trigger('focus');
        }
      });
      this.listenTo(this, 'doc:preview:generic:actions', this._highlightRow);
      this.enableDragNDrop = options.enableDragNDrop;

      this.listenTo(this.collection, 'filter:change', function(filters) {
          filters && filters.facet && filters.facet.length &&
          this._showOrHideLocationColumn(true);
      });

    },
    _highlightRow: function (targetNode, HIGHLIGHT_CLASS_NAME) {
      $('.' + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);

      var rowIndex =  _.findIndex(this.collection.models, function (node) {
        return node.get('id') === targetNode.get("id");
      });
      if (rowIndex !== -1) {
        var view = this.tableView ||
          this.targetView,
          table = view && view.table ? view.table : undefined,
          targetRow = table === undefined ? table : $(table.row(rowIndex).node());

        targetRow && targetRow.addClass(HIGHLIGHT_CLASS_NAME);
      }
    },
    
    initialize: function (options) {
      function updateToolbarItemsMasks() {
        _.each(this.options.toolbarItemsMasks.toolbars, function (mask, key) {
          mask.restoreAndResetMask(this.options.childrenToolItemsMask);
        }, this);
      }
      var defaultActionCommands = this.defaultActionController.commands,
          defaultActionItems = this.defaultActionController.actionItems;

      if (this.options.container) {
        this.container = this.options.container;
      } else if (this._getConfiguredStartingContainerId()) {
        this.container = this.context.getModel(NodeModelFactory, {
          node: {
            attributes: {id: this._getConfiguredStartingContainerId()}
          }
        });
      }
      this.trigger('update:model', this.container);

      if (!this.collection) {
        var collectionStateOptions = this.enableViewState ?
                                     this._restoreCollectionOptionsFromViewState() : {};
        this.collection = this.context.getCollection(
            ChildrenCollectionFactory, {
              options: _.defaults({
                commands: this._getCommands(),
                defaultActionCommands: this._useAppContainer ? [] :
                                       defaultActionItems.getAllCommandSignatures(
                                           defaultActionCommands),
                delayRestCommands: true,
                node: this.container
              }, collectionStateOptions),
              attributes: this._getConfiguredStartingContainerId() ?
                  {id: this._getConfiguredStartingContainerId()} :
                          undefined,
              detached: this._useAppContainer,
              useSpecialPaging: this._useAppContainer
            });
        if (this.options.useV2RestApi) {
          this.collection.setFields(nodeExtraData.getModelFields());
        }
        var expands = nodeExtraData.getModelExpand();
        if (!this.options.useV2RestApi) {
          expands = v1tov2.expandsV2toV1(expands);
        }
        this.collection.setExpand(expands);
      }
      if (this._getConfiguredStartingContainerId() && !this.collection.node.get('id')) {
        this.collection.node.set('id', this._getConfiguredStartingContainerId());
      }

      this.initSelectionMixin(options, this.collection, this._getConfiguredStartingContainerId() ||
                                                        (this.collection && this.collection.node && this.collection.node.get('id')));

      var viewStateModel = this.context.viewStateModel;
      this.listenTo(this.collection, 'filter:clear', this._collectionFilterChanged)
          .listenTo(viewStateModel, 'change:state', this.onViewStateChanged)
          .listenTo(this.collection, 'paging:change', this._pagingChanged)
          .listenTo(this.collection, 'limits:change', this._pagingChanged)
          .listenTo(this.collection, 'orderBy:change', this._orderByChanged)
          .listenTo(this.collection, 'orderBy:clear', this._orderByChanged);


      if (this.collection.node) {
        this.listenTo(this.collection.node, 'change:id', function () {
          this.clearAllSelectedNodes();
          if (this.thumbnailViewState !== this.getContainerPrefs('isThumbnailEnabled')) {
            this.thumbnailViewState = this.getContainerPrefs('isThumbnailEnabled');
            this.enableThumbnailView();
          }
        });
      }

      var nextNode = this.context.getModel(NextNodeModelFactory);
      this.listenTo(this.context, 'retain:perspective', function () {
        this.retainPerspectiveCalled = true;
        if (this.options.data.viewState) {
          this.collection.node.set('id', nextNode.get('id'));
          this.collection.resetLimit(false);
        } else {
          this.onViewStateChanged();
        }
      });

      this.listenTo(nextNode, 'before:change:id', function () {
        this.options.isContainerChanged = true;
        this.removeOrderBy();
      });

      if (!this.container) { // if not created before when this.collection was undefined
        this.container = options.container || this.collection.node;
      }
      if (this.collection.delayedActions) {
        this.listenTo(this.collection.delayedActions, 'error',
            function (collection, request, options) {
              var error = new base.Error(request);
              GlobalMessage.showMessage('error', error.message);
            });
      }
      this.columns = options.columns ||
                     this.context.getCollection(ColumnCollectionFactory, {
                       options: {
                         node: this.container
                       },
                       attributes: this._getConfiguredStartingContainerId() ?
                           {id: this._getConfiguredStartingContainerId()} :
                                   undefined
                     });
      this.addableTypes = options.addableTypes ||
                          this.context.getCollection(AddableTypeCollectionFactory, {
                            options: {
                              node: this.container
                            },
                            attributes: this._getConfiguredStartingContainerId() ?
                                {id: this._getConfiguredStartingContainerId()} :
                                        undefined,
                            detached: this._useAppContainer
                          });

      var initialFacetFilter = this.collection.filters && this.collection.filters.facet ?
                               this.collection.filters.facet : undefined;

      if (!_.isEmpty(initialFacetFilter)) {
        this.showFacetPanelOnLoad = true;
      }
      this.facetFilters = options.facetFilters ||
                          this.context.getCollection(
                              Facet2CollectionFactory, {
                                options: {
                                  node: this.container,
                                  filters: initialFacetFilter,
                                  itemsToShow: 5  // by design and PM decision, show 5 items first
                                },
                                attributes: this._getConfiguredStartingContainerId() ?
                                    {id: this._getConfiguredStartingContainerId()} : undefined,
                                detached: true
                              });
      if (this.getContainerPrefs('orderBy') !== undefined) {
        this.options.orderBy = this.getContainerPrefs('orderBy');
      }

      if (this._useAppContainer) {
        var acOptions = {
          models: {
            container: this.container,
            addableTypes: this.addableTypes,
            children: this.collection
          },
          attributes: this._getConfiguredStartingContainerId() ?
              {id: this._getConfiguredStartingContainerId()} : undefined
        };

        this.context.getObject(AppContainerFactory, acOptions);
      }

      if (this.container) {
        if (!this.options.childrenToolItemsMask) {
          this.options.childrenToolItemsMask = new ChildrenToolItemsMask({
            context: this.context,
            node: this.container
          });
        }
        updateToolbarItemsMasks.call(this);
        this.listenTo(this.options.childrenToolItemsMask, 'update', updateToolbarItemsMasks);
        if (!this.options.creationToolItemsMask) {
          this.options.creationToolItemsMask = new CreationToolItemsMask({
            context: this.context,
            node: this.container
          });
        }
        this._lastContainerId = this.container.get('id');
        this.listenTo(this.context, 'request', function () {
          var currentContainerId = this.container.get('id');
          if (currentContainerId !== this._lastContainerId) {
            this._lastContainerId = currentContainerId;
            this._changingContainer();
          }
        });
        this.listenTo(this.container, 'change:id', function () {
          var currentContainerId = this.container.get('id');
          if (currentContainerId !== this._lastContainerId) {
            this._lastContainerId = currentContainerId;
            this._changingContainer();
          }
          else{
            this._showOrHideLocationColumn();
          }
        });
        if (this.collection.filters && this.collection.filters.facet) {
          this._showOrHideLocationColumn(true);
        } else {
          this._showOrHideLocationColumn();
        }
      }
      this._setFacetBarView();
      this._setToolBar();
      this.setTableView({
        enableDragNDrop: this.options.enableDragNDrop
      });

      this.thumbnailViewState = this.getContainerPrefs('isThumbnailEnabled');

      this._setTableRowSelectionToolbarEventListeners();
      this.setPagination();
      this.dragNDrop = this.enableDragNDrop && this.setDragNDrop();

      this._updateZeroRecordsMessage();

      try {
        this._synchronizedContextForFacets = new SynchronizedContext(this.context,
            [this.collection, this.facetFilters],
            {triggerEventsOnSourceContext: true}
        );
        this.listenTo(this._synchronizedContextForFacets, 'before:models:reset', function () {
          this._showOrHideLocationColumn(this.facetFilters.getFilterQueryValue().length > 0);
        });
      } catch (ex) {
        log.warn('Either this.collection or this.facetFilters does not support synchronized' +
                 ' context - falling back to non synchronized UI update when applying facets') &&
        console.warn(log.last);
      }
    },

    isAppContainerUsed: function () {
      return this._useAppContainer;
    },
    findNodeFromCollection: function (collection, node) {
      return collection.get(node) || collection.findWhere({id: node.get('id')});
    },

    onRemoveItemFromAllSelectedItems: function (node) {
      if (this.thumbnailViewState && this.getAllSelectedNodes().length === 0) {
        this.thumbnail.$el.find(".csui-thumbnail-select").removeClass('csui-checkbox');
        this.thumbnail.thumbnailHeaderView.trigger('selectOrUnselect.mixed');
      }
    },

    onResetAllSelectedItems: function () {
      if (this.thumbnailViewState && this.getAllSelectedNodes().length === 0) {
        this.thumbnail.$el.find(".csui-thumbnail-select").removeClass('csui-checkbox');
        this.thumbnail.thumbnailHeaderView.trigger('selectOrUnselect.mixed');
        this.thumbnail.thumbnailHeaderView.$el.find('.csui-thumbnail-select .csui-control').length && this.thumbnail.thumbnailHeaderView.$el.find('.csui-thumbnail-select .csui-control').trigger('focus');
      }
    },

    _setThumbnailView: function (options) {
      if (!this.tableView.allColumns) {
        this.tableView._getColumns();
      }
      this.collection.orderBy = this.getContainerPrefs('orderBy') || this.collection.orderBy ||
                                this.options.orderBy || this.constants.DEFAULT_SORT;
      options || (options = {});
      var args = _.defaults({
        originatingView: this,
        context: this.context,
        collection: this.collection,
        columns: this.columns,
        thumbnailColumns: this.tableView.columns,
        columnsWithSearch: ["name"],
        orderBy: this.collection.orderBy,
        filterBy: this.options.filterBy,
        selectedChildren: new NodeCollection(),
        actionItems: this.defaultActionController.actionItems,
        commands: this.defaultActionController.commands,
        tableColumns: thumbnailColumns,
        inlineBar: this.tableView.options.inlineBar,
        blockingParentView: this.options.blockingParentView || this,
        displayedColumns: this.tableView.displayedColumns,
        allColumns: this.tableView.allColumns,
        allSelectedNodes: this.getAllSelectedNodes(),
        enableViewState: this.enableViewState
      }, options);
      this.thumbnail = new ThumbnailView(args);
      this.listenTo(this.thumbnail, 'execute:defaultAction', function (node) {
        var args = {node: node};
        this.trigger('before:defaultAction', args);
        if (!args.cancel) {
          var self = this;
          this.defaultActionController
              .executeAction(node, {
                context: this.options.context,
                originatingView: this,
                fullView: !!this.thumbnailView
              })
              .done(function () {
                self.trigger('executed:defaultAction', args);
              });
        }
      });
      this.enableDragNDrop &&
      this.thumbnail.listenTo(this.thumbnail, 'thumbnailItemRendered', _.bind(function (itemView) {
        if (!itemView.target.isEventSet && itemView.node && itemView.node.get('id')) {
          var itemdragNDrop = this.setDragNDrop(itemView);
          this._assignDragArea(itemdragNDrop, $(itemView.target));
          itemView.target.isEventSet = true;
        }
      }, this));
      this.listenTo(this.thumbnail, 'thumbnailSelected', function (args) {
        this.addNodesToSelection(args.nodes);
      });

      this.listenTo(this.thumbnail, 'thumbnailUnSelected', function (args) {
        this.options.showSelectionCounter && this.removeNodesFromSelection(args.nodes);
      });
      this.listenTo(this, "properties:view:destroyed", this.thumbnail.closeInlineForm);
      this.listenTo(this, "permissions:view:destroyed", this.thumbnail.closeInlineForm);
      return true;
    },

    enableThumbnailView: function () {
      var tableView = this.tableView,
          self = this,
          deferred = $.Deferred(),
          container = this.container,
          context = this.context,
          originatingView = this.originatingView;
      if (this.dragNDrop) {
        this.dragNDrop.stopListeningDragEvent(".csui-innertablecontainer", this);
        this.dragNDrop.stopListeningDragEvent(".csui-alternating-toolbars", this);
      }
      if (this.thumbnailViewState) {
        if (this.tableView.selectedChildren && this.tableView.selectedChildren.models.length > 0) {
          this.tableView.selectedChildren.models = [];
        }
        this._onSelectionUpdateCssClasses(this.getAllSelectedNodes().length, true);
        this._setThumbnailView(this.options);
      } else {
        this._onSelectionUpdateCssClasses(this.getAllSelectedNodes().length, true);
      }
      if (this.tableView.options.inlineBar.options.maxItemsShown !== 1) {
        this.collection.defaultInlineMaxItemsShown = this &&
                                                     this.tableView.options.inlineBar.options.maxItemsShown;
      }
      if (this.thumbnailViewState) {
        this.tableView.options.inlineBar.options.maxItemsShown = 1;
        this.$el.find('table.dataTable').addClass("csui-thumbnail-view");
        this.thumbnailView = true;
      } else {
        this.thumbnailView = false;
        this.tableView.options.inlineBar.options.maxItemsShown = this.collection.defaultInlineMaxItemsShown;
        this.$el.find('table.dataTable').removeClass("csui-thumbnail-view");
      }
      this.previewInFullMode = this.thumbnailView;

      this._saveThumbnailViewState();
      var _showOriginatingView, $csThumbnail;
      var $originatingView = this.$el.find(".csui-table-tableview");
      $csThumbnail = $(this.thumbnailRegion.el)[0];
      $csThumbnail = $($csThumbnail);
      if (!this.thumbnailViewState) {
        var sortingstate = this.getContainerPrefs('orderBy') || this.collection.orderBy ||
                           this.options.orderBy || this.constants.DEFAULT_SORT;
        this.setViewStateOrderBy([sortingstate], {silent: true});
        sortingstate = this._formatOrderBy(sortingstate);
        var listArrowState = sortingstate;
        this.thumbnail && this.thumbnail.destroy();
        this.res = listArrowState && listArrowState.split(" ");
        if (this.res && this.res[1] === 'asc') {
          this.collection.orderstate = 'icon-sortArrowDown';
        } else {
          if (this.res && this.res[1] === 'desc') {
            this.collection.orderstate = 'icon-sortArrowUp';
          }
        }
        this.setTableView({
          enableDragNDrop: this.options.enableDragNDrop
        });
        this._refreshRightTableToolbar();
        this._refreshTableRowSelectionToolbar();
        this.tableToolbarView.rightToolbarView &&
        this.tableToolbarView.rightToolbarView.collection.refilter();
        if (this.tableView.collection && this.tableView.collection.length === 0 &&
            this.collection.fetched) {
          this.tableView._showEmptyViewText = true;
        }
        this._updateZeroRecordsMessage();
        this.tableRegion.show(this.tableView);
        if (this.enableDragNDrop) {
          this.setDragNDrop();
          if (this.csuiDropMessage) {
            this.csuiDropMessage.remove();
            this.csuiDropMessage = undefined;
          }
          this._assignDragArea(this.dragNDrop, '.csui-innertablecontainer');
          this._assignDragArea(this.dragNDrop, '.csui-alternating-toolbars');
        }
        $originatingView.show();
        self.tableView.triggerMethod('dom:refresh');
      } else {
        var gridArrowState = this.getContainerPrefs('orderBy') || this.collection.orderBy ||
                             this.options.orderBy || this.constants.DEFAULT_SORT;
        this.setViewStateOrderBy([gridArrowState], {silent: true});
        this.tableView.destroy();
        if (gridArrowState) {
          this.res = gridArrowState.split(" ");
          if (this.res[1] === 'asc') {
            this.collection.orderstate = 'icon-sortArrowUp';
          } else if (this.res[1] === 'desc') {
            this.collection.orderstate = 'icon-sortArrowDown';
          }
        }
        this.thumbnailRegion.show(this.thumbnail);
        if (this.enableDragNDrop) {
          this.setDragNDrop();
          if (this.csuiDropMessage) {
            this.csuiDropMessage.remove();
            this.csuiDropMessage = undefined;
          }
          this._assignDragArea(this.dragNDrop, '.csui-innertablecontainer');
          this._assignDragArea(this.dragNDrop, '.csui-alternating-toolbars');
        }
        this._refreshRightTableToolbar();
        this._refreshTableRowSelectionToolbar();
        var isUpdated = this.thumbnail._maintainNodeState(this.collection.at(0));
        if (!isUpdated && !!this.changedModelIndex) {
          this.thumbnail._maintainNodeState(this.collection.at(this.changedModelIndex));
        }
        Marionette.triggerMethodOn(this.thumbnail, 'before:show');
        if (this.collection && this.collection.models &&
            this.collection.models.length >= 0) {
          if ($csThumbnail.length === 0) {
            $csThumbnail = $($(this.thumbnailRegion.el)[0]);
            Marionette.triggerMethodOn(this.thumbnail, 'before:show');
            $csThumbnail.append(this.thumbnail.el);
            $originatingView.hide();
            $csThumbnail.show();
            Marionette.triggerMethodOn(self.thumbnail, 'show');
          } else {
            $originatingView.hide();
            $csThumbnail.show();
            self.thumbnail.resultsView.triggerMethod('show');
            if (self.thumbnail.$el.is(':visible')) {
              self.thumbnail.trigger('dom:refresh');
            }
            self.thumbnail.onAfterShow();
          }
        }
      }
      if (this.thumbnail) {
        this.listenTo(this.thumbnail.thumbnailHeaderView, 'selectOrUnselect.all',
            _.bind(function (isSelectAll) {
              var allSelectedNodes = this.getAllSelectedNodes(),
                  nodes = this.thumbnail.collection.models;
              if (isSelectAll) {
                var selectedNodes = this.thumbnail.collection.models,
                    selectedModels = [];
                _.each(nodes, function (node) {
                  if (!allSelectedNodes.get(node) && node.get('id') !== undefined) {
                    selectedModels.push(node);
                  }
                }, this);
                allSelectedNodes.reset(selectedModels.concat(allSelectedNodes.models));
              } else if (isSelectAll != null && !isSelectAll) {
                _.each(nodes, function (node) {
                  allSelectedNodes.remove(node, {silent: true});
                }, this);
                allSelectedNodes.reset(_.clone(allSelectedNodes.models));
              }
            }, this));
      }
    },

    _saveThumbnailViewState: function () {
      var viewStateModel = this.context.viewStateModel;
      viewStateModel && viewStateModel.setSessionViewState('thumbnailView', this.thumbnailView);
    },

    onDestroy: function () {
      $(window).off("resize.app", this.onWinRefresh);

      this._destroyRowsDragAndDropViews();
      if (this.dragNDrop) {
        this.dragNDrop.destroy();
        this.dragNDrop = undefined;
      }
    },

    windowRefresh: function () {
      if (this._isRendered && this.isDisplayed) {
        this.facetView && this.facetView.triggerMethod('dom:refresh');
      }
    },

    _getCommands: function () {
      function getSignatures(toolItems) {
        var sigArray = [];
        _.mapObject(toolItems, function (val, key) {
          sigArray = _.union(sigArray, _.without(val.collection.pluck('signature'), 'disabled'));
        });
        return sigArray;
      }
      var signatures = _.union(
          ['Add', 'EditPermission'],  // special dropdown toolbar signature and Edit permission of node
          _.without(defaultActionItems.pluck('signature'), 'Disabled'),
          getSignatures.call(this, this.options.headermenuItems),
          getSignatures.call(this, this.options.toolbarItems));
      var commands = commandsCollection.clone();
      var commandsToRemove = [];
      commands.each(function (command) {
        if (signatures.indexOf(command.get('signature')) === -1) {
          commandsToRemove.push(command);
        }
      });
      commands.remove(commandsToRemove, {silent: true});

      return commands;
    },

    _refreshRightTableToolbar: function () {
      var rightToolbar = this.tableToolbarView && this.tableToolbarView.rightToolbarView;
      if (rightToolbar) {
        rightToolbar.collection.updateStatus({thumbnailViewState: this.thumbnailViewState});
        rightToolbar.collection.refilter();
      }
    },
    _refreshTableRowSelectionToolbar: function () {
      var tableRowSelectionToolbar = this._tableRowSelectionToolbarView ?
                                     this._tableRowSelectionToolbarView._toolbarView : undefined;
      if (tableRowSelectionToolbar && tableRowSelectionToolbar.collection &&
          this.getAllSelectedNodes().length === 1 &&
          this.commandController.commands.get('DocPreview')) {
        this._tableRowSelectionToolbarView._toolbarView.collection.refilter();
      }
    },

    onRender: function () {
      this.$el.attr({'role': 'region', 'aria-label': this._getTableAria()});

      if (this.facetBarView) {
        this.facetBarRegion.show(this.facetBarView);
      }
      this.tableToolbarRegion.show(this.tableToolbarView);

      if (this.showFacetPanelOnLoad) {
        this._showFacetPanelView();
      }
      var viewStateModel = this.context.viewStateModel;
      if (this.thumbnailViewState || (viewStateModel &&
                                      viewStateModel.getSessionViewState('thumbnailView'))) {
        this.previewInFullMode = true;
        this.enableThumbnailView();
      } else {
        this.previewInFullMode = false;
        this.tableRegion.show(this.tableView);
        this._assignDragArea(this.dragNDrop, '.csui-innertablecontainer');
        this._assignDragArea(this.dragNDrop, '.csui-alternating-toolbars');
      }
      this.paginationRegion.show(this.paginationView);

      this.listenTo(this, 'csui.description.toggled', function (args) {
        this.tableView.showDetailRowDescriptions(args.showDescriptions);
        this.tableView.trigger('update:scrollbar');
      });
    },

    _resetSortOrderBy: function () {
      var container = this.options.container || this.context.getModel(NodeModelFactory);
      if (!this.container || container.get('id') === this.container.get('id')) {

        this.options.orderBy = this.getContainerPrefs('orderBy');
        if (this.options.orderBy && this.options.orderBy.length) {
          this.collection.setOrder(this.options.orderBy, false);
        } else {
          if (this.getViewStateOrderBy() &&
              this.getDefaultViewStateOrderBy() !== this.getViewStateOrderBy()) {
            return;
          }
          this.collection.resetOrder(false);
        }
      }
    },

    onShow: function () {
      _.each(this.regionManager._regions, function (region) {
        if (region.currentView) {
          region.currentView.triggerMethod('show');
        }
      });
    },

    onAfterShow: function () {
      _.each(this.regionManager._regions, function (region) {
        if (region.currentView) {
          region.currentView.triggerMethod('after:show');
        }
      });
    },

    getSelectedNodes: function () {
      return new NodeCollection(this.tableView.getSelectedChildren());
    },

    setActionBarEvents: function () {
      log.warn('The method \'setActionBarEvents\' has been deprecated and will be removed.') &&
      console.warn(log.last);
    },

    _updateToolItems: function () {
      log.warn('The method \'_updateToolItems\' has been deprecated and will be removed.') &&
      console.warn(log.last);
    },
    setDragNDrop: function (row) {
      var rowNode = row && row.node,
          isSupportedRowView = isSupportedRowNode(rowNode),
          context = this.options.context,
          viewOrHTMLElement = isSupportedRowView ? row.target : this,
          target = isSupportedRowView ? rowNode : this.container,
          addableTypes = rowNode ? undefined : this.addableTypes,
          highlightedTarget = isSupportedRowView ? viewOrHTMLElement : '.csui-innertablecontainer';

      var dragNDropView = new DragAndDrop({
        container: target,
        collection: this.collection,
        addableTypes: addableTypes,
        context: context,
        highlightedTarget: highlightedTarget,
        originatingView: this,
        isSupportedRowView: isSupportedRowView

      });

      var self = this;
      function dragNDropViewDestroyed() {
        self.stopListening(dragNDropView, "destroy", dragNDropViewDestroyed);
        self.stopListening(dragNDropView, 'drag:over', self._addDragDropBorder);
        self.stopListening(dragNDropView, 'drag:leave', self._removeDragDropBorder);
      }

      this.listenTo(dragNDropView, "destroy", dragNDropViewDestroyed);

      this.listenTo(dragNDropView, 'drag:over', this._addDragDropBorder);
      this.listenTo(dragNDropView, 'drag:leave', this._removeDragDropBorder);
      if (this.container) {
        this.listenTo(this.container, 'change:id', this._updateZeroRecordsMessage);
        this.listenTo(this.addableTypes, 'reset', this._updateZeroRecordsMessage);
      }

      function isDragNDropSuppoertedRow(rowNode) {
        return $.inArray(rowNode.get('type'), DragndropSupportedSubtypes) !== -1;
      }

      function isSupportedRowNode(rowNode) {
        if (rowNode && rowNode.get('type') && rowNode.get('type') === 144) {
          if (base.isSafari() || base.isIE11()) {
            return false;
          }
        }
        return rowNode && rowNode.get('id') && isDragNDropSuppoertedRow(rowNode);
      }

      return dragNDropView;
    },

    _updateZeroRecordsMessage: function () {
      var canAddItemsToContainer = this.canAddItems(),
          addItemsPermissions = this.addItemsPermissions();
      this.tableView.canAddItemsToContainer = canAddItemsToContainer;
      this.tableView.addItemsPermissions = addItemsPermissions;

      this.tableView.setCustomLabels({
        zeroRecords: !!canAddItemsToContainer && !!addItemsPermissions && lang.dragAndDropMessage
      });
    },

    addItemsPermissions: function () {
      return this.dragNDrop && this.dragNDrop.canAdd();
    },

    canAddItems: function () {
      return (DragndropSupportedSubtypes.indexOf(this.container.get('type')) !== -1);
    },

    _assignDragArea: function (draganddropView, currentEl) {
      if (draganddropView) {
        draganddropView.setDragParentView(this, currentEl);
      }
    },

    _addDragDropBorder: function (view, options) {
      var disableMethod = options && options.disabled ? 'addClass' : 'removeClass',
          highlightedTarget = '.csui-innertablecontainer';
      highlightedTarget = options && options.highlightedTarget ? options.highlightedTarget :
                          highlightedTarget;
      $(highlightedTarget).addClass('drag-over')[disableMethod]('csui-disabled');
    },

    _removeDragDropBorder: function (options) {
      var highlightedTarget = '.csui-innertablecontainer';
      options && options.highlightedTarget && options.valid ?
      $(options.highlightedTarget).removeClass('drag-over') :
      $(highlightedTarget).removeClass('drag-over');
    },

    setTableView: function (options) {
      options || (options = {});

      var viewStateModel = this.options.context.viewStateModel,
      constants = viewStateModel.CONSTANTS,
      query_string_params = viewStateModel.get(constants.QUERY_STRING_PARAMS);
      this.collection.orderBy = (!!query_string_params ? this.collection.orderBy : this.getContainerPrefs('orderBy')) ||
                                this.options.orderBy || this.constants.DEFAULT_SORT;
      this.collection.orderBy &&
      this.enableViewState && this.setViewStateOrderBy([this.collection.orderBy], {default: true});

      var args = _.extend({
        context: this.options.context,
        connector: this.connector,
        collection: this.collection,
        columns: this.columns,
        tableAria: this._getTableAria(),
        tableColumns: this.tableColumns,
        descriptionRowView: DescriptionRowView,
        descriptionRowViewOptions: {
          firstColumnIndex: 2,
          lastColumnIndex: 2,
          showDescriptions: !accessibleTable && this.options.showDescriptions,
          collapsedHeightIsOneLine: true,
          displayInEntireRow: true
        },
        enforceDescriptionColumnInAccessibleMode: enforceDescriptionColumnInA11yMode,
        pageSize: Math.max(this.options.data.pageSize || this.options.pageSize,
            config.defaultPageSize),
        originatingView: this,
        columnsWithSearch: ["name"],
        orderBy: this.collection.orderBy,
        filterBy: this.options.filterBy,
        actionItems: this.defaultActionController.actionItems,
        commands: this.defaultActionController.commands,
        blockingParentView: this.options.blockingParentView || this,
        parentView: this,
        focusView: 'tableHeader',
        showSelectionCounter: this.options.showSelectionCounter,
        inlineBar: {
          viewClass: TableActionBarView,
          options: _.extend({
            collection: this.options.toolbarItems.inlineActionbar,
            toolItemsMask: this.options.toolbarItemsMasks.toolbars.inlineActionbar,
            delayedActions: this.collection.delayedActions,
            container: this.container,
            containerCollection: this.collection
          }, this.options.toolbarItems.inlineActionbar.options, {
            inlineBarStyle: this.options.inlineActionBarStyle,
            forceInlineBarOnClick: this.options.forceInlineActionBarOnClick,
            showInlineBarOnHover: this.options.showInlineActionBarOnHover
          })
        },
        allSelectedNodes: this.getAllSelectedNodes(),
        enableViewState: this.enableViewState
      }, options);
      var $csThumbnail = this.thumbnailRegion && this.thumbnailRegion.el &&
                         $(this.thumbnailRegion.el)[0];
      $csThumbnail = $($csThumbnail);
      this.tableView = new TableView(args);
      this.listenTo(this.tableView, 'destroyingTable', this.tableDestroyed);
      this._ensureRequestingMetadata();
      this.listenTo(this.tableView, 'render', function () {
        this.tableView.$el.append($('<div>')[0]);
        if (this.tableView.$el.is(':visible')) {
          $csThumbnail.hide();
        }
      });
      this.enableDragNDrop = !!options.enableDragNDrop;

      this.setupTableSelection(this.tableView);
      this._setTableViewEvents();
    },

    tableDestroyed: function () {
      this._destroyRowsDragAndDropViews();
    },

    onTableViewCollectionSync: function () {
      var tableToolbarView = this.tableToolbarView,
          filterToolbarView = tableToolbarView && tableToolbarView.filterToolbarView,
          collection = filterToolbarView && filterToolbarView.collection;
      if (collection) {
        collection.status.thumbnailViewState = this.thumbnailView;
      }
    },

    _getTableAria: function () {
      var containerName = this.collection.node && this.collection.node.get('name');
      if (!containerName) {
        containerName = this.collection.node && this.collection.node.get('id');
      }
      return this.options.tableAria ||
            (containerName ? _.str.sformat(lang.containerContentTableAria, containerName) :
                lang.genericContentTableAria);
    },
    _ensureRequestingMetadata: function () {
      var container = this.container;
      if (container && container.makeFieldsV2) {
        ensureColumnInformation();
        this.listenTo(this.tableView, 'columnDefinitionsBuilt',
            ensureColumnInformation);
      }

      function ensureColumnInformation() {
        container.setFields('columns');
        container.includeResources('metadata');
      }
    },

    _setTableViewEvents: function () {
      this.listenTo(this.tableView, 'tableRowSelected', function (args) {
        this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
        this.options.showSelectionCounter && this.addNodesToSelection(args.nodes);
      });

      this.listenTo(this.tableView, 'tableRowUnselected', function (args) {
        this.options.showSelectionCounter && this.removeNodesFromSelection(args.nodes);
      });

      this.listenTo(this.tableView, 'execute:defaultAction', function (node) {
        var args = {node: node};
        this.trigger('before:defaultAction', args);
        if (!args.cancel) {
          var self = this;
          this.defaultActionController
              .executeAction(node, {
                context: this.options.context,
                originatingView: this
              })
              .done(function () {
                self.trigger('executed:defaultAction', args);
              });
        }
      });

      if (this.enableDragNDrop) {
        this._destroyRowsDragAndDropViews();
        this.listenTo(this.tableView, 'tableRowRendered', function (row) {
          var rowdragNDrop = this.setDragNDrop(row);
          this._rowsDragAndDropViews.push(rowdragNDrop);
          this._assignDragArea(rowdragNDrop, $(row.target));
          this._assignDragArea(rowdragNDrop, row.expandedRows);
        });
      }

      this.listenTo(this.tableView, 'refresh:rightTableToolbar', this._refreshRightTableToolbar);

      return true;
    },

    _destroyRowsDragAndDropViews: function () {
      if (this._rowsDragAndDropViews && this._rowsDragAndDropViews.length > 0) {
        _.forEach(this._rowsDragAndDropViews, function (view) {
          view.destroy();
        }.bind(this));
      }
      this._rowsDragAndDropViews = [];
    },

    _changingContainer: function () {
      var status = {container: this.container};
      var isFilterEnabled = this.commands.get('Filter').enabled(status);
      if (isFilterEnabled && this.facetFilters) {
        if (this.options.clearFilterOnChange) {
          this.facetFilters.clearFilter();
          this.triggerMethod('remove:filter');
        }
        this.facetFilters.invalidateFetch();
        if (this.showFilter) {
          this.facetFilters.ensureFetched();
        }
      }

      var show = false;      
      if (this.collection && this.collection.filters && this.collection.filters.facet) {
        show = true;
      }

      this._showOrHideLocationColumn(show);
      this.tableView.updateCollectionParameters();

      if (this.options.fixedFilterOnChange) {
        this.collection.clearFilter(false);
        this.collection.setFilter(this.options.fixedFilterOnChange, false);
      } else if (this.options.clearFilterOnChange && this.collection.filters && !this.collection.filters.facet) {
        this.collection.clearFilter(false);
      }
      if (this.options.resetOrderOnChange) {
        this.collection.resetOrder(false);
      }
      if (this.options.resetLimitOnChange && !this.retainPerspectiveCalled) {
        this.collection.resetLimit(false);
      }

      this.retainPerspectiveCalled = false;
    },

    _setToolBar: function () {
      this.tableToolbarView = new TableToolbarView({
        context: this.options.context,
        toolbarItems: this.options.toolbarItems,
        toolbarItemsMasks: this.options.toolbarItemsMasks,
        headermenuItems: this.options.headermenuItems,
        headermenuItemsMask: this.options.headermenuItemsMask,
        creationToolItemsMask: this.options.creationToolItemsMask,
        container: this.container,
        collection: this.collection,
        originatingView: this,
        blockingParentView: this.options.blockingParentView || this,
        addableTypes: this.addableTypes,
        toolbarCommandController: this.commandController
      });
      return true;
    },

    setTableRowSelectionToolbar: function (options) {
      this._tableRowSelectionToolbarView = new TableRowSelectionToolbarView({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,
        showCondensedHeaderToggle: options.showCondensedHeaderToggle,
        showSelectionCounter: options.showSelectionCounter,
        commands: this.defaultActionController.commands,
        selectedChildren: this.getAllSelectedNodes(),
        container: this.collection.node,
        context: this.context,
        originatingView: this,
        blockingParentView: this.options.blockingParentView || this,
        collection: this.collection,
        scrollableParent: '.csui-table-tableview .csui-nodetable, .csui-thumbnail-results'
      });
      var toolbarView = this._tableRowSelectionToolbarView;
      this.listenTo(toolbarView, 'toggle:condensed:header', function () {
        if (this.tableToolbarRegion.$el.hasClass('csui-table-rowselection-toolbar-visible')) {
          this.ui.toolbarContainer && this.ui.toolbarContainer.toggleClass('csui-show-header');

          var showingBothToolbars = this.ui.toolbarContainer &&
                                    this.ui.toolbarContainer.hasClass('csui-show-header');
          if (showingBothToolbars) {
            this.tableToolbarRegion.$el.removeClass('binf-hidden');
            this.tableToolbarRegion.currentView.trigger(this.tableToolbarRegion.currentView,
                'dom:refresh');
          }
          toolbarView.trigger('toolbar:activity', true, showingBothToolbars);
        }
      });
    },

    _triggerToolbarActivityEvent: function (toolbarVisible, headerVisible) {
      var toolbarView = this._tableRowSelectionToolbarView;
      toolbarView && toolbarView.trigger('toolbar:activity', toolbarVisible, headerVisible);
    },

    _onSelectionUpdateCssClasses: function (selectionLength, stopTriggerToolbarActivity) {
      var self = this;
      var $rowSelectionToolbarEl = this.tableRowSelectionToolbarRegion.$el;

      function transitionEnd(headerVisible, stopTriggerToolbarActivity) {
        if (stopTriggerToolbarActivity !== true) {
          self._triggerToolbarActivityEvent(self._tableRowSelectionToolbarVisible, headerVisible);
        }
        if (self._tableRowSelectionToolbarVisible) {
          if (!headerVisible) {
            self.tableToolbarRegion.$el.addClass('binf-hidden');
          }
        } else {
          self.tableRowSelectionToolbarRegion.$el.addClass('binf-hidden');
        }
      }

      var headerVisible;
      if (accessibleTable) {
        if (selectionLength > 0) {
          if (!this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = true;
            this.tableToolbarRegion.$el.addClass('csui-table-rowselection-toolbar-visible');
            $rowSelectionToolbarEl.removeClass('binf-hidden');
            $rowSelectionToolbarEl.addClass('csui-table-rowselection-toolbar-visible');
            headerVisible = this.ui.toolbarContainer &&
                            this.ui.toolbarContainer.hasClass('csui-show-header');

            transitionEnd(headerVisible);
          }
        } else {
          if (this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = false;
            this.ui.toolbarContainer && this.ui.toolbarContainer.removeClass('csui-show-header');
            this.tableToolbarRegion.$el.removeClass('binf-hidden');
            this.tableToolbarRegion.currentView.trigger(this.tableToolbarRegion.currentView,
                'dom:refresh');
            this.tableToolbarRegion.$el.removeClass('csui-table-rowselection-toolbar-visible');
            $rowSelectionToolbarEl.removeClass('csui-table-rowselection-toolbar-visible');

            transitionEnd(false, stopTriggerToolbarActivity);
          }
        }
      } else {
        if (selectionLength > 0) {
          if (!this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = true;
            $rowSelectionToolbarEl
                .removeClass('binf-hidden').redraw()
                .one('transitionend', function () {
                  headerVisible = this.ui.toolbarContainer &&
                                  this.ui.toolbarContainer.hasClass('csui-show-header');
                  transitionEnd(headerVisible);
                }.bind(this))
                .addClass('csui-table-rowselection-toolbar-visible');
            this.tableToolbarRegion.$el.addClass('csui-table-rowselection-toolbar-visible');
          }
        } else {
          if (this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = false;
            this.ui.toolbarContainer && this.ui.toolbarContainer.removeClass('csui-show-header');

            this.tableToolbarRegion.$el.removeClass('binf-hidden').redraw();
            this.tableToolbarRegion.currentView.trigger(this.tableToolbarRegion.currentView,
                'dom:refresh');

            $rowSelectionToolbarEl
                .one('transitionend', function () {
                  transitionEnd(false, stopTriggerToolbarActivity);
                }.bind(this))
                .removeClass('csui-table-rowselection-toolbar-visible');
            this.tableToolbarRegion.$el.removeClass('csui-table-rowselection-toolbar-visible');
          }
        }
      }
    },

    _selectionChanged: function () {
      if (this.tableToolbarView && this.tableToolbarView.filterToolbarView) {
        this.tableToolbarView.filterToolbarView.collection.status.thumbnailViewState = this.tableView.thumbnailView;
      }
      var selectedNodes = this.getAllSelectedNodes();
      if (selectedNodes.length > 0) {
        if (!this._tableRowSelectionToolbarView) {
          this._showRowSelectionToolbar();
        }
        this._tableRowSelectionToolbarView.setActive(true);
      } else if (this._tableRowSelectionToolbarView) {
        this._tableRowSelectionToolbarView.setActive(false);
      }
      this._onSelectionUpdateCssClasses(selectedNodes.length);
    },

    _showRowSelectionToolbar: function () {
      this.setTableRowSelectionToolbar({
        toolItemFactory: this.options.toolbarItems.tableHeaderToolbar,
        toolbarItemsMask: this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar,
        showCondensedHeaderToggle: this.options.showCondensedHeaderToggle,
        showSelectionCounter: this.options.showSelectionCounter
      });
      this.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
    },

    _setTableRowSelectionToolbarEventListeners: function () {
      this.listenTo(this.getAllSelectedNodes(), 'reset update', this._selectionChanged);
    },

    _setCommonRowSelectionToolbarEventListeners: function (selectedChildren) {
      this.listenTo(selectedChildren, 'reset', function () {
        this.tableToolbarView.filterToolbarView.collection.status.thumbnailViewState = this.thumbnailView;
        this.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
        this._onSelectionUpdateCssClasses(selectedChildren.length);
      });

    },

    setPagination: function () {
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.getPageSize(),
        pageNumber: this.options.data.pageNumber || this.options.pageNumber,
        defaultDDList: this.options.ddItemsList,
        setPageInfoFromViewState: this.enableViewState && this.setPageInfoFromViewState.bind(this)
      });
      this.listenTo(this.collection, 'add', function () {
        if (this.collection.length > 0 && this.collection.length > this.collection.topCount) {
          var first = this.collection.first();
          if (first.isLocallyCreated && first.get('id') !== undefined) {
            this.collection.isPoped = true;
            this.tableView.setDeletingNodesState(true);
            this.collection.pop();
            this.tableView.setDeletingNodesState(false);
          }
        }
      });
      return true;
    },

    getPageSize: function () {
      return  this.options.data.pageSize || this.options.pageSize;
    },

    _handleFacetBarVisible: function () {
      this.facetBarView.$el.find(".csui-facet-list-bar .csui-facet-item:last a").trigger('focus');
    },

    _handleFacetBarHidden: function () {
    },

    _shouldLocationColumnBeingShown: function (show) {
      var subType = this.container && this.container.get('type');
      return show || (subType && (subType === 899 || subType === 298));
    },

    _addOrRemoveExpandForLocationColumn: function (show) {
      var shouldShow = this._shouldLocationColumnBeingShown(show);
      var expand = {properties: ['parent_id']};
      if (!this.options.useV2RestApi) {
        expand = v1tov2.expandsV2toV1(expand);
      }

      if (shouldShow) {
        this.collection.setExpand(expand);
      } else {
        if (this.options.useV2RestApi) {
          this.collection.resetExpand(expand);
        }
      }
    },

    _showOrHideLocationColumn: function (show) {
      var shouldShow = this._shouldLocationColumnBeingShown(show);
      if (shouldShow) {
        if (!this.tableColumns.get('parent_id')) {
          this.tableColumns.add([
            {
              key: 'parent_id',
              title: lang.columnTitleLocation,
              sequence: 800,
              permanentColumn: false
            }
          ]);
        }
      } else {
        this.tableColumns.remove('parent_id');
      }
    },

    _ensureFacetPanelViewDisplayed: function () {
      if (this.facetView === undefined) {
        this._setFacetPanelView();
        this.facetRegion.show(this.facetView);
      }
    },

    _showTreeView: function () {
      var me = this,
          options = _.extend({
                originatingView: me,
              },
              this.treeData
          );
      if (me.showTree) {
        me.treeView = new NodeTreeView(options);
        me.treeRegion.show(me.treeView);
      }
    },

    _setFacetPanelView: function () {
      this.facetView = new FacetPanelView({
        collection: this.facetFilters,
        blockingParentView: this.options.blockingParentView || this,
        blockingLocal: true,
        originatingView: this
      });
      this.listenTo(this.facetView, 'remove:filter', this._removeFacetFilter)
          .listenTo(this.facetView, 'remove:all', this._removeAll)
          .listenTo(this.facetView, 'apply:filter', this._checkSelectionAndApplyFilter)
          .listenTo(this.facetView, 'apply:all', this._setFacetFilter);
    },

    _removeFacetPanelView: function () {
      !!this.thumbnailViewState ? this.thumbnail._adjustThumbnailWidth() : '';
      this.facetRegion.empty();
      this.facetView = undefined;
    },

    _setFacetBarView: function () {
      this.facetBarView = new FacetBarView({
        collection: this.facetFilters,
        context: this.options.context
      });
      this.listenTo(this.facetBarView, 'remove:filter', this._removeFacetFilter)
          .listenTo(this.facetBarView, 'remove:all', this._removeAll)
          .listenTo(this.facetBarView, 'facet:bar:visible', this._handleFacetBarVisible)
          .listenTo(this.facetBarView, 'facet:bar:hidden', this._handleFacetBarHidden);
    },

    _checkSelectionAndApplyFilter: function (filter) {
      if (this.getAllSelectedNodes().length) {
        ModalAlert.confirmQuestion(
            _.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {})
            .done(_.bind(function () {
              this.clearAllSelectedNodes();
              this._addToFacetFilter(filter);
            }, this));
      } else {
        this._addToFacetFilter(filter);
      }
    },

    _addToFacetFilter: function (filter) {
      var facetValues;
      if (this._synchronizedContextForFacets) {
        this.facetFilters.addFilter(filter, false); // don't fetch
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: facetValues}, {fetch: false});  // don't fetch
        this._addOrRemoveExpandForLocationColumn(true);
        this._synchronizedContextForFacets.fetch();
      } else {
        this.facetFilters.addFilter(filter);
        facetValues = this.facetFilters.getFilterQueryValue();
        this._addOrRemoveExpandForLocationColumn(true);
        this._showOrHideLocationColumn(true);
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: facetValues});
      }
    },

    _setFacetFilter: function (filter) {
      var facetValues;
      if (this._synchronizedContextForFacets) {
        this.facetFilters.setFilter(filter, false);
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: facetValues}, {fetch: false});
        this._addOrRemoveExpandForLocationColumn(true);
        this._synchronizedContextForFacets.fetch();
      } else {
        this.facetFilters.setFilter(filter);
        facetValues = this.facetFilters.getFilterQueryValue();
        this._addOrRemoveExpandForLocationColumn(true);
        this._showOrHideLocationColumn(true);
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: facetValues});
      }
    },

    _removeFacetFilter: function (filter) {
      var facetValues;
      if (this._synchronizedContextForFacets) {
        this.facetFilters.removeFilter(filter, false);
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: facetValues}, {fetch: false});
        this._addOrRemoveExpandForLocationColumn(facetValues.length > 0);
        this._synchronizedContextForFacets.fetch();
      } else {
        this.facetFilters.removeFilter(filter);
        facetValues = this.facetFilters.getFilterQueryValue();
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: facetValues});
        this._addOrRemoveExpandForLocationColumn(facetValues.length > 0);
        this._showOrHideLocationColumn(facetValues.length > 0);
      }
    },

    _removeAll: function () {
      if (this._synchronizedContextForFacets) {
        this._addOrRemoveExpandForLocationColumn(false);
        this.facetFilters.clearFilter(false);
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: []}, {fetch: false});
        this._synchronizedContextForFacets.fetch();
      } else {
        this.facetFilters.clearFilter();
        this.collection.resetLimit(false);
        this.collection.setFilter({facet: []});
        this._addOrRemoveExpandForLocationColumn(false);
        this._showOrHideLocationColumn(false);
      }
    },

    _beforeExecuteCommand: function (toolbarActionContext) {
      var selectedNodes = this.getAllSelectedNodes();
      !!selectedNodes && selectedNodes.each(function (model) {
        model.collection = toolbarActionContext.status.collection;
      });
      if (toolbarActionContext && toolbarActionContext.commandSignature !== "Thumbnail" &&
          !this.thumbnailViewState) {
        this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
      } else if (toolbarActionContext && toolbarActionContext.commandSignature !== "Thumbnail" &&
                 this.thumbnailViewState) {
        this.thumbnail.cancelAnyExistingInlineForm.call(this.thumbnail);
      }
      if (toolbarActionContext.commandSignature === 'Delete' ||
          toolbarActionContext.commandSignature === 'RemoveCollectedItems' ||
          toolbarActionContext.commandSignature === 'Move') {
        this.deletingNodes = true;
        this.tableView.setDeletingNodesState(true);
      }
      if (toolbarActionContext.commandSignature === 'permissions') {
        this.blockActions();
      }
    },
    _toolbarActionTriggered: function (args) {
      switch (args.commandSignature) {
      case 'Filter':
        this.filterToolItemModel = args.toolItem;
        this._completeFilterCommand();
        this.filterToolItemModel.set('stateIsOn', this.showFilter);
        break;
      case 'TreeBrowse':
        this.treeBrowseToolItemModel = args.toolItem;
        this._completeTreeCommand();
        this.treeBrowseToolItemModel.set('stateIsOn', this.showTree);
        break;
      }
    },
    _afterExecuteCommand: function (toolbarActionContext) {
      if (!toolbarActionContext || toolbarActionContext.cancelled) {
        return;
      }
      if (toolbarActionContext.status.forwardToTable) {
        var inlineFormView = inlineFormViewFactory.getInlineFormView(
            toolbarActionContext.addableType);
        if (inlineFormView) {
          if (!toolbarActionContext.newNodes[0].error) {
            if (!this.thumbnailView) {
              this.tableView.startCreateNewModel(toolbarActionContext.newNodes[0], inlineFormView);
            } else {
              this.thumbnail.startCreateNewModel(toolbarActionContext.newNodes[0], inlineFormView);
            }
          }
        }
      }
      if (!!toolbarActionContext.command && !!toolbarActionContext.command.allowCollectionRefetch
          && toolbarActionContext.commandSignature !== 'Delete') {
        this.collection.fetch();
      }

      switch (toolbarActionContext.commandSignature) {
      case 'Move':
      case 'RemoveCollectedItems':
      case 'Delete':
        var collectionData = this.collection;
        this.deletingNodes = false;
        this.tableView.setDeletingNodesState(false);
        if (collectionData.skipCount !== 0 && collectionData.totalCount ===
            collectionData.skipCount) {
          this.collection.setLimit(collectionData.skipCount - collectionData.topCount,
              this.collection.topCount, false);
        }
        this.collection.fetch();
        this.clearAllSelectedNodes();
        break;
      case 'MaximizeWidgetView':
        this.tableToolbarView.rightToolbarView.collection.refilter();
        break;
      case 'RestoreWidgetViewSize':
        this.tableToolbarView.rightToolbarView.collection.refilter();
        break;
      case 'Thumbnail':
        this.thumbnailViewState = !this.thumbnailViewState;
        this.setContainerPrefs({isThumbnailEnabled: this.thumbnailViewState});
        this.enableThumbnailView();
        break;
      case 'ToggleDescription':
        this.setContainerPrefs(
            {'isDescriptionShown': !this.getContainerPrefs('isDescriptionShown')});
        break;
      }
    },

    _transitionEnd: _.once(
        function () {
          var transitions = {
                transition: 'transitionend',
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend'
              },
              element = document.createElement('div'),
              transition;
          for (transition in transitions) {
            if (typeof element.style[transition] !== 'undefined') {
              return transitions[transition];
            }
          }
        }
    ),

    _completeFilterCommand: function () {
      this.showFilter = !this.showFilter;
      this.showTree && this._hideTreePanelView();
      this.namedLocalStorage && this.namedLocalStorage.set('isFacetOpen', this.showFilter);
      if (this.showFilter) {
        this._showFacetPanelView();
        if (i18n.settings.rtl) {
          this.ui.sidePanel.one(this._transitionEnd(),
              function () {
                this.triggerMethod('dom:refresh');
              }.bind(this)).removeClass('csui-sidepanel-hidden');
        } else {
          this.ui.sidePanel.removeClass('csui-sidepanel-hidden');
        }
      } else {
        this._hideFacetPanelView();
        this.ui.sidePanel.addClass('csui-sidepanel-hidden');
      }
    },

    _completeTreeCommand: function () {
      this.showTree = !this.showTree;
      this.showFilter && this._hideFacetPanelView();
      if (this.showTree) {
        this._showTreePanelView();
        this.ui.sidePanel.removeClass('csui-sidepanel-hidden');
      } else {
        this._hideTreePanelView();
        this.ui.sidePanel.addClass('csui-sidepanel-hidden');
      }
    },

    _showTreePanelView: function () {
      this.showTree = true;
      if (this.treeView === undefined) {
        this._showTreeView();
      }
      if (this.treeBrowseToolItemModel) {
        this.treeBrowseToolItemModel.set('toolItemAriaExpand', true);
        this.treeBrowseToolItemModel.set('title', lang.treeBrowseCollapseTooltip);
      }
      this.ui.sidePanel.removeClass('csui-sidepanel-hidden');
      this.ui.treeView.removeClass('csui-treeview-visibility');
      if (accessibleTable) {
        this.ui.treeView.removeClass('csui-treeview-hidden');
        this.triggerMethod('dom:refresh');
      } else {
        this.ui.treeView.one(this._transitionEnd(),
            function () {
              this.triggerMethod('dom:refresh');
              !!this.thumbnailViewState ? this.thumbnail._adjustThumbnailWidth() : '';
            }.bind(this)).removeClass('csui-treeview-hidden');
      }

      var self = this;
      if (this.treeResizeViewState && this.treeResizeViewState.style) {
        this.ui.sidePanel.attr('style', this.treeResizeViewState.style);
      }
      this.ui.sidePanel.resizable({
        'minWidth': 248,
        'maxWidth': "50%",
        handles: i18n.settings.rtl ? 'w' : 'e',
        start: function (/*event, ui*/) {
          self.ui.sidePanel[0].classList.add('csui-node-tree-no-transition');
        },
        stop: function (/*event, ui*/) {
          self.ui.sidePanel[0].classList.remove('csui-node-tree-no-transition');
          self.triggerMethod('dom:refresh');
        }
      });
    },

    _postTreePanelHide: function () {
      this.treeResizeViewState = {'style': this.ui.sidePanel.attr('style')};
      this.ui.sidePanel.removeAttr('style');
      this.ui.sidePanel.resizable('destroy');
    },

    _hideTreePanelView: function () {

      this._postTreePanelHide();
      this.showTree = false;
      !this.showTree && !this.showFilter && this.ui.sidePanel.addClass('csui-sidepanel-hidden');
      if (this.treeBrowseToolItemModel) {
        this.treeBrowseToolItemModel.set('toolItemAriaExpand', false);
        this.treeBrowseToolItemModel.set('title', lang.treeBrowseExpandTooltip);
        this.treeBrowseToolItemModel.set('stateIsOn', this.showTree);
      }
      if (accessibleTable) {
        this.ui.treeView.addClass('csui-treeview-hidden');
        this.triggerMethod('dom:refresh');
        this.ui.treeView.hasClass('csui-treeview-hidden') &&
        this.ui.treeView.addClass('csui-treeview-visibility');
      } else {
        this.ui.treeView.one(this._transitionEnd(),
            function () {
              this.triggerMethod('dom:refresh');
              this.ui.treeView.hasClass('csui-treeview-hidden') &&
              this.ui.treeView.addClass('csui-treeview-visibility');
            }.bind(this)).addClass('csui-treeview-hidden');
      }
    },

    excludeContainerTypes: function () {
      var notSupportedObjects = [136, 298];
      if (this.container.attributes.type === 899 && !this.collection.length) {
        notSupportedObjects.push(899);
      }
      return notSupportedObjects;
    },

    _showFacetPanelView: function () {
      this.showFilter = true;
      this._ensureFacetPanelViewDisplayed();
      this.facetFilters.ensureFetched();
      if (this.filterToolItemModel) {
        this.filterToolItemModel.set('toolItemAriaExpand', true);
        this.filterToolItemModel.set('title', lang.filterCollapseTooltip);
      }
      this.ui.sidePanel.removeClass('csui-sidepanel-hidden');
      this.ui.facetView.removeClass('csui-facetview-visibility');
      if (accessibleTable) {
        this.ui.facetView.removeClass('csui-facetview-hidden');
        this.triggerMethod('dom:refresh');
      } else {
        this.ui.facetView.one(this._transitionEnd(),
          function () {
            this.triggerMethod('dom:refresh');
            if (this.filterToolItemModel && this.filterToolItemModel.get('isKeyEvent')) {
              this.facetView.$el.find('.csui-facet.csui-acc-focusable-active').trigger('focus');
            }
            !!this.thumbnailViewState ? this.thumbnail._adjustThumbnailWidth() : '';
          }.bind(this)).removeClass('csui-facetview-hidden');
      }
      this.listenTo(this.facetView, 'dom:refresh', _.bind(function () {
        $(window).trigger('resize.facetview');
      }, this));
    },

    _hideFacetPanelView: function () {
      this.showFilter = false;
      !this.showTree && !this.showFilter && this.ui.sidePanel.addClass('csui-sidepanel-hidden');
      this.namedLocalStorage && this.namedLocalStorage.set('isFacetOpen', this.showFilter);
      if (this.filterToolItemModel) {
        this.filterToolItemModel.set('toolItemAriaExpand', false);
        this.filterToolItemModel.set('title', lang.filterExpandTooltip);
        this.filterToolItemModel.set('stateIsOn', this.showFilter);
      }
      if (accessibleTable) {
        this.ui.facetView.addClass('csui-facetview-hidden');
        this.triggerMethod('dom:refresh');
        this.ui.facetView.hasClass('csui-facetview-hidden') &&
        this.ui.facetView.addClass('csui-facetview-visibility');
        this._removeFacetPanelView();
      } else {
        this.ui.facetView.one(this._transitionEnd(),
            function () {
              this._removeFacetPanelView();
              this.triggerMethod('dom:refresh');
              this.ui.facetView.hasClass('csui-facetview-hidden') &&
              this.ui.facetView.addClass('csui-facetview-visibility');
            }.bind(this)).addClass('csui-facetview-hidden');
      }
      this.listenTo(this.facetView, 'dom:refresh', _.bind(function () {
        $(window).trigger('resize.facetview');
      }, this));
    },

    _collectionFilterChanged: function () {
      var collectionFilters = this.collection.filters,
          facetFilters = collectionFilters && collectionFilters.facet;
      if (facetFilters && facetFilters.length > 0) {
        this._showFacetPanelView();
      } else if (this.showFilter) {
      }
    },
    _formatFacetFilter: function (filters) {
      if (filters) {
        var collectionFacetFilters = filters.facet;
        if (collectionFacetFilters) {
          return collectionFacetFilters.map(function (entry) {
            var filter = entry.split(':'),
                values = filter[1].split('|');
            values = values.map(function (value) {
              return {id: value};
            });
            return {id: filter[0], values: values};
          });
        }
      }
    },

    setPageInfoFromViewState: function () {
      var pageInfo = this.getViewStatePage() || this.getDefaultViewStatePage();
      if (pageInfo) {
        if (pageInfo.top !== undefined && pageInfo.skip !== undefined &&
            (pageInfo.top !== this.collection.topCount ||
             pageInfo.skip !== this.collection.skipCount)) {
          this.collection.setLimit(pageInfo.skip, pageInfo.top);
        }
      } else {
        this.collection.setLimit(0, this.getPageSize());
      }
    },
    onViewStateChanged: function () {
      if (!this.enableViewState) {
        return;
      }
      var viewStateModel = this.context.viewStateModel,
          filterString = viewStateModel.getViewState('filter', true),
          currentFacetFilters, collectionFilter, facetFilter;

      try {
        collectionFilter = JSON.parse(filterString);
        facetFilter = collectionFilter && collectionFilter.facet ? collectionFilter.facet : [];
        if (JSON.stringify(this.collection.getFilterAsObject()) !== filterString) {
          this.collection.setFilter(collectionFilter, false);
        }
      } catch (e) {
        facetFilter = [];
      }

      if (facetFilter) {
        currentFacetFilters = this.facetFilters && this.facetFilters.filters;
        if (currentFacetFilters && !_.isEqual(currentFacetFilters, facetFilter.facet)) {
          this.facetFilters.setFilter(facetFilter, true);
        }
      }

      this.setPageInfoFromViewState();

      if (!currentFacetFilters && this.facetFilters && this.facetFilters.filters &&
          this.facetFilters.filters.length) {
        this.facetFilters.clearFilter(true);
      }
    },
    _pagingChanged: function () {
      if (this.enableViewState &&
          this.collection.topCount !== undefined && this.collection.skipCount !== undefined) {
        return this.setViewStatePage(this.collection.topCount,
            this.collection.skipCount,
            {default: this.collection.skipCount === 0});
      }
    },

    _orderByChanged: function () {
      var orderBy = this.collection.orderBy;
      if (!!orderBy) {
        this.enableViewState && this.setViewStateOrderBy([orderBy]);
        this.setContainerPrefs({orderBy: orderBy});
      }
    },

    _rememberFocusInTable: function () {
      if (this.tableView.el.contains(document.activeElement)) {
        this._tableFocused = true;
      }
    },

    _restoreFocusInTable: function () {
      if (this._tableFocused) {
        this.tableView.currentlyFocusedElement() &&
        this.tableView.currentlyFocusedElement().trigger('focus');
        this._tableFocused = false;
      }
    },
    _popoverOpen: function () {
      this._tableFocused = false;
    },

    removeOrderBy: function () {
      if (this.options.resetOrderByOnBrowse && !this.thumbnailViewState) {
        if (this.getDefaultViewStateOrderBy() !== this.getViewStateOrderBy()) {
          this.setViewStateOrderBy(undefined, {silent: true});
        }
      }
      this.collection.state = undefined;
    },

    _addUrlParametersSupport: function (context) {
      var viewStateModel = context && context.viewStateModel,
          urlParamsList = this.getUrlParameters();
      this.enableViewState = viewStateModel && urlParamsList &&
                             viewStateModel.addUrlParameters(urlParamsList, context);
    },

    getDefaultUrlParameters: function () {
      return this.options.urlParamsList;
    },

    getUrlParameters: function () {
      return this.getDefaultUrlParameters();
    },

    getContainerPrefs: function (prop) {
      var defaults = {
        isThumbnailEnabled: config.isThumbnailEnabled,
        isDescriptionShown: false,
      };
      if (this.container && this.container.get('type') === 136){
        defaults.orderBy = this.constants.DEFAULT_SORT_CD;
      }
      if (this.namedLocalStorage) {
        var container = this.options.container || this.context.getModel(NodeModelFactory),
            containerId = this._getConfiguredStartingContainerId() || container.get('id');
        var prefs = this.namedLocalStorage.get('container:' + containerId);
        if (prefs) {
          if (prop) {
            return prefs[prop];
          } else {
            return prefs;
          }
        } else {
          return prop ? defaults[prop] : defaults;
        }
      } else {
        if (prop) {
          return defaults[prop];
        } else {
          return defaults;
        }
      }
    },

    setContainerPrefs: function (prefs) {
      var container = this.options.container || this.context.getModel(NodeModelFactory),
          containerId = this._getConfiguredStartingContainerId() || container.get('id');
      if (this.namedLocalStorage && this.container && containerId === this.container.get('id')) {
        this.namedLocalStorage.set('container:' + containerId,
            _.extend(this.getContainerPrefs(), prefs));
      }
    }
  }, {
    useV2RestApi: config.useV2RestApi
  });

  _.extend(NodesTableView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(NodesTableView.prototype, NodeViewStateMixin);
  _.extend(NodesTableView.prototype, MultiNodeFetchMixin);
  _.extend(NodesTableView.prototype, NodeSelectionRestoreMixin);
  NodesTableView.prototype._eventsToPropagateToRegions.push('global.alert.inprogress',
      'global.alert.completed');

  if (NodesTableView.useV2RestApi) {
    ChildrenCollectionFactory = Children2CollectionFactory;
    ColumnCollectionFactory = Column2CollectionFactory;
  }

  return NodesTableView;
});
