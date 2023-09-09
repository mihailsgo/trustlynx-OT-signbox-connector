/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/commands/delete/delete.self.handler',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/lib/radio'
], function (DeleteSelfHandler, PerspectiveContext, Radio) {
  'use strict';

  var extSystemViewModes = Object.freeze(['folderBrowse', 'fullPage']);
  var channel = Radio.channel('xecmpf-workspace');

  return function (node, options) {
    var executeCSUIDeleteHandler = false;
    if (options.context && options.context.options) {
      var data = options.context.options;
      if (node.get('type') === 848 && data.initialWkspId === node.get('id') &&
        data.viewMode && extSystemViewModes.indexOf(data.viewMode.mode) > -1) {
        if (options.context instanceof PerspectiveContext) {
          var viewStateModel = options.context.viewStateModel;
          if (viewStateModel) {
            viewStateModel.clearHistory();
            viewStateModel.set(viewStateModel.CONSTANTS.CURRENT_ROUTER, undefined);
          }
        }
        channel.trigger('xecm:delete:workspace');
      }
      else if (node.get('type') === 848 && data.initialWkspId !== node.get('id') &&
        data.viewMode && extSystemViewModes.indexOf(data.viewMode.mode) > -1) {
        viewStateModel = options.context.viewStateModel;
        if (viewStateModel) {
          viewStateModel.restoreLastFragment();
        } else {
          executeCSUIDeleteHandler = true;
        }
      } else {
        executeCSUIDeleteHandler = true;
      }
    } else {
      executeCSUIDeleteHandler = true;
    }
    if (executeCSUIDeleteHandler) {
      DeleteSelfHandler(node, options);
    }
  }
});