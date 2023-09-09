/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'webreports/controls/parameter.prompt/widget.prompt.wrapper.view',
    'webreports/widgets/nodestable.report/impl/nodestable.report.content.view',
], function (_, WidgetPromptWrapperView, NodesTableReportContentView) {

    var NodesTableReportView = WidgetPromptWrapperView.extend({

        className: 'webreports-nodestable-report-view',

        constructor: function NodesTableReportView(options) {
            if (options.data){
                options.data.parameterPrompt = "showPromptForm";
            }
            options.view = NodesTableReportContentView;
            WidgetPromptWrapperView.prototype.constructor.apply(this, arguments);
        },

        onRender: function(){
            var options = this.options,
                hasHeader = (!_.isUndefined(options.data.header) && options.data.header === false) ? false : true;

            if (hasHeader){
                this.$el.addClass("has-header");
            }
        }
    });

    return NodesTableReportView;

});