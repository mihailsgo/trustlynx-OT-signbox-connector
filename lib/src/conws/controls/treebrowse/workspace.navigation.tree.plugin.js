/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'module',
  'csui/lib/underscore',
  'csui/utils/log',
  'conws/utils/navigate/navigate.util'
], function (module, _, Log,
  NavigateUtil) {

  'use strict';

  var log = new Log( module.id );
  var config = module.config();

  return {
    enabled: function(status,options) {

      var isEnabled = false;
      if (config.enabled!==false) {
        if (NavigateUtil.checkWorkspaceNavigation(status,options).treeView) {
          if (NavigateUtil.checkWorkspaceHierarchy(status.context).level>=0) {
            isEnabled = NavigateUtil.checkNavigationExtension(status,options).navigation;
          }
        }
      }
      return isEnabled;
    },

    data: function (status,options) {
      var values = {};
      if (NavigateUtil.checkWorkspaceHierarchy(status.context).level>=0) {
        values.rootNodes = [ NavigateUtil.getWorkspaceModel(status.context) ];
      }
      return values;
    }

  };
});