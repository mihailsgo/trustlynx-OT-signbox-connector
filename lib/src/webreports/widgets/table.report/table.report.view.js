/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'webreports/controls/parameter.prompt/widget.prompt.wrapper.view',
    'webreports/widgets/table.report/impl/table.report.content.view',
], function (_, WidgetPromptWrapperView, TableReportContentView) {

    var TableReportView = WidgetPromptWrapperView.extend({

        className: 'webreports-table-report-view',

        constructor: function TableReportView(options) {
            if (options.data){
                options.data.parameterPrompt = "showPromptForm";
            }
            options.view = TableReportContentView;
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

    return TableReportView;

});