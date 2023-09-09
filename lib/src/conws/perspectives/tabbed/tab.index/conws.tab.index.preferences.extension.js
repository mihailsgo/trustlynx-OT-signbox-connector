/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'module', 'csui/lib/underscore', 'csui/utils/log',
  'csui/utils/contexts/factories/next.node',
  'conws/utils/navigate/navigate.util'
],function( module, _, Log,
  NextNodeModelFactory,
  NavigateUtil
) {
  'use strict';

  var log = new Log(module.id);

  function hasContextTabbedPerspective(context) {
    var perspective = context && context.perspective;
    var options = perspective && perspective.get("options");
    return !!(options && options.tabs);
  }

  function getFolderBrowserTabIndex(context) {

    var perspective = context && context.perspective;
    var options = perspective && perspective.get("options");
    var tabs = options && options.tabs;
    var tabIndex;
    tabs && _.find(tabs, function (tab, idx) {
      var col = _.find(tab.columns, function (col) {
        return col.widget && col.widget.type === "csui/widgets/nodestable";
      });
      if (col) {
        tabIndex = idx;
        return true;
      }
    });

    return tabIndex;
  }

  return [
    {
      getPreferredTabIndex: function(options){

        var tabToActivate;
        var context = options.context;
        var viewStateModel = context.viewStateModel;
        var conwsNavigated = viewStateModel.get('conwsNavigated');
        var wkspHierarchy = NavigateUtil.checkWorkspaceHierarchy(context.getModel(NextNodeModelFactory));
        var wkspId = wkspHierarchy.wkspid;

        var isTabbed = hasContextTabbedPerspective(context);
        if (wkspId && isTabbed) {
          if (conwsNavigated === "gotoLocation") {

            tabToActivate = getFolderBrowserTabIndex(context);

          } else if (conwsNavigated === "browseView") {

            tabToActivate = 0;

          } else if (conwsNavigated === "conwsLink") {

            tabToActivate = wkspHierarchy.level===0 ? 0 : getFolderBrowserTabIndex(context);

          } else {
            tabToActivate = wkspHierarchy.level===0 ? 0 : getFolderBrowserTabIndex(context);
          }

        }

        log.debug('Conws::getPreferredTabIndex {0}', tabToActivate) && console.log(log.last);
        return tabToActivate;
      }

    }
  ];
});
