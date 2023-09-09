/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/dialogs/modal.alert/modal.alert',
    'csui/models/mixins/connectable/connectable.mixin',
    'webreports/widgets/visual.data.filtered.count/impl/models/mixins/visual.count/client.collection/chart.collection.client.mixin',
    'webreports/widgets/visual.data.filtered.count/impl/models/mixins/visual.count/filterable/filterable.mixin',
    'webreports/widgets/visual.data.filtered.count/impl/models/mixins/visual.count/postable/postable.mixin',
    'webreports/utils/general.utils',
    'i18n!webreports/widgets/visual.data.filtered.count/impl/models/visual.count/chart.collection/nls/lang',
    'csui/utils/deepClone/deepClone'
], function (_,
             Backbone,
             ModalAlert,
             ConnectableMixin,
             ChartCollectionClientMixin,
             FilterableMixin,
             PostableMixin,
             generalUtils,
             lang) {

    var VisualCountChartCollection = Backbone.Collection.extend({
        constructor: function VisualCountChartCollection(models, options) {
            Backbone.Collection.prototype.constructor.apply(this, arguments);

            if (_.isUndefined(options)) {
                options = {};
            }

            if (options && options.id && !this.id) {
                this.id = options.id;
            }

            this.options = options;
            this.makeConnectable(options);
            this.makeFilterable(options);
        },
        url: function () {
            return this.connector.connection.url + '/nodes/' + this.id + '/output';
        },

        parse: function (response) {
            if (response.data && response.data.length > 0) {
                this.grouped_on_server = response.grouped_on_server || false;
                this.sorted_on_server = response.sorted_on_server || false;
                this.setColumns(response.columns);
                this.setFacetFilters(response.fc_filters);

                if (this._isResponseValid(response)) {
                    if (response.grouped_on_server) {
                        this.groupedData = response;
                    } else {
                        this.rawCollection = response.data;
                    }

                    this.sortGroupAndFilter();

                    return this.filteredData;
                }
            } else {
                return [];
            }
        },

        _isResponseValid: function (response) {
            var ok = true;
            if (!response.grouped_on_server) {
                if (!this._isActiveColumnValid(response)) {
                    ModalAlert.showError(lang.invalidActiveColumn);
                    ok = false;
                }
            }
            return ok;
        },

        _isActiveColumnValid: function (response) {
            return !_.isUndefined(generalUtils.getCaseInsensitiveProperty(_.first(response.data), this.columnCollection.getActiveColumn()));
        },

        filteredData: {},
        rawCollection: {},

        getSortOptions: function () {
            return {
                sortBy: this.chartControlsModel.get('sort_by'),
                sortOrder: this.chartControlsModel.get('sort_order')
            };
        },

        getGroupAfter: function () {
            return this.chartControlsModel.get('group_after');
        },

        setColumns: function (columns) {
            var activeColumn = _.findWhere(columns, {active_column: true}),
                countColumn = _.findWhere(columns, {count_column: true}),
                noActiveOrCountColSet = !activeColumn || !countColumn;
            if (noActiveOrCountColSet) {
                columns = _.map(columns, _.bind(function (column) {
                    if (this.options.activeColumn && (column.name.toLowerCase() === this.options.activeColumn.toLowerCase())) {
                        column.active_column = true;
                    }
                    if (this.options.countColumn && (column.name.toLowerCase() === this.options.countColumn.toLowerCase())) {
                        column.active_column = true;
                    }
                    return column;
                }, this));
            }
            _.each(columns, function (column) {
                column.id = column.id.toString();
            });

            this.columnCollection.set(columns);
        },

        sortGroupAndFilter: function (options) {
            var filteredData,
                nestedData;

            if (this.grouped_on_server) {
                filteredData = this.groupedData.data;
                if (!this.sorted_on_server || (options && options.sort)) {
                    filteredData = this.sortNest(filteredData, this.getSortOptions());
                }
            } else {
                nestedData = this.nest(this.filterBy(this.rawCollection, this.getFCFilters()), this.columnCollection.getActiveColumn());
                filteredData = this.groupOutlyingValues(this.sortNest(nestedData, this.getSortOptions()), this.getGroupAfter());
            }

            filteredData = this._checkGroupedCategory(filteredData);
            this.filteredData = filteredData;

            this.setFacetData(filteredData);

            return filteredData;
        },

        _checkGroupedCategory: function (filteredData) {
            var groupedCategory = this._findGroupedCategory(filteredData);

            if (groupedCategory) {
                groupedCategory.grouped_category = true;
            }

            return filteredData;
        },

        _findGroupedCategory: function (filteredData) {
            var findObj = {},
                activeColumn = this.columnCollection.getActiveColumn();

            findObj[activeColumn] = "ga_other";

            return _.findWhere(filteredData, findObj);
        },

        onChartOptionsUpdated: function (args) {
            var clientOnlyChanges = (_.keys(_.omit(args, ['sort_by', 'sort_order', 'view_value_as_percentage', 'theme_name'])).length === 0),
                goToServer = (this.grouped_on_server && !clientOnlyChanges);

            if (!_.has(args, 'column_names')) {
                if (goToServer) {
                    this.fetch();
                } else if (clientOnlyChanges) {
                    this.set(this.sortGroupAndFilter({sort: true}));
                } else {
                    if (_.has(args, 'active_column')) {
                        this.columnCollection.updateActiveColumn(args.active_column);
                    }
                    this.set(this.sortGroupAndFilter());
                }
            }
        }
    });

    ConnectableMixin.mixin(VisualCountChartCollection.prototype);
    ChartCollectionClientMixin.mixin(VisualCountChartCollection.prototype);
    FilterableMixin.mixin(VisualCountChartCollection.prototype);
    PostableMixin.mixin(VisualCountChartCollection.prototype);

    return VisualCountChartCollection;

});
