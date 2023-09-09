csui.define([
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
    // If there is a perspective with a header and the navigation node is in or below a
    // workspace, we assume, that favorite and comment icon for the workspace is shown
    // in the header. When ConwsChildrenToolitemsMask is called, a nodes table is about
    // to display the toolbar. To avoid duplicate icons, we disable comment and favorite
    // icons there, if navigation node itself is a workspace.
    if (isPerspectiveWithHeader(options.context)) {
      if (NavigateUtil.checkWorkspaceHierarchy(options.node).level===0) {
        return {
          blacklist: ['Favorite2', 'Comment']
        };
      }
    }
  };
});