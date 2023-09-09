/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/lib/backbone',  // 3rd party libraries
    'csui/lib/binf/js/binf',
    'csui/controls/tile/behaviors/perfect.scrolling.behavior',
    'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
    'webreports/controls/carousel/carousel.view',
    'webreports/models/widget.carousel/widget.carousel.model'
], function (_, $, Marionette, Backbone, BINF, PerfectScrollingBehavior, LayoutViewEventsPropagationMixin, GenericCarousel, WidgetModel) {

    var CarouselContentView = GenericCarousel.extend({

        activeSlideIndex: 0,  // Index of the slide that's currently on the stage.
        CSUIWidgetCollection: new Backbone.Collection(),
        currentlyLoadingSlideIndex: 0, // Index of the slide that's being loading.
        currentWidgetID: null,
        currentWidgetOptions: null,
        currentWidgetContext: null,
        previousSlideIndex: 0, // Index of the slide that originally loaded and kicked off lazy-loading of the next slide (low-water mark)
        maxSlidesNum: 10,
        allSlidesSynced: false,
        supportedWidgets: {
            htmlWebReport: "webreports/widgets/tilereport",
            nodesListReport: "webreports/widgets/nodeslistreport",
            visualCount: "webreports/widgets/visual.data.filtered.count"
        },

        constructor: function CarouselContentView(options) {
            if (_.has(options.data, "widgets")) {
                if (options.data.widgets.length > this.maxSlidesNum) {
                    options.data.widgets.splice(this.maxSlidesNum);
                    console.warn("The maximum number of widgets allowed in the carousel is " + options.data.widgets.length + ".  The additional widgets have been removed from the carousel.");
                }
                _.each(options.data.widgets, function (options, index, list) {

                    if ((typeof options.options) === "string") {
                        options.options = JSON.parse(options.options);
                    }
                    if (options.type.slice(0, options.type.indexOf("/")).toLowerCase() !== "webreports" || options.type === "webreports/widgets/carousel") {
                        list.splice(index, 1);
                        console.warn("The " + options.type + " widget is not supported in the carousel.  It has been removed.");
                    }
                });

            } else {
                options.data.widgets = [];
            }
            _.extend(options, {collection: new Backbone.Collection(options.data.widgets)});
            GenericCarousel.prototype.constructor.apply(this, arguments);

            this.propagateEventsToRegions();

            _.bindAll(this, "onAfterSlide", "onBeforeSlide", "loadSlide", "loadWidget", "fetchWidget", "postWidgetLoad");
        },

        events: {
            "slide.binf.carousel": "onBeforeSlide",
            "slid.binf.carousel": "onAfterSlide",
            "click ol.binf-carousel-indicators > li": "onIndicatorClick"
        },
        onBeforeSlide: function (event) {
            var index = $(event.relatedTarget).index();

            this.loadSlide(index);
        },

        onAfterSlide: function (event) {
            var index = $(event.relatedTarget).index(),
                region = this.regionManager.get("slide" + index),
                currentWidget = this.collection.at(index);
            if (_.has(region, "currentView") && currentWidget.get("type").indexOf("visual.data") !== -1 && (!region.isChartRenderedInCarousel)) {
                region.currentView.triggerMethod("dom:refresh");
                region.isChartRenderedInCarousel = true;  // flag so this only runs the first time the slide transitions onto the stage

            }
        },

        onIndicatorClick: function (event) {

            if (!(this.allSlidesSynced)) {
                console.warn("Carousel controls are disabled until all slides are fully loaded");
                event.preventDefault();
                return false;
            }

        },

        onShowCarousel: function (parentEl) {

            var allSlides = parentEl.find(".carousel-slides-container .binf-carousel-inner").children();

            if (this.options.data.widgets.length > 0) {
                for (var i = 0; i < allSlides.length; i++) {
                    this.regionManager.addRegion("slide" + i, new Marionette.Region({
                        el: allSlides[i]
                    }));
                }

            } else {
                console.warn("The carousel is empty, please add some widgets");
                this.pauseCarousel();
            }
            if (this.options.data.behavior.auto_cycle && this.isCycling) {
                this.pauseCarousel();
            }
            this.regionManager.get('indicator_container').$el.find("li").addClass("carousel-content-loading");

        },

        onDomRefresh: function () {
            var firstSlideView,
                firstSlideRegion = this.regionManager.get("slide0"),
                currentWidget = this.collection.at(0);

            if (_.has(firstSlideRegion, "currentView") && currentWidget.get("type").indexOf("visual.data") !== -1) {

                firstSlideView = firstSlideRegion.currentView;
                firstSlideView.triggerMethod("dom:refresh");
                firstSlideRegion.isChartRenderedInCarousel = true;

            }

        },

        loadSlide: function (index) {

            var widgetPath,
                slideModel,
                slideCollection = this.regionManager.get("slide_container").currentView.collection;
            this.previousSlideIndex = this.currentlyLoadingSlideIndex;
            this.currentlyLoadingSlideIndex = index;
            if (!_.isUndefined(slideCollection)) {

                slideModel = slideCollection.at(index);

                if (!_.isUndefined(slideModel)) {
                    if (!slideModel.get("widget_loaded")) {

                        widgetPath = slideModel.get("type");
                        this.currentWidgetOptions = slideModel.get("options"); // passed when constructing the widget View later on
                        this.currentWidgetID = widgetPath;

                        this.loadWidget(widgetPath).done(this.fetchWidget);

                    } else {
                        this.postWidgetLoad();
                    }
                }
            }
        },
        loadWidget: function (id) {

            var widgetModel;

            widgetModel = new WidgetModel(
                {
                    id: id
                },
                {
                    includeView: true,
                    includeManifest: false,
                    includeServerModule: false,
                    includeToolItems: false
                });

            this.CSUIWidgetCollection.add(widgetModel);

            return widgetModel.fetch(); // This can take some time if the widget has a lot of collateral (views/templates/controls/etc)
        },
        fetchWidget: function () {

            var view,
                self = this,
                factory,
                childWidgetDataObject,
                originalWidgetOptions = this.collection.at(this.currentlyLoadingSlideIndex).get("options"),
                region = this.regionManager.get("slide" + this.currentlyLoadingSlideIndex),
                widgetModel = this.CSUIWidgetCollection.get(this.currentWidgetID),
                WidgetView = widgetModel.get('view');
            view = new WidgetView({
                context: this.options.context,
                data: originalWidgetOptions
            });
            region.show(view);

            this._checkForExpandingWidgets(widgetModel, view);
            if (_.isFunction(view.getContentViewFactory)) {
                factory = view.getContentViewFactory();
                if (factory) {
                    childWidgetDataObject = factory.property;
                }
            }
            if (typeof childWidgetDataObject !== "undefined") {
                this.listenTo(childWidgetDataObject, "sync", _.bind(this.onChildSync, this, view, this.currentlyLoadingSlideIndex));
                factory.fetch();
            } else {
                this.listenToOnce(view, "factory:fetched:after:prompt", function(args){
                    var promise = args.promise;

                    if (promise){
                        promise.done(function(){
                            self._checkForExpandingWidgets(widgetModel, view);
                        });
                    }
                });
                this.triggerMethod("child:sync", view, this.currentlyLoadingSlideIndex);
            }

            this.postWidgetLoad();

        },
        postWidgetLoad: function () {

            var nextWidgetModel,
                isLastSlide = (this.collection.length === (this.currentlyLoadingSlideIndex + 1)),
                currentWidget = this.collection.at(this.currentlyLoadingSlideIndex);

            if (this.currentlyLoadingSlideIndex === 0) {
                this._restoreIndicators("li.binf-active");
            }
            if (!currentWidget.get("widget_loaded")) {
                currentWidget.set("widget_loaded", true);
            }
            if (!isLastSlide) {

                nextWidgetModel = this.collection.at(this.currentlyLoadingSlideIndex + 1);
                if (nextWidgetModel.get("widget_loaded") !== true) {
                    this.loadSlide(this.currentlyLoadingSlideIndex + 1);
                }

            }
        },

        _restoreIndicators: function (selector) {
            if (selector) {
                this.regionManager.get('indicator_container').$el.find(selector).animate({
                    "height": "16px",
                    "margin-bottom": "0px"
                }).removeClass("carousel-content-loading");
            }
        },

        _checkForExpandingWidgets: function(widgetModel, view){
            var widgetContentView,
                widgetID = widgetModel.get('id'),
                supportedWidgets = this.supportedWidgets;
            if (widgetID === supportedWidgets.nodesListReport ||
                (widgetID === supportedWidgets.visualCount && view.options && view.options.data && view.options.data.expandable === true)) {

                widgetContentView = this._getContentView(view);

                this._setExpandingWidgetListeners(widgetContentView);
            }
        },

        _getContentView: function(view){
            var widgetContentView;

            if (_.isFunction(view.getChildView)){
                widgetContentView = view.getChildView('content');
            }

            if (!widgetContentView){
                widgetContentView = view;
            }

            return widgetContentView;
        },

        _setExpandingWidgetListeners: function(widgetContentView){
            this.listenTo(widgetContentView, "expand", this.onExpandWidget);
            this.listenTo(widgetContentView, "collapse", this.onCollapseWidget);
        },

        onChildSync: function (view, index) {

            var syncCheck,
                requestedWidget = this.collection.at(index);
            requestedWidget.set("widget_synced", true);
            syncCheck = this.collection.where({"widget_synced": true});

            if (syncCheck.length === this.collection.length) {
                this.onAllSlidesSynced();
            }

        },

        onAllSlidesSynced: function () {
            if (this.options.data.behavior.auto_cycle) {
                this.startCarousel();
            }
            this._restoreIndicators("li:not('.binf-active')");
            this.allSlidesSynced = true;
        },
        onChildFilterValueChange: function(view) {
            if ( view.ui.searchInput.val() === "" ) {
                this.onCollapseWidget();
            } else {
                this.onExpandWidget();
            }
        },

        onExpandWidget: function () {
            if (this.isCycling) {
                this.pauseCarousel();
            }
        },

        onCollapseWidget: function () {
            if ((!this.isCycling) && this.options.data.behavior.auto_cycle) {
                this.startCarousel();
            }
        }

    });

    _.extend(CarouselContentView.prototype, LayoutViewEventsPropagationMixin);

    return CarouselContentView;

});