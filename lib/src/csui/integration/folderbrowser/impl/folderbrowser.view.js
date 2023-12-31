/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "require", "csui/lib/jquery", "csui/lib/underscore",
  "csui/lib/marionette", "csui/utils/log",
  "csui/utils/contexts/page/page.context", "csui/utils/contexts/factories/connector",
  "csui/utils/contexts/factories/node",
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/children',
  'csui/utils/contexts/factories/children2',
  'csui/models/node/node.model', "csui/utils/connector", "csui/utils/base",
  "csui/utils/contexts/factories/ancestors", "csui/controls/breadcrumbs/breadcrumbs.view",
  "csui/widgets/nodestable/nodestable.view",
  'csui/behaviors/default.action/default.action.behavior',
  "csui/controls/table/table.columns",
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  "hbs!csui/integration/folderbrowser/impl/folderbrowser",
  'csui/controls/iconpreload/icon.preload.view',
  "css!csui/integration/folderbrowser/impl/folderbrowser"
], function (module, _require, $, _, Marionette, log,
    PageContext, ConnectorFactory, NodeModelFactory, NextNodeModelFactory,
    UserModelFactory, ChildrenCollectionFactory, Children2CollectionFactory,
    NodeModel, Connector, base, AncestorCollectionFactory, BreadcrumbsView,
    NodesTableView, DefaultActionBehavior, TableColumnCollection, GlobalMessage,
    LayoutViewEventsPropagationMixin, DefaultActionController, ModalAlert, nodeExtraData,
    template, IconPreloadView) {
  'use strict';

  if (NodesTableView.useV2RestApi) {
    ChildrenCollectionFactory = Children2CollectionFactory;
  }

  var nodeOptions = {
    fields: nodeExtraData.getModelFields(),
    expand: nodeExtraData.getModelExpand(),
    includeResources: ['metadata', 'perspective']
  };

  var FolderBrowserLayout = Marionette.LayoutView.extend({

    className: 'binf-widgets csui-folderbrowser',

    template: template,

    regions: {
      breadcrumbRegion: "#csui-folderbrowser-core div.csui-fb-breadcrumbs",
      nodeTableRegion: '#csui-folderbrowser-core div.csui-fb-nodestable'
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    constructor: function FolderBrowserLayout(options) {
      options || (options = {});
      this.setDefaultOptions(options);

      var connection = options.connection,
          connector  = options.connector,
          context    = options.context || new PageContext({
                factories: {
                  connector: connector ||
                             connection && {connection: connection} ||
                             undefined
                }
              });

      if (!connector) {
        connector = context.getObject(ConnectorFactory);
      }

      this.context = context;
      this.connector = connector;
      if (options.context == null) {
        _.extend(options, {context: this.context});
      }

      Marionette.LayoutView.prototype.constructor.call(this, options); // sets this.options

      this.container = this._initializeContainer(context, options);

      this.breadcrumbs = this._initializeBreadCrumb(this.options);

      this._nextNode = context.getModel(NextNodeModelFactory);
      this.listenTo(this._nextNode, 'change:id', function () {
        this.enterContainer(this._nextNode.attributes);
      });
      this.contextPromise = this.container.fetch().fail(_.bind(this.handleFetchError, this));
      this.listenToOnce(this.container, 'sync', function () {
        this.nodesTable = this._createNodesTable(this.context, this.options);
        this.collection = this.nodesTable.collection; // in case other code expects this.collection
        this._updateChildCollection(options);
        this.tableView = this.nodesTable.tableView;
      });
      context.getModel(UserModelFactory);
      this.listenTo(context, 'error', this.handleFetchError);

      this.propagateEventsToRegions();
    },

    setDefaultOptions: function (options) {
      _.defaults(options, {
        breadcrumb: true,
        facetPanel: true,
        columnsFromDefinitionsOrder: false
      });
    },

    onDestroy: function () {
      this.nodesTable.destroy();
      if (this.breadcrumbs) {
        this.breadcrumbs.destroy();
      }
    },

    onRender: function () {
      this.nodeTableRegion.show(this.nodesTable);

      if (this.breadcrumbs != null) {
        this.$el.addClass('csui-with-breadcrumb');
        this.breadcrumbRegion.show(this.breadcrumbs);
      }
      IconPreloadView.ensureOnThePage();
      GlobalMessage.setMessageRegionView(this, {classes: 'csui-globalMessenger'});
    },

    updateOptions: function (options) {
      if (options) {
        if (this.breadcrumbs) {
          this._updateBreadcrumbs(options);
        }
        if (options.start && options.start.id) {
          this.enterContainer(options.start.id);
        }
      }
    },
    enterContainer: function (node, status) {
      var nodeAttr = {id: getNodeId(node)};

      if (nodeAttr.id != this.prevNodeId) {
        this.trigger("openingContainer", nodeAttr);
        if (nodeAttr.cancel) {
          if (status != null) {
            status.cancel = true;
          }
        } else {
          this.fetchNode(nodeAttr);
        }
      }
      return this;
    },

    fetchNode: function (nodeAttr) {
      var container = this.container;
      this.prevNodeId = nodeAttr.id;
      this._nextNode.clear({silent: true});
      this._nextNode.actions.reset([], {silent: true});
      this._nextNode.set(nodeAttr, {silent: true});
      this._nextNode.fetch().done(function () {
        container.clear({silent: true});
        container.set(this._nextNode.attributes);
        this.context.fetch();
      }.bind(this));
      return true;
    },

    _initializeContainer: function (context, options) {
      var nodeBrowsingOptions = _.extend({
        defaultActionCommands: this.defaultActionController.actionItems.getAllCommandSignatures(
            this.defaultActionController.commands),
        delayRestCommands: true,
        promoteSomeRestCommands: false
      }, nodeOptions),
      container = context.getObject(NodeModelFactory, { options: nodeBrowsingOptions });
      options.start || (options.start = {type: 141});

      if (options.start.id && options.start.id !== 'volume') {
        if (NodeModel.usesIntegerId && typeof options.start.id === 'string') {
          container.set({id: parseInt(options.start.id, 10)});
        } else {
          container.set({id: options.start.id});
        }
      } else if (options.start.type) {
        container.set({id: 'volume', type: options.start.type});
      }

      this._setContainerEvents(container);

      return container;
    },

    _setContainerEvents: function (container) {
      this.listenTo(container, "change:id", function (node, status) {
        this.enterContainer(node.get('id'), status);
      });

      return true;
    },

    _updateChildCollection: function (options) {
      this.collection.setFilter(options.filter, false);
      if (NodesTableView.useV2RestApi) {
        this.collection.setFields(nodeOptions.fields);
        this.collection.setExpand(nodeOptions.expand);
      }
      this.listenTo(this.collection, 'sync', function () {
        this._containerOpened(this.container);
      });
    },

    _createNodesTable: function (context, options) {
      var nodesTable = new NodesTableView({
        context: context,
        pageSize: options.pageSize,
        ddItemsList: options.pageSizes,
        tableColumns: options.tableColumns,
        clearFilterOnChange: options.clearFilterOnChange,
        resetOrderOnChange: options.resetOrderOnChange,
        resetLimitOnChange: options.resetLimitOnChange,
        fixedFilterOnChange: options.fixedFilterOnChange,
        toolbarItems: options.toolbarItems
      });

      this.listenTo(nodesTable, "executed:defaultAction", function (args) {
        if (args.signature === 'Browse') {
          this._containerOpened(args.node);
        }
      });

      this.listenTo(nodesTable.tableView, 'tableBodyRendered', function (args) {
        this.trigger('tableBodyRendered', {sender: this, target: args.target});
      });

      this.listenTo(nodesTable, 'before:defaultAction', function (args) {
        this._beforeDefaultAction(args);
      });

      return nodesTable;
    },

    _beforeDefaultAction: function (args) {
      var newOptions = {sender: this, node: args.node};
      this.trigger('executingDefaultAction', newOptions);
      args.cancel = newOptions.cancel;
      return true;
    },

    _containerOpened: function (node) {
      this.trigger('containerOpened', {sender: this, node: node});
      return true;
    },

    updateBreadcrumb: function (stopNode) {
      var stopNodeId = getNodeId(stopNode);
      this.breadcrumbs.updateStopId(stopNodeId);
    },

    _initializeBreadCrumb: function (options) {
      var breadcrumbView = null;

      if (this.options.breadcrumb) {
        _.isObject(this.options.breadcrumb) || (this.options.breadcrumb = {});
        breadcrumbView = new BreadcrumbsView({
          context: options.context,
          collection: options.context.getCollection(AncestorCollectionFactory),
          stop: options.breadcrumb.stop
        });
        options.breadcrumb.isBreadcrumbsEmpty = true;
        this._setBreadcrumbEvents(breadcrumbView);
      }
      return breadcrumbView;
    },

    _setBreadcrumbEvents: function (breadcrumbView) {
      this.listenTo(breadcrumbView, 'before:defaultAction', this._beforeDefaultAction);
      return true;
    },

    handleFetchError: function (request) {
      var error = new base.Error(request);
      this.tableView && this.tableView.cancelFetch();
      this.tableView && this.tableView.renderError();
      ModalAlert.showError(error.message);
    }

  });

  _.extend(FolderBrowserLayout.prototype, LayoutViewEventsPropagationMixin);

  return FolderBrowserLayout;

  function getNodeId(node) {
    return node.get && node.get('id') || node.id || node;
  }

});


