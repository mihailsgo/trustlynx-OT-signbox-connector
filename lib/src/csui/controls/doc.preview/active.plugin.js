/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore', 'require'
], function ($, _, require) {
  'use strict';

  var getActivePluginView = function (options) {
    var dfd = $.Deferred(),
        model = options.model,
        context = options.context,
        viewerView;

    if (!!model && !!context) {

      require(['csui/utils/commands/preview.plugins/preview.plugins'], function (plugins) {
        var plugin       = plugins.findByNode(model, {context: context}),
            viewerModule = plugin && plugin.widgetView ? plugin.widgetView : '';

        if(!!viewerModule) {
          if (typeof viewerModule === 'function') {
            viewerModule = viewerModule.call(plugin, model, {context: context});
          }
          require([viewerModule], _.bind(function (Viewer) {
            var viewerOptions = plugin.widgetViewOptions;
            if (typeof viewerOptions === 'function') {
              viewerOptions = viewerOptions.call(plugin, model, {context: context});
            }

            viewerView = new Viewer(_.extend(options, viewerOptions));

            dfd.resolve({
              viewer: viewerView,
              plugin: plugin,
              response: {
                status: 'SUCCESS'
              }
            });

          }, this));
        } else {
          dfd.reject({
            viewer: undefined,
            response: {
              status: 'ERROR',
              errorCode: 'ERR_UN_SUPPORTED',
              errorMessage: 'Neither supported plugin nor supported document exists!'
            }
          });
        }
      });

    } else {
      dfd.reject({
        viewer: undefined,
        response: {
          status: 'ERROR',
          errorCode: 'ERR_MISSING_REQ_DATA',
          errorMessage: 'Either model or context is missing!'
        }
      });
    }

    return dfd.promise();
  };

  return {
    getActivePluginView: getActivePluginView
  };
});