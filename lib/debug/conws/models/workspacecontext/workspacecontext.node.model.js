// Fetches the workspace id of the effective businessworkspace for a given node.
csui.define([
  'conws/models/workspacecontext/impl/workspacecontext.node.model'
], function (WorkspaceContextNode) {

  console.warn(
    "DEPRECATED: don't use 'workspacecontext.node.model' anymore. Depend " +
    "on 'conws/utils/navigate/navigate.util' as NavigateUtil and use " +
    "NavigateUtil.checkWorkspaceHierarchy(context) or " +
    "NavigateUtil.getWorkspaceModel(context)."
  );

  return WorkspaceContextNode;

});
