/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'webreports/controls/parameter.prompt/widget.prompt.wrapper.view',
    'webreports/widgets/visual.count.full.page/impl/visual.count.full.page.content.view'
], function (WidgetPromptWrapperView, VisualCountFullPageContentView) {

    var VisualCountFullPageView = WidgetPromptWrapperView.extend({

        className: 'webreports-visual-count-fp-view',

        constructor: function VisualCountFullPageView(options) {
            if (options.data){
                options.data.parameterPrompt = "showPromptForm";
            }

            options.view = VisualCountFullPageContentView;

            WidgetPromptWrapperView.prototype.constructor.apply(this, arguments);
        },

        onDomRefresh: function(){
            var contentView = this.getChildView("content");
            if (contentView){
                contentView.triggerMethod('dom:refresh');
            }
        }
    });

    return VisualCountFullPageView;

});
