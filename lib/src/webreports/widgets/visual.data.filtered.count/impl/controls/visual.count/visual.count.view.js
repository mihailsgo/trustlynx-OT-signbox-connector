/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/marionette3',
        'csui/lib/backbone',
        'csui/lib/underscore',
        'csui/lib/jquery',
        'csui/utils/contexts/factories/connector',
        'csui/models/node/node.model',
        'csui/utils/commands',
        'csui/utils/commandhelper',
        'csui/dialogs/modal.alert/modal.alert',
        'csui/controls/facet.bar/facet.bar.view',
        'csui/controls/facet.panel/facet.panel.view',
        'csui/controls/charts/visual.count/visual.count.view',
        'csui/controls/progressblocker/blocker',
        'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/impl/visual.count.footer.view',
        'webreports/mixins/webreports.view.mixin',
        'webreports/widgets/visual.data.filtered.count/impl/mixins/visual.count.view.mixin',
        'hbs!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/impl/visual.count',
        'i18n!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/impl/nls/lang',
        'css!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/impl/visual.count'
], function (Marionette,
             Backbone,
             _,
             $,
             ConnectorFactory,
             NodeModel,
             commands,
             CommandHelper,
             ModalAlert,
             FacetBarView,
             FacetPanelView,
             VisualCountChartView,
             BlockingView,
             VisualCountFooterView,
             WebReportsViewMixin,
             VisualCountViewMixin,
             template,
             lang){

    var VisualCountView = Marionette.View.extend({

        className: 'webreports-visual-count-container',

        template: template,

        regions: {
            facetBar: {
                el: '.webreports-visual-count-facetbarview'
            },
            facetPanel: {
                el: '.webreports-visual-count-facetpanelview'
            },
            chartControls: {
                el:'.webreports-visual-count-controls-parent'
            },
            chart: {
                el: '.webreports-visual-count-chart'
            },
            footer: {
                el: '.webreports-visual-count-footer',
                replaceElement: true
            }
        },

        constructor: function VisualCountView(options) {

            options = this.validateVisualCountOptions(options);

            this.validateCollections(options);

            Marionette.View.prototype.constructor.apply(this, arguments);

            this._createViews(options);

            BlockingView.imbue(this);
        },

        onDomRefresh: function() {
                this._renderFooter();
                this._renderFacetBar();
                this._renderFacetPanel();
                this._renderChartControls();
                this._renderChart();
        },

        onChartOptionsUpdated: function(args) {

            if (this.chartOptionsModel) {
                if (_.has(args, 'theme_name')) {
                    this.chartOptionsModel.set({
                        "themeName": args.theme_name
                    });
                }
                if (_.has(args, 'view_value_as_percentage')) {
                    this.chartOptionsModel.set({
                        "showAsPercentage": args.view_value_as_percentage
                    });
                }
            }

            this.chartCollection.onChartOptionsUpdated(args);
        },

        _clearFilters: function(){
            this.facetCollection.clearFilter(false);
        },

        _addToFacetFilter: function(filter){
            var $chartEl = this.getRegion('chart').$el;

            this.facetCollection.addFilter(filter);
            this.chartCollection.onFiltersUpdated();

            this._renderFacetBar();
            this._renderChartControls();
            this._renderFacetPanel();

            $chartEl.addClass('facet-bar-visible');
        },

        _renderChart: function(){
            var $offsetParent,
                chartContentView,
                chartView = this.chartView,
                chartRegion = this.getRegion('chart');

                if (chartRegion && chartView){

                    $offsetParent = this.$el.offsetParent();
                    if (!_.isNull($offsetParent ) && $offsetParent.height() > 0){
                        chartRegion.show(this.chartView);
                        chartContentView =  chartView.getChildView("chart");
                        if (chartContentView){
                            chartContentView.trigger("redraw:chart");
                        }
                    }
                } else {
                    console.warn("Missing chart view or region.");
                }
        },

        _renderFacetBar: function(){
            if (this.facetCollection.filters.length > 0){
                this.showChildView('facetBar', this.facetBarView);
                this.facetCollection.trigger("reset");
            }
        },

        _renderFacetPanel: function(){
            this.showChildView('facetPanel', this.facetPanelView);
        },

        _renderFooter: function(){
            var $footerEl;
            if (this.footerView){
                this.showChildView('footer', this.footerView);
                $footerEl = this.getRegion('footer').$el;
                $footerEl.addClass('has-footer');
            }
        },

        _createViews: function(options){
            if (options.chartView){
                this.chartView = options.chartView;
            } else {
                this._createChartView();
            }

            this.createChartControlsView(options);
            this._createFacetPanelView();
            this._createFacetBarView();

            if (options.toolbarItems){
                this.toolbarItems = options.toolbarItems;
                this._createFooterView();
            }
        },

        _createChartView: function(){
            var options = this.options,
                chartOptionsModel = this.chartOptionsModel;

            this.chartView = new VisualCountChartView({
                context: options.context,
                chartType: options.type,
                collection: options.chartCollection,
                columns: options.columnCollection,
                chartOptions: chartOptionsModel,
                originatingView: this
            });
        },

        _createFacetPanelView: function () {
            this.facetPanelView = new FacetPanelView({
                collection: this.facetCollection,
                enableCheckBoxes: true,
                blockingLocal: true
            });

            this.listenTo(this.facetPanelView, 'apply:filter', this._addToFacetFilter);
        },

        _createFacetBarView: function () {
            this.facetBarView = new FacetBarView({
                collection: this.facetCollection
            });

            this.listenTo(this.facetBarView, 'remove:filter', this._removeFacetFilter, this)
                .listenTo(this.facetBarView, 'remove:all', this._removeAll, this)
                .listenTo(this.chartView, 'apply:filter', this._addToFacetFilter, this);
        },

        _createFooterView: function () {
            var options = this.options;

            this.footerView = new VisualCountFooterView({
                context: options.context,
                toolbarItems: this.toolbarItems,
                originatingView: this
            });

            this.listenTo(this, "button:clicked", this._onButtonClicked);
        },

        _renderChartControls: function(){
            this.getRegion('chartControls').show(this.chartControlsView);
        },

        _removeFacetFilter: function (filter) {
            var $chartEl = this.getRegion('chart').$el;

            this.facetCollection.removeFilter(filter, false);
            this.chartCollection.onFiltersUpdated();

            if (_.has(this.facetCollection,'filters') && this.facetCollection.filters.length < 1) {
                $chartEl.removeClass('facet-bar-visible');
            }

            this._renderChartControls();
            this._renderFacetPanel();
        },

        _removeAll: function () {
            var $chartEl = this.getRegion('chart').$el;
            this._clearFilters();
            this.chartCollection.onFiltersUpdated();
            this._renderChartControls();

            $chartEl.removeClass('facet-bar-visible');

        },

        _onButtonClicked: function(childView, args){
            var commandPromise,
                rowLimit,
                filteredRowCount,
                toolbarItems = args.toolbarItems,
                model = childView.model,
                context = this.options.context,
                signature = model.get("signature"),
                command = commands.findWhere({"signature": signature}),
                status = {
                    context: context
                },
                options = {
                    context: context,
                    parameters: this.chartCollection.getFilteredCountQuery(),
                    originatingView: this
                };

            if (toolbarItems && toolbarItems.footer && toolbarItems.footer.options){
                rowLimit = toolbarItems.footer.options.rowLimit;
                filteredRowCount = this.chartCollection.getTotalCount();

                if (filteredRowCount <= rowLimit){
                    if (command) {
                        _.extend(status, model.get("status"));
                        _.extend(options, model.get("commandData"));
                        if (command.enabled(status, options)){
                            commandPromise = command.execute(status, options);
                            CommandHelper.handleExecutionResults(commandPromise, {
                                command: command,
                                suppressSuccessMessage: true
                            });
                        }
                    }
                } else {
                    ModalAlert.showError(lang.tooManyRows + rowLimit);
                }
            }

        }

    });
    WebReportsViewMixin.mixin(VisualCountView.prototype);
    VisualCountViewMixin.mixin(VisualCountView.prototype);

    return VisualCountView;

});
