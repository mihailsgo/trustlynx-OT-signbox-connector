/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/marionette3',
    'csui/utils/base',
    'webreports/widgets/visual.data.filtered.count/impl/controls/visual.count/visual.count.view',
    'webreports/mixins/webreports.view.mixin',
    'webreports/utils/general.utils',
    'webreports/widgets/visual.data.filtered.count/impl/mixins/visual.count.view.mixin',
    'hbs!webreports/widgets/visual.count.full.page/impl/visual.count.full.page',
    'i18n!webreports/widgets/visual.count.full.page/impl/nls/lang',
    'css!webreports/widgets/visual.count.full.page/impl/visual.count.full.page'
], function (_,
             Marionette,
             base,
             VisualCountView,
             WebReportsViewMixin,
             generalUtils,
             VisualCountViewMixin,
             template,
             lang) {

    var VisualCountFullPageContentView = Marionette.View.extend({

        template: template,

        className: 'webreports-visual-count-fp-content-view',

        ui: {
            visualCount: '.webreports-visual-count-container',
        },

        regions: {
            visualCount: {
                el: '.webreports-visual-count-container',
                replaceElement: true
            }
        },

        constructor: function VisualCountFullPageContentView(options) {
            options = this.setVisualCountWidgetOptions(options);
            Marionette.View.prototype.constructor.apply(this, options);
            this.options = options;
            this._createVisualCountView();
        },

        templateContext: function () {
            var context = this.getOption("context"),
                options = this.options;

            return {
                title: base.getClosestLocalizedString(options.title, lang.visualCount),
                icon: options.titleBarIcon,
                header: (!_.isUndefined(options.header) && options.header === false) ? false : true,
                wrNode: generalUtils.isWebReportNodeContext(context)
            };
        },

        onDomRefresh: function(){
            this.showChildView('visualCount', this.visualCountView);
        },

        _createVisualCountView: function(){
            this.visualCountView = new VisualCountView(this.options);
        }
    });

    WebReportsViewMixin.mixin(VisualCountFullPageContentView.prototype);
    VisualCountViewMixin.mixin(VisualCountFullPageContentView.prototype);

    return VisualCountFullPageContentView;

});
