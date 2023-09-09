/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/utils/log', 'csui/models/command',
  'conws/utils/commands/navigate/navigable',
  'conws/utils/navigate/navigate.util',
], function (module, require, $, _,
  Log,
  CommandModel,
  Navigable,
  NavigateUtil) {
  'use strict';

  var log = new Log(module.id);

  var BackToPreviousLocation = CommandModel.extend({

    defaults: {
      signature: 'BackToPreviousLocation'
    },
    getLinkInfo: function (context) {
      var result = {};
      if (Navigable.wantsBackToPrevious() && context) {
        var wkspid = NavigateUtil.checkWorkspaceHierarchy(context).wkspid;
        if (wkspid) {
          var viewState = context.viewStateModel;
          if (viewState) {
            var entries = viewState.getHistory();
            var state = viewState.get(viewState.CONSTANTS.SESSION_STATE)||{};
            var entry = viewState.getPotentialHistoryEntry();
            var prev = entries && entries.length && entries[entries.length-1];
            if (entry && (!prev || JSON.stringify(entry)!==JSON.stringify(prev))) {
              state = entry.sessionState||{};
              if ((wkspid||0)!==(state.wkspid||0)) {
                result.index = entries ? entries.length : 0;
              }
            }

            if (result.index===undefined && entries && entries.length > 0) {
              for (var i = entries.length - 1; i >= 0; i--) {
                entry = entries[i];
                state = entry.sessionState||{};
                if ((wkspid||0)!==(state.wkspid||0)) {
                  result.index = i;
                  break;
                }
              }
            }

            if (result.index!==undefined) {
              result.title = state.wkspid ? state.wkspname : entry[viewState.CONSTANTS.BACK_TO_TITLE];
              result.router = entry.router;
              result.id = state.id;
            }
          }
        }
      }
      return result;
    },

    enabled: function (status, options) {

      var context = status.context || options && options.context;
      var result = {};
      if (context) {
        result = this.getLinkInfo(context);
      }
      return result.index>=0;
    },

    execute: function (status, options) {
      var context = status.context || options && options.context;
      var viewState = context && context.viewStateModel;
      var history = viewState.getHistory();
      var deferred = $.Deferred();

      var index = (status.data && status.data.index!==undefined) ? status.data.index : this.getLinkInfo(context).index;
      if (index>=0 && index<history.length) {
        viewState.restoreHistoryEntryByIndex(index);
        deferred.resolve();
      } else {
        log.error("Stale history index {0}.",index)
        deferred.reject();
      }
      return deferred.promise();
    }

  });

  return BackToPreviousLocation;

});
