csui.define([ 'module',
  'csui/lib/underscore',
  'csui/utils/log',
  'conws/utils/navigate/navigate.util'
], function (module, _, Log,
  NavigateUtil) {

  'use strict';

  var log = new Log( module.id );
  var config = module.config();

  return {

    /**
     * return true, if:
     * - navigation is set to use tree view
     * - is below workspace
     * - no extension does intercept
     *
     * @param {*} status
     * @param {*} options
     */
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
      // data() is directly called after enabled().
      var values = {};
      if (NavigateUtil.checkWorkspaceHierarchy(status.context).level>=0) {
        values.rootNodes = [ NavigateUtil.getWorkspaceModel(status.context) ];
      }
      return values;
    }

  };
});