csui.define(['module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
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

    /**
     * checks, whether a back link can be displayed in current navigation situation
     * and if so, returns the link info.
     *
     * @param {*} context current navigation context.
     * @returns object with properties "index", "title", "router", "id".
     * index: the index of the history entry to jump to, undefined, if there is no entry.
     * title: the title to display in the link - if index!==undefined.
     * router: the name of the router, the history entry has written.
     * id: node id, if history entry is associated to a node - can be undefined.
     */
    getLinkInfo: function (context) {
      var result = {};
      if (Navigable.wantsBackToPrevious() && context) {
        var wkspid = NavigateUtil.checkWorkspaceHierarchy(context).wkspid;
        if (wkspid) {
          var viewState = context.viewStateModel;
          if (viewState) {
            var entries = viewState.getHistory();
            var state = viewState.get(viewState.CONSTANTS.SESSION_STATE)||{};

            // first check current history entry to handle the situation,
            // where it is not yet pushed to the history.
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
