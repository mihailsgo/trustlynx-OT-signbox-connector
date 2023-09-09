/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
        'csui/lib/marionette3',
        'module',
        'csui/utils/contexts/factories/connector',
        'csui/controls/table/table.view',
        'csui/controls/pagination/nodespagination.view',
        'csui/controls/toolbar/toolbar.view',
        'csui/utils/commands',
        'csui/utils/base',
        'csui/controls/toolbar/toolbar.command.controller',
        'csui/controls/tableactionbar/tableactionbar.view',
        'csui/behaviors/default.action/default.action.behavior',
        'csui/controls/progressblocker/blocker',
        'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
        'webreports/utils/general.utils',
        'webreports/utils/contexts/factories/nodestablereportcolumns',
        'webreports/utils/contexts/factories/nodestablereport',
        'webreports/models/nodestablereport/impl/nodestablereport.columns',
        'webreports/widgets/nodestable.report/impl/nodestable.report.toolbaritems',
        'webreports/widgets/nodestable.report/impl/nodestable.report.toolbaritems.masks',
        'webreports/mixins/webreports.view.mixin',
        'hbs!webreports/widgets/nodestable.report/impl/nodestable.report',
        'i18n!webreports/widgets/nodestable.report/impl/nls/nodestable.report.lang',
        'css!webreports/widgets/nodestable.report/impl/nodestable.report',
        'css!webreports/style/webreports.css'
], function (_,
             Marionette,
             module,
             ConnectorFactory,
             TableView,
             PaginationView,
             ToolbarView,
             commands,
             base,
             ToolbarCommandController,
             TableActionBarView,
             DefaultActionBehavior,
             BlockingView,
             ViewEventsPropagationMixin,
             generalUtils,
             NodesTableReportColumnCollectionFactory,
             NodesTableReportCollectionFactory,
             nodesTableReportColumns, toolbarItems,
             ToolbarItemsMasks,
             WebReportsViewMixin,
             template,
             lang) {

    "use strict";

    var config = module.config();
    _.defaults(config, {
        defaultPageSize: 30,
        defaultPageSizes: [30, 50, 100],
        showInlineActionBarOnHover: true,
        forceInlineActionBarOnClick: false,
        inlineActionBarStyle: "csui-table-actionbar-bubble",
        clearFilterOnChange: true,
        resetOrderOnChange: false,
        resetLimitOnChange: true,
        fixedFilterOnChange: false,
        orderBy: "name asc"
    });

    var NodesTableReportContentView = Marionette.View.extend({

        className: 'webreports-nodestable-report-content-view',

        template: template,

        ui: {
            tableView: '.csui-table-tableview',
            paginationView: '.csui-table-paginationview'
        },

        regions: {
            table: {
                el: '.csui-table-tableview'
            },
            pagination: {
                el: '.csui-table-paginationview'
            }
        },

        behaviors: {
            DefaultAction: {
                behaviorClass: DefaultActionBehavior
            }
        },

        constructor: function NodesTableReportContentView(options) {
            options = this._processOptions(options);
            BlockingView.imbue(this);
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        initialize: function () {
            var options = this.options,
                modelOptions = this.setCommonModelOptions(options),
                factory = this.getWidgetFactory(options, NodesTableReportCollectionFactory, modelOptions);

            this.setFactory(factory);

            this.collection = this.options.collection || this.context.getCollection(NodesTableReportCollectionFactory, { attributes: modelOptions });
            this.collection.setExpand('properties', ['parent_id', 'reserved_user_id']);
            this.columns = this.options.columns || this.context.getCollection(NodesTableReportColumnCollectionFactory, { attributes: modelOptions });

            this._createTableView(options);
            this._createPaginationView(options);

            this.propagateEventsToViews(this.tableView, this.paginationView);
        },

        onRender: function () {
            this.showChildView('table', this.tableView);
            this.showChildView('pagination', this.paginationView);
        },

        templateContext: function () {
            var context = this.getOption("context"),
                options = this.options;

            return {
                title: base.getClosestLocalizedString(options.data.title, lang.dialogTitle),
                icon: options.data.titleBarIcon,
                showParameterEditBtn: options.data.parameterPrompt === 'showPromptForm',
                header: (!_.isUndefined(options.data.header) && options.data.header === false) ? false : true,
                wrNode: generalUtils.isWebReportNodeContext(context)
            };
        },

        _processOptions: function(options){
            if (_.isUndefined(options)){
                options = {};
            }
            _.defaults(options, {
                data: {},
                pageSize: config.defaultPageSize,
                ddItemsList: config.defaultPageSizes,
                toolbarItems: toolbarItems,
                clearFilterOnChange: config.clearFilterOnChange,
                resetOrderOnChange: config.resetOrderOnChange,
                resetLimitOnChange: config.resetLimitOnChange,
                fixedFilterOnChange: config.fixedFilterOnChange,
                orderBy: config.orderBy
            });
            var pageSize  = options.data.pageSize || options.pageSize,
                pageSizes = options.data.pageSizes || options.ddItemsList;

            if (!_.contains(pageSizes, pageSize)) {
                pageSizes.push(pageSize);
                options.data.pageSizes = pageSizes.sort();
            }

            if (options.data && options.data.titleBarIcon && options.data.titleBarIcon.length){
                options.data.titleBarIcon = 'title-icon ' + options.data.titleBarIcon;
            } else {
                options.data.titleBarIcon = 'title-icon title-webreports';
            }
            this.context = options.context;
            if (!options.connector) {
                options.connector = this.context.getObject(ConnectorFactory);
            }
            this.connector = options.connector;
            this.tableColumns = options.tableColumns || nodesTableReportColumns.deepClone();
            this.commands = options.commands || commands;
            this.commandController = new ToolbarCommandController({commands: this.commands});
            if (!options.toolbarItemsMasks) {
                options.toolbarItemsMasks = new ToolbarItemsMasks();
            }

            this.options = options;

            return options;
        },

        _createTableView: function (options) {
            var tableOptions = _.extend({
                context: this.options.context,
                connector: this.connector,
                collection: this.collection,
                columns: this.columns,
                tableColumns: this.tableColumns,
                pageSize: this.options.data.pageSize || this.options.pageSize,
                originatingView: this,
                columnsWithSearch: ["name"],
                orderBy: this.options.data.orderBy || this.options.orderBy,
                filterBy: this.options.filterBy,
                actionItems: this.defaultActionController.actionItems,
                commands: this.defaultActionController.commands,
                blockingParentView: this,
                parentView: this,
                clientSideDataOperation: false,
                alternativeHeader: {
                    viewClass: ToolbarView,
                    options: {
                        context: this.getOption("context"),
                        toolbarItems: this.options.toolbarItems,
                        toolbarItemsMask: this.options.toolbarItemsMasks.toolbars.tableHeaderToolbar,
                        toolbarCommandController: this.commandController
                    }
                },
                inlineBar: {
                    viewClass: TableActionBarView,
                    options: _.extend({
                        context: this.getOption("context"),
                        originatingView: this,
                        collection: this.options.toolbarItems.inlineActionbar,
                        toolItemsMask: this.options.toolbarItemsMasks.toolbars.inlineActionbar,
                        delayedActions: this.collection.delayedActions,
                        container: this.container,
                        containerCollection: this.collection
                    }, this.options.toolbarItems.inlineActionbar.options, {
                        inlineBarStyle: config.inlineActionBarStyle,
                        forceInlineBarOnClick: config.forceInlineActionBarOnClick,
                        showInlineBarOnHover: config.showInlineActionBarOnHover
                    })
                }
            }, options);

            this.tableView = new TableView(tableOptions);

            this._setTableViewEvents();
        },

        _createPaginationView: function (options) {
            this.paginationView = new PaginationView({
                collection: this.collection,
                pageSize: options.data.pageSize || options.pageSize
            });
        },

        _setTableViewEvents: function(){
            this.listenTo(this.tableView, 'execute:defaultAction', function (node) {
                var args = {node: node};
                this.trigger('before:defaultAction', args);
                if (!args.cancel) {
                    var self = this;
                    this.defaultActionController.executeAction(node, {
                        context: this.options.context,
                        originatingView: this
                    }).done(function () {
                        self.trigger('executed:defaultAction', args);
                    });
                }
            });
        }
    });

    _.extend(NodesTableReportContentView.prototype, ViewEventsPropagationMixin);
    WebReportsViewMixin.mixin(NodesTableReportContentView.prototype);

    return NodesTableReportContentView;
});