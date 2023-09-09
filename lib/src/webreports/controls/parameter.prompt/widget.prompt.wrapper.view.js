/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/marionette3',
    'csui/lib/backbone',
    'csui/lib/jquery',
    'csui/models/node/node.model',
    'csui/controls/progressblocker/blocker',
    'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
    'webreports/utils/general.utils',
    'webreports/utils/url.webreports',
    'webreports/mixins/webreports.view.mixin',
    'webreports/utils/contexts/factories/run.webreport.pre.controller.factory',
    'webreports/controls/parameter.prompt/parameter.prompt.tile.view',
    'hbs!webreports/controls/parameter.prompt/impl/widget.prompt.wrapper'
], function(_,
            Marionette,
            Backbone,
            $,
            NodeModel,
            BlockingView,
            ViewEventsPropagationMixin,
            generalUtils,
            UrlWebreports,
            WebReportsViewMixin,
            RunWrPreControllerFactory,
            ParameterPromptTileView,
            template) {

    var WidgetPromptWrapperView = Marionette.View.extend({

        template: template,

        wrapTemplate: false,

        regions: {
            content: {
                el: '.webreports-widget-prompt-wrapper-content',
                replaceElement: true
            }
        },

        ui: {
            showParametersBtn: '.webreports-visual-count-btn-parameters',
            tileHeader: '.tile-header'
        },

        events: {
            'click @ui.showParametersBtn': 'onShowParameterPromptView',
            'keyup @ui.showParametersBtn': 'onShowParameterPromptView',
            'keydown .cs-go-back': 'onKeyInView',
            'click .cs-go-back': 'onBackButton'
        },

        constructor: function WidgetPromptWrapperView(options) {
            var promptOptions,
                node,
                thisView = this,
                showPrompt = (options.data.parameterPrompt === 'showPromptForm' ||
                                (options.data.outputDestination && options.data.outputDestination === "fullpagewidget"));

            this.showPrompt = showPrompt;
            this.widgetView = options.view;

            if (showPrompt) {

                node = new NodeModel({
                    id: options.data.id,
                    type: 30303 // webreport
                });

                promptOptions = {
                    node: node,
                    context: options.context,
                    suppressPromptView: true,
                    originatingView: this
                };

                var getPromptView = this._getPromptView(promptOptions, options);

                getPromptView
                    .done(function (options) {
                        if (options) {
                            thisView.promptOptions = options;
                            thisView.listenTo(thisView, 'prompt:form:submitted', thisView.onPromptFormSubmitted);
                            thisView._showParameterPromptView();
                        }
                        else {
                            thisView._showWidgetView();
                            thisView._fetchWidgetFactory();
                        }
                    })
                    .fail(function(options){
                        thisView.promptOptions = options;
                        thisView._showParameterPromptView();
                    });
            }

            Marionette.View.prototype.constructor.apply(this, arguments);

            this.listenTo(this, "factory:fetched:after:prompt", this._showParameterBtn);
        },

        templateContext: function() {
            return {
                showPrompt: this.showPrompt
            };
        },

        onShowParameterPromptView: function(event) {
            if (event.type === "click" || (event.type === "keyup" && (event.keyCode === 13 || event.keyCode === 32))) {
                event.stopPropagation();
                this.trigger('edit:prompt:clicked');
                this._showParameterPromptView();
            }
            return false;
        },

        _showParameterPromptView: function() {
            var parameterPromptTileView,
                promptOptions = this.promptOptions;

            if (promptOptions) {
                if (_.has(promptOptions.originatingView,'formValues')) {
                    promptOptions.model.set({data: promptOptions.originatingView.formValues});
                }
                parameterPromptTileView = new ParameterPromptTileView(promptOptions);

                this.showChildView('content', parameterPromptTileView);

                this.propagateEventsToViews(parameterPromptTileView);
            }
        },

        _createWidgetView: function(){
            var ContentView = this.widgetView,
                contentOptions;

            contentOptions = _.extend(this.options,{
                originatingView: this
            });

            return new ContentView(contentOptions);
        },

        _showWidgetView: function() {
            var contentView = this._createWidgetView();

            this.showChildView('content', contentView);

            this.propagateEventsToViews(contentView);
        },

        _fetchWidgetFactory: function() {
            var factoryFetchPromise,
                factory = this.getContentViewFactory();

            if (factory){
                factoryFetchPromise = factory.fetch();
            } else {
                console.error("Could not find the factory for widget.");
            }
            return factoryFetchPromise;
        },

        getContentViewFactory: function(){
            var factory,
                contentView = this.getChildView("content");

            if (contentView){
                factory = contentView.getFactory();
            }

            return factory;
        },

        _getPromptView: function(promptOptions, options) {
            var isWebReportNodeContext = generalUtils.isWebReportNodeContext(options.context),
                factoryOptions = {
                    detached: true,
                    unique: !isWebReportNodeContext,
                    attributes: {
                        id: promptOptions.node.get("id")
                    },
                    options: {
                        id: promptOptions.node.get("id")
                    }
                },
                runWRController = options.context.getObject(RunWrPreControllerFactory, factoryOptions),
                promptParameters = runWRController.getPromptCheckPromise(),
                deferred = $.Deferred();

            if (promptParameters && isWebReportNodeContext){
                if (options && options.data && !options.data.parameters){
                    options.data.parameters = [];
                }
                _.extend(options.data.parameters, UrlWebreports.getDataAsWebReportParameters(runWRController.options.parameters));
            } else {
                promptParameters = runWRController.checkForPromptParameters(promptOptions);
            }

            promptOptions.model = runWRController.runWRPreModel;

            $.when(promptParameters).then(function(promptRoute) {

                if (promptRoute === 'showSmartPrompts') {

                    promptOptions.promptRoute = promptRoute;

                    options.data.parameterPrompt = "showPromptForm";

                    deferred.resolve(promptOptions);
                }
                else {
                    deferred.resolve();
                }

            }, function(){
                deferred.reject(promptOptions);
            });

            return deferred.promise();
        },

        _mergeParametersIntoOptions: function(eventArgs) {
            var options = this.options || {};
            this.formValues = _.mapObject(eventArgs.formValues, function(val, key){
                if (_.isNaN(val)){
                    val = null;
                }
                return val;
            });

            options.data.parameters = (_.has(options,'data') && _.has(options.data,'parameters') && _.isArray(options.data.parameters)) ? options.data.parameters : [];
            _.extend(options.data.parameters, UrlWebreports.getDataAsWebReportParameters(this.formValues));
        },

        _showParameterBtn: function(){
            var editParameterBtn = this.$el.find(".webreports-widget-parameters-btn.binf-hidden");

            if (editParameterBtn){
                editParameterBtn.removeClass("binf-hidden");
            }
        },

        onPromptFormSubmitted: function (eventArgs) {
            this._mergeParametersIntoOptions(eventArgs);
            this._showWidgetView();
            var promise = this._fetchWidgetFactory();
            this.trigger("factory:fetched:after:prompt", {
                promise: promise
            });
        },

        onRender: function() {
            if (this.showPrompt) {
                this._showParameterPromptView();
            } else {
                this._showWidgetView();
            }
        },

        onKeyInView: function (event) {
            if (event.keyCode === 32 || event.keyCode === 13) {
                this.onBackButton();
            }
        },

        onBackButton: function() {
            var context = this.options.context,
                viewStateModel = context && context.viewStateModel;
            if (viewStateModel) {
                viewStateModel.restoreLastFragment();
            }
        }

    });
    WebReportsViewMixin.mixin(WidgetPromptWrapperView.prototype);
    _.extend(WidgetPromptWrapperView.prototype, ViewEventsPropagationMixin);

    return WidgetPromptWrapperView;

});