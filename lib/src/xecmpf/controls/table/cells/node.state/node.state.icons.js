/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'xecmpf/controls/table/cells/node.state/cmis.icon/cmis.node.state.icon',
    'xecmpf/controls/table/cells/node.state/workflow.icon/workflow.node.state.view'
  ], function (CMISIconView, WorkflowIconView) {
    'use strict';
  
    return [
      {
          sequence: 30,
          iconView: CMISIconView
      },
      {
          sequence: 40,
          iconView: WorkflowIconView
      }
    ];
  
  });
  