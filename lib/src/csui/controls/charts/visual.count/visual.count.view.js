/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette3',
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/controls/progressblocker/blocker',
    'csui/controls/charts/visual.count/impl/chart.types/bar/visual.count.verticalbar.view',
    'csui/controls/charts/visual.count/impl/chart.types/bar/visual.count.horizontalbar.view',
    'csui/controls/charts/visual.count/impl/chart.types/pie/visual.count.donut.view',
    'csui/controls/charts/visual.count/impl/chart.types/pie/visual.count.pie.view',
    'csui/controls/charts/visual.count/impl/visual.count.empty.view',
    'csui/controls/charts/visual.count/impl/visual.count.patterndef.view',
    'hbs!csui/controls/charts/visual.count/impl/visual.count',
    'css!csui/controls/charts/visual.count/impl/visual.count'
], function(Marionette, _, $,
            BlockingView,
            VerticalBarChartView,
            HorizontalBarChartView,
            DonutChartView,
            PieChartView,
            EmptyView,
            PatternDefView,
            template){
    'use strict';

    var VisualCountView = Marionette.View.extend({

        className: 'csui-visual-count-container',

        template: template,

        regions: {
            chart: {
                el: '.csui-visual-count-chart-container',
                replaceElement: true
            },
            patternDef: {
                el: '.csui-visual-count-patterndef-container'
            }
        },

        constructor: function VisualCountView(options) {

            BlockingView.imbue({
                parent: this
            });

            this.chartView = this._getChartView(options);
            Marionette.View.prototype.constructor.apply(this, arguments);

            this.options.viewId = _.uniqueId('visual-count');
            var self = this;
            this.onWinRefresh = _.debounce(function() {
                self.render();
            },20);
            $(window).on("resize.app", this.onWinRefresh);

            this.listenTo(options.collection, 'reset', this.render)
                .listenTo(options.collection, 'request', this.blockActions)
                .listenTo(options.collection, 'sync error', this.onCollectionSynced)
                .listenTo(options.chartOptions, 'change', this.render);
        },

        templateContext: function(options) {
            return {
                viewId: this.options.viewId
            };
        },

        childViewEvents: {
            'redraw:chart': 'render'
        },

        onDomRefresh: function(){
            var ChartView = this.chartView;

            this.chartViewInstance = new ChartView(this.options);
            this.showChildView('chart', this.chartViewInstance);
            this.showChildView('patternDef', new PatternDefView(this.options));
        },

        onCollectionSynced: function(collection) {

            this.unblockActions();

            var $chart = $('svg',this.$el);

            if (collection && collection.isEmpty()) {
                this._renderEmptyView();
            }
            else if ($chart.length === 0) {
                this.render();
            }
        },

        onDestroy: function () {
            $(window).off("resize.app", this.onWinRefresh);
        },

        _renderEmptyView: function () {
            this.showChildView('chart', new EmptyView());
        },

        _getChartView: function (options) {
            var chartType = options && options.chartType,
                chartView = VerticalBarChartView;

            if (chartType){
                switch(chartType) {
                    case "donut":
                        chartView = DonutChartView;
                        break;
                    case "pie":
                        chartView = PieChartView;
                        break;
                    case "horizontalBar":
                        chartView = HorizontalBarChartView;
                        break;
                    case "verticalBar":
                        chartView = VerticalBarChartView;
                        break;
                    default:
                }
            }

            return chartView;
        }

    });

    return VisualCountView;

});