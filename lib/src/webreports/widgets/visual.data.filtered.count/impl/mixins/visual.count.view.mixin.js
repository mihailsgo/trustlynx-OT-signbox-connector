/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/jquery',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/utils/base',
    'csui/controls/toolbar/toolitems.factory',
    'csui/utils/contexts/factories/connector',
    'csui/models/node/node.model',
    'csui/models/nodes',
    'webreports/widgets/visual.data.filtered.count/impl/utils/contexts/factories/visual.count.collection.factory',
    'webreports/widgets/visual.data.filtered.count/impl/models/visual.count/column.collection/column.collection',
    'webreports/widgets/visual.data.filtered.count/impl/models/visual.count/chart.controls/chart.controls.model',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count.tile/visual.count.controls/visual.count.controls.view',
    'webreports/widgets/visual.data.filtered.count/impl/mixins/nls/lang',
    'csui/utils/deepClone/deepClone'
], function ($,
             _,
             Backbone,
             base,
             ToolItemsFactory,
             ConnectorFactory,
             NodeModel,
             NodeCollection,
             VisualCountCollectionFactory,
             VisualCountColumnCollection,
             VisualCountChartControlsModel,
             VisualCountControlsView,
             lang) {
    "use strict";

    var VisualCountViewMixin = {

        mixin: function (prototype) {
            return _.extend(prototype, {

                defaults: {
                    theme: "otPrimary",
                    titleBarIcon: "title-icon title-webreports",
                    groupAfterBar: 10,
                    groupAfterPie: 5,
                    filterable: false,
                    animate: true,
                    expandable: false,
                    showAsPercentage: false,
                    showLegend: true,
                    commandRowLimit: 5000,
                    commandHardRowLimit: 50000
                },

                groupAfterIsValid: function(groupAfter){
                    return (groupAfter >= 2 && groupAfter <= 20);
                },

                getGroupAfterDefault: function(chartType){
                    return ( chartType === "pie" || chartType === "donut" ) ? this.defaults.groupAfterPie : this.defaults.groupAfterBar;
                },

                validateVisualCountOptions: function(options){

                    var commandRowLimit,
                        defaults = this.defaults,
                        launchButtonConfig = options.launchButtonConfig;

                    options.titleBarIcon = ( _.has(options, 'titleBarIcon')) ? 'title-icon '+ options.titleBarIcon : defaults.titleBarIcon;
                    options.filterable = _.has(options, 'filterable') && _.isBoolean(options.filterable) ? options.filterable : defaults.filterable;
                    options.animate = _.has(options, 'animate') && _.isBoolean(options.animate) ? options.animate : defaults.animate;
                    options.expandable = _.has(options, 'expandable') && _.isBoolean(options.expandable) ? options.expandable : defaults.expandable;
                    options.theme = _.has(options, 'theme') ? options.theme : defaults.theme;
                    options.viewValueAsPercentage = _.has(options, 'viewValueAsPercentage') && _.isBoolean(options.viewValueAsPercentage) ? options.viewValueAsPercentage : defaults.showAsPercentage;
                    options.groupAfter = _.has(options, 'groupAfter') && this.groupAfterIsValid(options.groupAfter) ? parseInt(options.groupAfter, defaults.groupAfterBar) : this.getGroupAfterDefault(options.type);
                    options.showLegend = _.has(options, 'showLegend') && _.isBoolean(options.showLegend) ? options.showLegend : defaults.showLegend;

                    if (launchButtonConfig){
                        commandRowLimit = launchButtonConfig.rowLimit;

                        if (!_.isNumber(commandRowLimit) || _.isNaN(commandRowLimit)){
                            commandRowLimit = defaults.commandRowLimit;
                        }

                        if (commandRowLimit > defaults.commandHardRowLimit){
                            commandRowLimit = defaults.commandHardRowLimit;
                        }

                        launchButtonConfig.rowLimit = commandRowLimit;
                    }

                    return options;
                },

                validateCollections: function(options){
                    var defaults = this.defaults;

                    if (options.chartCollection){
                        this.chartCollection = options.chartCollection;
                    } else {
                        throw 'VisualCountView requires a chart collection';
                    }

                    if (options.columnCollection){
                        this.columnCollection = options.columnCollection;
                    } else {
                        throw 'VisualCountView requires a column collection';
                    }

                    if (options.facetCollection){
                        this.facetCollection = options.facetCollection;
                    } else {
                        throw 'VisualCountView requires a facet collection';
                    }
                    if (options.chartOptionsModel){
                        this.chartOptionsModel = options.chartOptionsModel;
                    } else {
                        this.chartOptionsModel = new Backbone.Model({
                            "themeName": options.theme || defaults.theme,
                            "showAsPercentage": _.has(options,'showAsPercentage') && _.isBoolean(options.showAsPercentage) ? options.showAsPercentage : defaults.showAsPercentage,
                            "animate": options.animate || defaults.animate,
                            "showLegend": _.has(options,'showLegend') && _.isBoolean(options.showLegend) ? options.showLegend : defaults.showLegend
                        });
                    }
                },

                getToolbarItems: function(options){
                    var toolbarItems,
                        toolbarItemsModels,
                        launchButtonConfig = options.launchButtonConfig,
                        rowLimit = launchButtonConfig.rowLimit,
                        launchButtons = launchButtonConfig.launchButtons;

                    toolbarItemsModels = _.chain(launchButtons)
                                .reject(function(launchButton){
                                    var launchButtonID = launchButton.launchButtonID;
                                    return !launchButtonID || !_.isNumber(launchButtonID);
                                })
                                .map(function(launchButton){
                                    var context = options.context,
                                        connector = context.getObject(ConnectorFactory),
                                        buttonNode = new NodeModel({
                                            id: launchButton.launchButtonID
                                        }, {connector: connector});

                                    return {
                                        signature: "OpenWebReport",
                                        name: base.getClosestLocalizedString(launchButton.launchButtonLabel, lang.launchReport),
                                        toolTip: base.getClosestLocalizedString(launchButton.launchButtonTooltip, lang.launchReportTooltip),
                                        status: {
                                            nodes: new NodeCollection([buttonNode])
                                        }
                                    };
                                })
                                .value();

                    if (toolbarItemsModels.length > 0){
                        toolbarItems = {
                            footer: new ToolItemsFactory({
                                    right: toolbarItemsModels
                                },
                                {
                                    rowLimit: rowLimit
                                }
                            )

                        };
                    }

                    return toolbarItems;
                },

                getToolbarItemNodes: function(){
                    var toolbarItemsFooter,
                        status,
                        toolbarItemsFooterCollection,
                        nodePromises = [],
                        toolbarItemNodes = [],
                        options = this.options,
                        context = options.context,
                        toolbarItems = options.toolbarItems;

                    if (toolbarItems){
                        toolbarItemsFooter  = toolbarItems.footer;
                        if (toolbarItemsFooter){
                            toolbarItemsFooterCollection = toolbarItemsFooter.collection;

                            toolbarItemsFooterCollection.each(function(toolbarItemsFooterModel){
                                if (toolbarItemsFooterModel.get("group") === "right"){
                                    status = _.extend( {context: context},toolbarItemsFooterModel.get("status"));
                                    if (_.has(status, "nodes") && status.nodes.length > 0){
                                        toolbarItemNodes.push(status.nodes.at(0));
                                    }
                                }
                            });
                        }
                    }

                    if (toolbarItemNodes.length > 0){
                        _.each(toolbarItemNodes, function(toolbarItemNode){
                            nodePromises.push(toolbarItemNode.fetch());
                        });

                        var successFunc = function (response) {
                                console.debug(response);
                            },
                            failureFunc = function (response) {
                                console.log(response);
                            };

                        $.when(nodePromises)
                            .then(successFunc, failureFunc);
                    }
                },

                setVisualCountWidgetOptions: function(options){
                    if (!(options && options.data)) {
                        throw 'VisualCount widget requires valid widget options';
                    }

                    var modelOptions,
                        toolbarItems,
                        columnCollection,
                        visualCountWidgetOptions = _.deepClone(options.data);

                    visualCountWidgetOptions.context = options.context;

                    visualCountWidgetOptions = this.validateVisualCountOptions(visualCountWidgetOptions);
                    modelOptions = this.setCommonModelOptions(options);

                    _.extend(modelOptions, {
                        visType: visualCountWidgetOptions.type, // visType is used to send to the server via Rest
                        type: visualCountWidgetOptions.type,
                        activeColumn: visualCountWidgetOptions.activeColumn,
                        themeName: visualCountWidgetOptions.theme, // 'theme' is the key that comes from the manifest, but 'themeName' is the key used in the chart control :-(
                        filters: visualCountWidgetOptions.filters,
                        filterable: visualCountWidgetOptions.filterable,
                        expandable: visualCountWidgetOptions.expandable,
                        viewValueAsPercentage: visualCountWidgetOptions.viewValueAsPercentage,
                        sortBy: visualCountWidgetOptions.sortBy,
                        sortOrder: visualCountWidgetOptions.sortOrder,
                        groupAfter: visualCountWidgetOptions.groupAfter,
                        showLegend: visualCountWidgetOptions.showLegend
                    });
                    this.setFactory(this.getWidgetFactory(options, VisualCountCollectionFactory, modelOptions));
                    visualCountWidgetOptions.chartCollection = options.context.getCollection(VisualCountCollectionFactory, {attributes: modelOptions});

                    visualCountWidgetOptions.columnCollection = visualCountWidgetOptions.chartCollection.columnCollection;
                    visualCountWidgetOptions.facetCollection = visualCountWidgetOptions.chartCollection.facetCollection;
                    if (_.has(options.data, 'type') && options.data.type === 'bar'){
                        visualCountWidgetOptions.chartType = 'verticalBar';
                    } else {
                        visualCountWidgetOptions.chartType = options.data.type;
                    }

                    if (visualCountWidgetOptions.launchButtonConfig){
                        toolbarItems = this.getToolbarItems(visualCountWidgetOptions);
                        if (toolbarItems){
                            visualCountWidgetOptions.toolbarItems = toolbarItems;
                            this.listenToOnce(visualCountWidgetOptions.chartCollection, "sync", this.getToolbarItemNodes);
                        }
                    }

                    return visualCountWidgetOptions;
                },

                createChartControlsView: function(options){
                    var chartControlOptions = {
                            activeColumn: options.activeColumn,
                            themeName: options.theme, // 'theme' is the key that comes from the manifest, but 'themeName' is the key used in the chart control :-(
                            type: options.type,
                            sortBy: options.sortBy,
                            sortOrder: options.sortOrder,
                            viewValueAsPercentage: options.viewValueAsPercentage,
                            groupAfter: options.groupAfter,
                            chartCollection: this.chartCollection,
                            columnCollection: this.columnCollection,
                            showLegend: options.showLegend
                        };

                    if (options.chartControlsModel){
                        chartControlOptions.model = options.chartControlsModel;
                    }

                    this.chartControlsView = new VisualCountControlsView(chartControlOptions);

                    this.listenTo(this.chartControlsView, "chart:options:updated", this.onChartOptionsUpdated);
                }

            });
        }

    };

    return VisualCountViewMixin;
});
