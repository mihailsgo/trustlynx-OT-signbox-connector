/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
    'csui/lib/marionette3',
    'csui/utils/base',
    'csui/utils/contexts/factories/connector',
    'csui/controls/table/table.view',
    'csui/controls/pagination/nodespagination.view',
    'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
    'webreports/utils/general.utils',
    'webreports/utils/contexts/factories/table.report.factory',
    'webreports/utils/table.validate',
    'webreports/widgets/table.report/impl/table.report.columns',
    'webreports/mixins/webreports.view.mixin',
    'hbs!webreports/widgets/table.report/impl/table.report',
    'i18n!webreports/widgets/table.report/impl/nls/table.report.lang',
    'css!webreports/widgets/table.report/impl/table.report',
    'css!webreports/style/webreports.css'
], function (_,
    Marionette,
    base,
    ConnectorFactory,
    TableView,
    PaginationView,
    ViewEventsPropagationMixin,
    generalUtils,
    TableReportCollectionFactory,
    tableValidate,
    TableColumns,
    WebReportsViewMixin,
    template,
    lang) {

    "use strict";

    var TableReportContentView = Marionette.View.extend({

        className: "webreports-table-report-content-view",

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

        constructor: function TableReportContentView(options) {
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        initialize: function (options) {
            var modelOptions,
                factoryOptions,
                factory;

            modelOptions = this._getTableReportModelOptions(options);

            factoryOptions = { attributes: modelOptions };
            factory = this.getWidgetFactory(options, TableReportCollectionFactory, modelOptions);

            this.setFactory(factory);

            this.collection = this.options.collection ||
                this.options.context.getCollection(TableReportCollectionFactory, factoryOptions);
            this.columns = this.options.context.getCollection(TableReportCollectionFactory, factoryOptions);
        },

        onRender: function () {
            var options = this.options,
                modelOptions = this._modelOptions;

            if (this.collection) {
                this.tableView = new TableView({
                    context: this.options.context,
                    connector: this.options.context.getObject(ConnectorFactory),
                    collection: this.collection,
                    columns: this.collection.columns,
                    tableColumns: options.data.tableColumns || TableColumns,
                    selectRows: options.data.selectRows || 'none',
                    columnsWithSearch: modelOptions.data.columnsWithSearch,
                    orderBy: modelOptions.data.orderBy,
                    selectColumn: false
                });
                this._setPagination();
            } else if (this.tableView) {
                this.stopListening(this.tableView);
                delete this.tableView;
            }

            this.propagateEventsToViews(this.tableView, this.paginationView);

            this.showChildView('table', this.tableView);
            this.showChildView('pagination', this.paginationView);
        },

        templateContext: function () {
            var context = this.getOption("context"),
                options = this.options;

            return {
                title: base.getClosestLocalizedString(options.data.title, lang.dialogTitle),
                icon: this._getTitleBarIcon(options),
                showParameterEditBtn: options.data.parameterPrompt === 'showPromptForm',
                header: (!_.isUndefined(options.data.header) && options.data.header === false) ? false : true,
                wrNode: generalUtils.isWebReportNodeContext(context)
            };
        },

        _setPagination: function () {
            var modelOptions = this._modelOptions,
                pageSize = tableValidate.checkPageSize(modelOptions.data.pageSize, modelOptions.data.pageSizeOptions),
                pageSizeOptions = tableValidate.checkPageSizeOptions(modelOptions.data.pageSizeOptions, pageSize);

            this.paginationView = new PaginationView({
                collection: this.collection,
                defaultDDList: pageSizeOptions,
                pageSize: pageSize
            });

            return true;
        },

        _getTitleBarIcon: function(options){
            var titleBarIcon = 'title-icon title-webreports';

            if (options.data && options.data.titleBarIcon && options.data.titleBarIcon.length) {
                titleBarIcon = 'title-icon ' + options.data.titleBarIcon;
            }

            return titleBarIcon;
        },

        _getTableReportModelOptions: function(options){
            var pageSize,
                orderBy = "",
                columnsWithSearch = [],
                modelOptions = {};

            columnsWithSearch = this._getColumnsWithSearch(options);

            if (options.data.sortBy && options.data.sortOrder) {
                orderBy = options.data.sortBy + " " + options.data.sortOrder;
            }

            if (options.data.pageSize && _.isString(options.data.pageSize)){
                pageSize = parseInt(options.data.pageSize);
            }

            modelOptions = {
                context: options.context,
                data: {
                    id: options.data.id,
                    sortBy: options.data.sortBy,
                    sortOrder: options.data.sortOrder,
                    orderBy: orderBy,
                    pageSize: pageSize,
                    pageSizeOptions: options.data.pageSizeOptions,
                    swrLaunchCell: options.data.swrLaunchCell,
                    columnsWithSearch: columnsWithSearch,
                    parameters: options.data.parameters
                }
            };

            this.setModelParameters(options, modelOptions);

            this._modelOptions = modelOptions;

            return modelOptions;
        },

        _getColumnsWithSearch: function(options){
            var columnsWithSearchFromOptions,
                columnsWithSearch = [];

            if (_.has(options.data, "columnsWithSearch")) {
                columnsWithSearchFromOptions = options.data.columnsWithSearch;
                if (typeof columnsWithSearchFromOptions === "string") {
                    columnsWithSearch = [columnsWithSearchFromOptions];
                }
                else if (_.isArray(columnsWithSearchFromOptions) && _.isObject(_.first(columnsWithSearchFromOptions))) {
                    columnsWithSearch = _.chain(columnsWithSearchFromOptions)
                        .reject(function(columnWithSearch){
                            return !columnWithSearch.columnName || !_.isString(columnWithSearch.columnName) || columnWithSearch.columnName.length < 1;
                        })
                        .pluck("columnName")
                        .without(null, undefined, "")
                        .value();
                }
            }

            return columnsWithSearch;
        }
    });

    _.extend(TableReportContentView.prototype, ViewEventsPropagationMixin);
    WebReportsViewMixin.mixin(TableReportContentView.prototype);

    return TableReportContentView;
});

