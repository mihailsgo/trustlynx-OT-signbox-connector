csui.define(['module'],
  function (module) {
  "use strict";

  var config = module.config();
  var _conwsNavigationTreeView = !!config.treeView;
  var _backToPrevious = config.backToPrevious;

  // holds state and functionality for the tree view navigation of SmartUI.
  // navigation tree view and navigate up react to this setting
  var Navigable = {

    isConwsNavigationTreeView: function () {
      return _conwsNavigationTreeView;
    },

    wantsBackToPrevious: function() {
      // show functionality per default but make it switchable by config setting.
      return !!_backToPrevious || _backToPrevious===undefined || _backToPrevious===null || _backToPrevious==="";
    }

  }

  return Navigable;

});