/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
    'webreports/controls/parameter.prompt/widget.prompt.wrapper.view',
    'webreports/widgets/tilereport/impl/tilereport.content.view'
], function (WidgetPromptWrapperView, TileReportContentView) {

    var TileReportView = WidgetPromptWrapperView.extend({

        className: 'cs-tile cs-list tile content-tile webreports-tilereport',

        constructor: function TileReportView(options) {

            options.view = TileReportContentView;

            WidgetPromptWrapperView.prototype.constructor.apply(this, arguments);
        }

    });

    return TileReportView;

});
