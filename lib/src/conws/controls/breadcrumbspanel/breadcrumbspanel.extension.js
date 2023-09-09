/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/utils/log',
  'conws/utils/commands/navigate/navigable',
  'conws/utils/navigate/navigate.util'
], function (module, Log,
  Navigable,
  NavigateUtil) {
  'use strict';

  var log = new Log(module.id);

  function hasContextHeaderWidget(context) {
    var perspective = context && context.perspective;
    var options = perspective && perspective.get("options");
    return !!(options && options.header && options.header.widget);
  }

  var BreadcrumbsPanelExtension = {

    hideBreadcrumbs: function (options) {
      var result = false;
      if (Navigable.wantsBackToPrevious()) {
        var context = options && options.context;
        if (hasContextHeaderWidget(context)) {
          if (NavigateUtil.checkWorkspaceHierarchy(context).wkspid){
            result = true;
          }
        }
      }
      log.debug('breadcrumbspanel.extension hideBreadcrumbs: {0}', result) && console.log(log.last);
      return result;
    }

  };

  return BreadcrumbsPanelExtension;
});
