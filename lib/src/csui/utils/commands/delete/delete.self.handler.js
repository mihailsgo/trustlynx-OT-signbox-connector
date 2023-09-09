/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define( [
  "csui/lib/jquery", "csui/lib/underscore"
], function ($, _) {

  function goBackToFolder(id, context) {
    var viewStateModel = context.viewStateModel;
    if (viewStateModel) {
      var historyEntry = viewStateModel.getLastHistoryEntry();
      if (historyEntry && historyEntry.fragment === 'nodes/' + id) {
        viewStateModel.restoreLastFragment();
        return true;
      }
    }
  }

  return function (node, options) {
    var context = options && options.context;
    if (context && context.hasModel('nextNode')) {
      var nextNode = context.getModel('nextNode');
      var parent = node.get('parent_id');

      if (parent) {
        var id = parent.id || parent;
        if (!goBackToFolder(id, context)) {
          nextNode.set('id', id);
        }
      }
    }
  };
});
