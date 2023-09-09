/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'conws/utils/navigate/navigate.util'
],function (NavigateUtil) {

  function isPerspectiveWithHeader(context) {
    if (context.perspective) {
      var options = context.perspective.get("options");
      if (options && options.header) {
        return true;
      }
    }
    return false;
  }

  return function ConwsChildrenToolitemsMask (options) {
    if (isPerspectiveWithHeader(options.context)) {
      if (NavigateUtil.checkWorkspaceHierarchy(options.node).level===0) {
        return {
          blacklist: ['Favorite2', 'Comment']
        };
      }
    }
  };
});