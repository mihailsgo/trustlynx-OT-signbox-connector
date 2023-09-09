/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/lib/marionette',
    'csui/utils/base',
    'csui/controls/progressblocker/blocker',
    'csui/controls/tile/tile.view',
    'csui/controls/tile/behaviors/perfect.scrolling.behavior',
    'csui/behaviors/item.error/item.error.behavior',
    'webreports/utils/contexts/factories/wrtext.model.factory',
    'webreports/mixins/webreports.view.mixin',
    'webreports/utils/general.utils',
    'i18n!webreports/widgets/tilereport/impl/nls/tilereport.lang',
    'hbs!webreports/widgets/tilereport/impl/tilereport',
    'csui/lib/perfect-scrollbar',
    'css!webreports/widgets/tilereport/impl/tilereport',
    'css!webreports/style/webreports.css'
], function (_, $, Backbone, Marionette, base, BlockingView, TileView, PerfectScrollingBehavior, ItemErrorBehavior, WrTextModelFactory, WebReportsViewMixin, generalUtils, lang, template) {
    var ScriptExecutingRegion = Marionette.Region.extend({
        attachHtml: function(view) {
            this.$el.html('').append(view.el);
        }
    });
    var ContentView = Marionette.ItemView.extend({

        constructor: function(options){
            BlockingView.imbue(this);
            Marionette.ItemView.prototype.constructor.apply(this, arguments);
        },

        className: 'webreports-tilereport-content',

        events: {
            'keydown': 'onKeyInView',
            'click .cs-go-back': 'onBackButton'
        },

        render: function () {

            var source;

            if (this.model) {
                source = this.model.get('source');
                if (!_.isUndefined(source)) {
                    this.$el.html(source);
                }
            }

            return this;
        }

    });

    var TileReportContentView = TileView.extend({

        className: 'webreports-tilereport-content-view',

        behaviors: {

            PerfectScrolling: {
                behaviorClass: PerfectScrollingBehavior,
                contentParent: '> .tile-content',
                suppressScrollX: true,
                scrollYMarginOffset: 15,
                scrollingDisabled: function () {
                    return !this.options.data.scroll;
                }
            },

            ItemError: {
                behaviorClass: ItemErrorBehavior,
                errorView: this.view,
                errorViewOptions: function () {

                    var error = this.model.error,
                        message = error.message,
                        messageDetails = error.errorDetails;

                    return {
                        model: new Backbone.Model({
                            message: message,
                            title: messageDetails
                        })
                    };
                }
            }
        },
        constructor: function TileReportContentView(options) {

            if (options && options.data) {
                var thisView = this,
                    header = ( _.has(options.data, 'header')) && _.isBoolean(options.data.header) ? options.data.header : true,
                    scroll = (_.has(options.data, 'scroll')) && _.isBoolean(options.data.scroll) ? options.data.scroll : true,
                    modelOptions,
                    model,
                    factory;

                options.data.header = header;
                options.data.scroll = scroll;

                options.data.titleBarIcon = ( _.has(options.data, 'titleBarIcon')) ? 'title-icon '+ options.data.titleBarIcon : 'title-icon title-webreports';

                modelOptions = this.setCommonModelOptions(options);
                factory = this.getWidgetFactory(options, WrTextModelFactory, modelOptions);
                model = options.context.getModel(WrTextModelFactory, { attributes: modelOptions } );

                this.setFactory(factory);
                options.model = model;

                this.listenTo(options.model, 'change', function() {
                    thisView.render();
                    thisView._updateScrollbar();
                });

                if (options.blockingParentView) {
                    BlockingView.delegate(this, options.blockingParentView);
                } else {
                    BlockingView.imbue(this);
                }

                this.contentViewOptions = options;

            }
            TileView.prototype.constructor.apply(this, arguments);
        },

        _updateScrollbar: function () {
            this.triggerMethod('update:scrollbar', this);
        },

        waitingOnServer: function() {
            this.blocking = true;
            this.blockActions();
        },

        responseFromServer: function() {
            this.blocking = false;
            this.unblockActions();
            this.render();
        },

        regionClass: ScriptExecutingRegion,

        contentView: ContentView,

        template: template,

        templateHelpers: function () {

            var context = this.getOption("context"),
                helpers = {
                    title: base.getClosestLocalizedString(this.options.data.title, lang.dialogTitle),
                    icon: this.options.data.titleBarIcon
                };

            helpers.wrNode = generalUtils.isWebReportNodeContext(context);
            if (this.options.data.header === true) {
                _.extend(helpers, {
                    header: this.options.data.header
                });
            }

            if (this.options.data.parameterPrompt === 'showPromptForm' && _.has(this.options.data,'parameters') && this.options.data.parameters.length) {
                _.extend(helpers, {
                    showParameterEditBtn: true
                });
            }

            return helpers;

        },

        onRender: function () {

            if (this.contentView && typeof this.contentView === "object") {
                this.contentView = this.contentView.constructor;
            }

            if (this.options.data.header === false) {

                this.$(".tile-content")
                    .height("100%")
                    .css('margin-top', '0px');
            }
        }

    });
    WebReportsViewMixin.mixin(TileReportContentView.prototype);

    return TileReportContentView;

});