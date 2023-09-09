/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/controls/tile/tile.view',
    'csui/utils/contexts/factories/connector',
    'csui/utils/base',
    'csui/controls/tile/behaviors/perfect.scrolling.behavior',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/impl/expanding.behavior',
    'csui/controls/charts/visual.count/visual.count.view',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/visual.count.view',
    'webreports/mixins/webreports.view.mixin',
    'webreports/widgets/visual.data.filtered.count/impl/mixins/visual.count.view.mixin',
    'i18n!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/impl/nls/lang',
    'hbs!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/impl/visual.count.tile',
    'css!webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/impl/visual.count.tile',
    'css!webreports/style/webreports.css'
], function (_,
    $,
    Backbone,
    TileView,
    ConnectorFactory,
    base,
    PerfectScrollingBehavior,
    ExpandingBehavior,
    VisualCountChartView,
    VisualDataExpanded,
    WebReportsViewMixin,
    VisualCountViewMixin,
    lang,
    template) {

    var VisualCountTileView = TileView.extend({

        contentView: VisualCountChartView,

        ui: {
            overlayClip: '.webreports-visual-count-overlay-clip',
            toggleSettings: '.webreports-visual-count-btn-options > span',
            overlay: '.webreports-visual-count-overlay',
            footer: '.tile-footer',
            expandButton: '.cs-more'
        },

        constructor: function VisualCountTileView(options) {

            if (options && _.has(options, 'id') && this._isTileWidget(options)) {
                options.showLegend = false;
            }

            options = this.validateVisualCountOptions(options);

            this.validateCollections(options);

            this._setContentViewOptions(options);

            TileView.prototype.constructor.apply(this, arguments);

            this.createChartControlsView(options);

        },

        behaviors: function () {
            var behaviors = {
                PerfectScrolling: {
                    behaviorClass: PerfectScrollingBehavior,
                    contentParent: ".tile-content",
                    suppressScrollX: false,
                    scrollYMarginOffset: 10
                }
            };

            if (this.options.expandable) {
                behaviors.Expanding = {
                    behaviorClass: ExpandingBehavior,
                    titleBarIcon: function () {
                        return this.options.titleBarIcon;
                    },
                    dialogTitle: function () {
                        var title = base.getClosestLocalizedString(this.options.title, lang.dialogTitle);
                        return title;
                    },
                    dialogTitleIconRight: "icon-tileCollapse",
                    dialogClassName: 'webreports-visual-data',
                    expandedView: function () {
                        return VisualDataExpanded;
                    },
                    expandedViewOptions: function () {
                        var options = this.options,
                            expandedOptions = {
                                context: options.context,
                                chartCollection: this.chartCollection,
                                columnCollection: this.columnCollection,
                                facetCollection: this.facetCollection,
                                type: options.chartType,
                                theme: this.chartOptionsModel.get("themeName"),
                                chartControlsModel: options.chartCollection.chartControlsModel,
                                chartOptionsModel: this.chartOptionsModel,
                                toolbarItems: options.toolbarItems
                            };

                        return expandedOptions;
                    }
                };
            }

            return behaviors;
        },

        regions: function () {
            var regions = _.extend({
                visualizationControls: '.webreports-visual-count-controls-parent'
            }, TileView.prototype.regions);
            return regions;
        },

        events: {
            'click @ui.toggleSettings': 'toggleSettings',
            'keyup @ui.toggleSettings': 'toggleSettings',
            'keyup @ui.expandButton': 'keyboardExpand'
        },

        keyboardExpand: function (event, options) {
            event.preventDefault();
            if ((event.type === "keyup" && (event.keyCode === 13 || event.keyCode === 32))) {
                this.triggerMethod('expand', options);
            }
        },

        toggleSettings: function (event) {
            event.preventDefault();
            if (event.type === "click" || (event.type === "keyup" && (event.keyCode === 13 || event.keyCode === 32))) {
                if (this.overlayVisible) {
                    $('.webreports-visual-count-overlay', this.$el).removeClass('visible')
                    .addClass('binf-hidden');
                    $('.cs-more', this.$el).attr('tabindex', '0');
                    this.overlayVisible = false;
                } else {
                    this.getRegion('visualizationControls').show(this.chartControlsView);
                    $('.webreports-visual-count-overlay', this.$el).addClass('visible')
                    .removeClass('binf-hidden');
                    $('.cs-more', this.$el).attr('tabindex', '-1');
                    this.overlayVisible = true;
                }
            }

         },

        template: template,

        templateHelpers: function () {
            var helpers = {
                title: base.getClosestLocalizedString(this.options.title, lang.dialogTitle),
                icon: this.options.titleBarIcon || 'title-webreports',
                activeColumn: this.options.activeColumn || '',
                filterable: this.options.filterable,
                parameters: lang.parameters,
                chartOptions: lang.chartOptions
            };

            if (this.options.parameterPrompt === 'showPromptForm') {
                _.extend(helpers, {
                    showParameterEditBtn: true
                });
            }

            return helpers;
        },

        onChartOptionsUpdated: function (args) {
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

        _setContentViewOptions: function (options) {
            this.contentViewOptions = {
                context: options.context,
                chartType: options.type,
                collection: options.chartCollection,
                columns: options.columnCollection,
                chartOptions: this.chartOptionsModel
            };

            this.listenToOnce(options.chartCollection, "sync", this._showControls);
        },

        _showControls: function () {
            if (!this.chartCollection.isEmpty()) {
                if (this.options.filterable) {
                    this.ui.toggleSettings.removeClass("binf-hidden");
                }
                if (this.options.expandable) {
                    this.ui.footer.removeClass("binf-hidden");
                    var expandButtonContext = $('.tile-content > .csui-visual-count-container').parentElement,
                        expandButton = $('.tile-footer > .cs-more.tile-expand', expandButtonContext);
                    if (expandButton) {
                        expandButton.addClass('csui-acc-tab-region').attr('tabindex', '0');
                    }
                }
            }
        },

        _isTileWidget: function (options) {
            var widgetCollection,
                isTileWidget = false;

            if (options && _.has(options, 'context') && _.has(options.context, 'perspective') && _.has(options.context.perspective.get('options'), 'widgets')) {
                widgetCollection = options.context.perspective.get('options').widgets;

                widgetCollection = _.filter(widgetCollection, function (widget) {
                    return (widget.kind && widget.kind === 'tile');
                });

                if (widgetCollection.length) {
                    isTileWidget = _.every(widgetCollection, function (widget) {
                        return (_.has(widget, 'options') && _.has(widget.options, 'id') && (widget.options.id === options.id));
                    });
                }
            }
            return isTileWidget;
        }
    });

    WebReportsViewMixin.mixin(VisualCountTileView.prototype);
    VisualCountViewMixin.mixin(VisualCountTileView.prototype);

    return VisualCountTileView;

});
