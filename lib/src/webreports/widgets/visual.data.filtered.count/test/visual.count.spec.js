/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette',
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/utils/contexts/page/page.context',
    'webreports/widgets/visual.data.filtered.count/visual.data.filtered.count.view',
    'i18n!csui/controls/charts/visual.count/impl/nls/lang',
    './visual.data.mock.js'
], function (Marionette,
    _,
    $,
    PageContext,
    VisualCountView,
    lang,
    mock) {
    'use strict';

    describe('VisualCountWidget', function () {

        var context = new PageContext({
            factories: {
                connector: {
                    connection: {
                        url: '//server/cgi/cs.exe/api/v1',
                        supportPath: '/support',
                        session: {
                            ticket: 'dummy'
                        }
                    }
                }
            }
        });

        mock.enable();

        describe('bar chart with client data', function () {

            var barChartView;
            beforeAll(function (done) {
                var barRegion,
                    webreportID = 218890;

                barChartView = new VisualCountView({
                    context: context,
                    data: {
                        id: webreportID,
                        title: 'Bar Chart',
                        type: 'bar',
                        theme: 'otPrimary',
                        activeColumn: 'Habitat',
                        filterable: true,
                        expandable: true,
                        viewValueAsPercentage: false,
                        groupAfter: -1,
                        sortBy: 'ordinal',
                        sortOrder: 'asc',
                        launchButtonConfig: {
                            rowLimit: 2,
                            launchButtons:
                                [
                                    {
                                        launchButtonID: 12345,
                                        launchButtonLabel: "Send As Email",
                                        launchButtonTooltip: "Send As Email Tooltip"
                                    },
                                    {
                                        launchButtonID: 54321,
                                        launchButtonLabel: "Export To CSV",
                                        launchButtonTooltip: "Export To CSV Tooltip"
                                    },
                                    {
                                        launchButtonID: 88888,
                                        launchButtonLabel: "Save As Snapshot",
                                        launchButtonTooltip: "Save As Snapshot Tooltip"
                                    }
                                ]
                        }
                    }
                });
                var $body = $('body'),
                    $container = $body.append('<div class="binf-container-fluid grid-rows"></div>');

                $body.addClass('binf-widgets');
                $container.append('<div class="binf-row"><div class="binf-col-md-8 binf-col-xl-6" id="bar"></div></div>');
                barRegion = new Marionette.Region({
                    el: "#bar"
                });

                barRegion.show(barChartView);
                context.fetch()
                    .always(function () {
                        _.delay(done, 500);
                    });
            });

            it('visual count widget view can be constructed', function () {
                expect(barChartView instanceof VisualCountView).toBeTruthy();
            });

            it('visual count tile view is shown', function () {
                var $tile = $('.cs-tile', '#bar');

                expect($tile.length).toBeTruthy();
                expect($tile.height()).toBeGreaterThan(0);
                expect($tile.width()).toBeGreaterThan(0);
            });

            it('chart is shown', function () {
                var $chart = $('.csui-visual-count-chart-container svg', '#bar');

                expect($chart.length).toBeTruthy();
                expect($chart.height()).toBeGreaterThan(0);
                expect($chart.width()).toBeGreaterThan(0);
            });

            it('chart is valid', function () {
                var expectedLabels,
                    contentView,
                    chartCollection,
                    $bars = $('.csui-visual-count-bars rect', '#bar'),
                    $barlabels = $('.csui-visual-count-chart-labels text', '#bar');

                expect($bars.length).toEqual(11);
                expect($barlabels.length).toEqual(11);

                contentView = barChartView.getChildView("content");
                chartCollection = contentView.chartCollection;
                expectedLabels = chartCollection.pluck("Count_formatted");

                $barlabels.each(function (index) {
                    expect($(this).text()).toEqual(expectedLabels[index]);
                });
            });

            it('chart axis labels are valid', function () {
                var $totalLabel = $('.csui-visual-count-total', '#bar'),
                    $xAxisLabel = $('.csui-visual-count-x-label', '#bar'),
                    $yAxisLabel = $('.csui-visual-count-y-label', '#bar');

                expect($totalLabel.text().trim()).toEqual("Total: 44");
                expect($xAxisLabel.text().trim()).toEqual("Animal Habitat");
                expect($yAxisLabel.text().trim()).toEqual("Total count");
            });

            it('header is valid', function () {
                var $titleIcon = $('.title-webreports', '#bar'),
                    $title = $('.csui-heading', '#bar'),
                    $chartControls = $('.tile-controls', '#bar');

                expect($titleIcon.length).toBeGreaterThan(0);
                expect($title.text().trim()).toEqual("Bar Chart");
                expect($chartControls.length).toBeGreaterThan(0);
            });

            it('footer is valid', function () {
                var $expandIcon = $('.cs-more', '#bar .tile-footer');

                expect($expandIcon.length).toBeGreaterThan(0);
            });
        });

        describe('horizontal bar chart with client data', function() {
            var horizontalBarChartView;

            beforeAll((done)=>{
                var horizontalBarRegion,
            webreportID=218890;
            

                horizontalBarChartView = new VisualCountView({
                    context: context,
                    data: {
                        id: webreportID,
                        title: 'Horizontal Bar Chart',
                        type: 'horizontalBar',
                        theme: 'otTertiary',
                        activeColumn: 'Type',
                        filterable: true,
                        expandable: true,
                        viewValueAsPercentage: false,
                        groupAfter: -1,
                        sortBy: 'ordinal',
                        sortOrder: 'asc'
                    }
                });
                var $body = $('body'),
                    $container = $body.append('<div class="binf-container-fluid grid-rows"></div>');

                $body.addClass('binf-widgets');
                $container.append('<div class="binf-row"><div class="binf-col-md-8 binf-col-xl-6" id="horizontal-bar"></div></div>');
                horizontalBarRegion = new Marionette.Region({
                    el: "#horizontal-bar"
                }),

                horizontalBarRegion.show(horizontalBarChartView);
                context.fetch()
                    .always(function () {
                        _.delay(done, 500);
                    });
            });

            it('visual count widget view can be constructed', ()=>{
                expect(horizontalBarChartView instanceof VisualCountView).toBeTruthy();
            });

            it('visual count tile is displayed', () => {
                let $tile=$('#horizontal-bar > .cs-tile');
                expect($tile.length).toBeGreaterThan(0);
                expect($tile.css('display')).toEqual('flex');
            });

            it('chart is valid', () => {
                let rects=document.querySelectorAll('#horizontal-bar .csui-visual-count-bars > rect');
                var rect;
                for (rect of rects) {
                    expect(rect.attributes['x'].value).toEqual("0");
                }
            });
        });

        describe('donut chart with server data', function () {
            var donutChartView;

            beforeAll((done) => {
                var donutRegion,
                    webreportID = 255548;

                donutChartView = new VisualCountView({
                    context: context,
                    data: {
                        id: webreportID,
                        title: 'Donut Chart',
                        type: 'donut',
                        theme: 'otSecondary',
                        activeColumn: 'Label',
                        filterable: false
                    }
                });
                var $body = $('body'),
                    $container = $body.append('<div class="binf-container-fluid grid-rows"></div>');

                $body.addClass('binf-widgets');
                $container.append('<div class="binf-row"><div class="binf-col-md-8 binf-col-xl-6" id="donut"></div></div>');
                donutRegion = new Marionette.Region({
                    el: "#donut"
                });

                donutRegion.show(donutChartView);
                context.fetch()
                    .always(function () {
                        _.delay(done, 500);
                    });
            });

            it('visual count widget view can be constructed', () => {
                expect(donutChartView instanceof VisualCountView).toBeTruthy();
            });

            it('visual count widget tile is displayed', () => {
                let $tile = $('#donut > .cs-tile');
                expect($tile.length).toBeGreaterThan(0);
                expect($tile.css('display')).toBeTruthy();
            });

            it('chart is valid', () => {

                function formatLabels(value) {
                    return `${(value / 1024 / 1024).toFixed(1)}MB`;
                }
                let donutHole = $('#donut .csui-visual-count-pie-total-label-disc circle'),
                    donutHoleLabel = $('#donut .csui-visual-count-total').text(),
                    contentView = donutChartView.getChildView("content"),
                    chartCollection = contentView.chartCollection,
                    pieSlice = document.querySelectorAll('#donut .csui-visual-count-pie-slice'),
                    labels = document.querySelectorAll('#donut .csui-visual-count-value-label'),
                    expectedLabels = chartCollection.pluck('Value');

                expect(donutHoleLabel).toEqual(formatLabels(chartCollection.groupedData.total_count));
                expect(donutHole.length).toBeGreaterThan(0);
                expect(pieSlice.length).toEqual(6);

                labels.forEach((label, i) => {
                    let formattedExpectedLabel = formatLabels(expectedLabels[i]);
                    if (label.innerHTML != '') {
                        expect(label.innerHTML).toEqual(formattedExpectedLabel);
                    }
                });

            });

            it('chart legend is valid', () => {
                let contentView = donutChartView.getChildView("content"),
                    chartCollection = contentView.chartCollection,
                    expectedLegendLabel = chartCollection.pluck('Label'),
                    legendTile = $('#donut .csui-visual-count-pie-legend-container'),
                    legendTexts = document.querySelectorAll('.csui-visual-count-pie-legend-text'),
                    legendActiveColumn = $('#donut .csui-visual-count-pie-legend-active-column').text(),
                    expectedColumns = chartCollection.groupedData.columns;

                expect(legendActiveColumn).toEqual(expectedColumns[0].name_formatted);
                expect(legendTile.length).toBeGreaterThan(0);

                expectedColumns.forEach((column) => {
                    if (column.active_column == true) {
                        expect(legendActiveColumn).toEqual(column.name_formatted);
                    }
                });

                legendTexts.forEach((legendText, i) => {
                    expect(legendText.innerHTML).toEqual(expectedLegendLabel[i]);
                });

            });

            it('header is valid', () => {
                let $titleIcon = $('#donut .tile-type-icon'),
                    $title = $('#donut .csui-heading'),
                    $chartControls = $('#donut .tile-controls');

                expect($titleIcon.length).toBeGreaterThan(0);
                expect($title.text().trim()).toEqual("Donut Chart");
                expect($chartControls.length).toBeGreaterThan(0);
            });
        });

        describe('empty bar chart', function () {
            var emptyBarChartView;

            beforeAll((done) => {

                var emptyBarRegion,
                    webreportID = 123456;

                emptyBarChartView = new VisualCountView({
                    context: context,
                    data: {
                        id: webreportID,
                        title: 'Empty Bar Chart',
                        type: 'bar',
                        activeColumn: 'Type',
                        filterable: true,
                        expandable: true,
                        groupAfter: 7
                    }
                });
                var $body = $('body'),
                    $container = $body.append('<div class="binf-container-fluid grid-rows"></div>');

                $body.addClass('binf-widgets');
                $container.append('<div class="binf-row"><div class="binf-col-md-8 binf-col-xl-6" id="empty-bar"></div></div>');
                emptyBarRegion = new Marionette.Region({
                    el: "#empty-bar"
                });

                emptyBarRegion.show(emptyBarChartView);
                context.fetch()
                    .always(function () {
                        _.delay(done, 500);
                    });
            });
            it('visual count widget view can be constructed', () => {
                expect(emptyBarChartView instanceof VisualCountView).toBeTruthy();
            });

            it('visual count widget tile exists', () => {
                let $tile = $('#empty-bar > .cs-tile');
                expect($tile.length).toBeGreaterThan(0);
            });

            it('chart is empty', () => {
                let collection = emptyBarChartView.getChildView("content").chartCollection,
                    options = emptyBarChartView.getChildView("content").options,
                    message = $('#empty-bar .csui-visual-count-nodata-message');

                expect(collection.models.length).toEqual(0);
                expect(message.text().trim()).toEqual(options.text || lang.NodataDefaultText);

            });

            it('header is present, icon is displayed and controls are hidden', () => {
                let header = $('#empty-bar .tile-header'),
                    headerText = $('#empty-bar .tile-title h2').text().trim(),
                    icon = $('#empty-bar .title-icon'),
                    controls = $('#empty-bar > .tile-controls > .binf-glyphicon');

                expect(header.length).toBeGreaterThan(0);
                expect(headerText).toEqual('Empty Bar Chart');
                expect(icon).toBeTruthy;
                expect(controls.hasClass('binf-hidden')).toBeTruthy;

            });

            it('footer exists and is hidden', () => {
                let footer = $('#empty-bar .tile-footer');

                expect(footer.length).toBeGreaterThan(0);
                expect(footer.hasClass('binf-hidden')).toBeTruthy;
            });

        });
    });
});