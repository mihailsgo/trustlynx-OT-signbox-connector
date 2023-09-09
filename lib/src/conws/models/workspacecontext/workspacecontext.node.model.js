/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
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
