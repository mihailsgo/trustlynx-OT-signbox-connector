/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette3',
    'webreports/controls/parameter.prompt/widget.prompt.wrapper.view',
    'webreports/widgets/nodeslistreport/impl/nodeslistreport.content.view'
], function (Marionette, WidgetPromptWrapperView, NodesListReportContentView) {

    var NodesListReportView = WidgetPromptWrapperView.extend({

        className: 'cs-tile cs-list tile content-tile webreports-nodeslistreport',

        constructor: function NodesListReportView(options) {

            options.view = NodesListReportContentView;

            WidgetPromptWrapperView.prototype.constructor.apply(this, arguments);
        }

    });

    return NodesListReportView;

});
