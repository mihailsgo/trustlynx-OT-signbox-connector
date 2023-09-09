/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'webreports/controls/parameter.prompt/widget.prompt.wrapper.view',
    'webreports/widgets/visual.data.filtered.count/impl/visual.count.content.view',
], function (WidgetPromptWrapperView, VisualCountContentView) {

      var VisualDataFilteredCountView = WidgetPromptWrapperView.extend({

          className: 'cs-tile cs-list tile content-tile webreports-tilereport',

          constructor: function VisualDataFilteredCountView(options) {

              options.view = VisualCountContentView;

              WidgetPromptWrapperView.prototype.constructor.apply(this, arguments);
          }
      });

    return VisualDataFilteredCountView;

});
