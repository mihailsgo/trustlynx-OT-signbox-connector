/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module'],
  function (module) {
  "use strict";

  var config = module.config();
  var _conwsNavigationTreeView = !!config.treeView;
  var _backToPrevious = config.backToPrevious;
  var Navigable = {

    isConwsNavigationTreeView: function () {
      return _conwsNavigationTreeView;
    },

    wantsBackToPrevious: function() {
      return !!_backToPrevious || _backToPrevious===undefined || _backToPrevious===null || _backToPrevious==="";
    }

  }

  return Navigable;

});