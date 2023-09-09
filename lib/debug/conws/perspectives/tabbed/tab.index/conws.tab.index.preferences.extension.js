csui.define([ 'module', 'csui/lib/underscore', 'csui/utils/log',
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
    // find first tab with a nodestable on it and remember the index in tabIndex
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
      /**
       * This method computes the tab index desired by conws, depending on the current navigation state.
       *
       * preconditions:
       * must be called on initial load of the page.
       * must be called on each csui navigation step, but not browser back/forward/refresh.
       * must not be called on browser back/forward/refresh because in this case, the tab has already been computed before
       * and in this case the tab index must be restored from the view state by csui itself.
       *
       * must be called at a point in time when all of the following is true:
       * - options.context.perspective contains the loaded perspective configuration
       * - options.context.getModel(NextNodeModelFactory) contains the data for the navigation node
       * - the conws perspective context plugin has been called for the current navigation step
       *
       * It returns:
       * undefined, when it does not care or cannot decide about the index (i.e outside a workspace).
       * the integer number of the desired tab, when navigation is inside a workspace and a tabbed perspective is loaded.
       *
       * @param {*} options object containing 'context'.
       */
      getPreferredTabIndex: function(options){

        var tabToActivate;
        var context = options.context;
        var viewStateModel = context.viewStateModel;
        var conwsNavigated = viewStateModel.get('conwsNavigated');
        var wkspHierarchy = NavigateUtil.checkWorkspaceHierarchy(context.getModel(NextNodeModelFactory));
        var wkspId = wkspHierarchy.wkspid;

        var isTabbed = hasContextTabbedPerspective(context);
        if (wkspId && isTabbed) {

          // if tab is not yet specified and we enter a workspace: determine the desired tab that
          // needs to be activated. Note: we only setup the viewState and the tabbed.perspective.view
          // is the one that sets the tab based on what is in the viewState and the defaultViewState
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
