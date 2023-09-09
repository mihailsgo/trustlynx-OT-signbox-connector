/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'conws/utils/navigate/navigate.util'
], function (NavigateUtil) {

  'use strict';

  return [
    { // inside or below a workspace
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
        NavigateUtil.checkWorkspaceHierarchy(options.context).level>=0;
      },
      contextHelpId : function(options) {
        return 'ugd-cws'
      }
    }
  ];
});