/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/commandhelper',
  'csui/utils/commands/open.classic.page',
  'csui/utils/command.error',
  'csui/utils/contexts/factories/connector',
  'workflow/models/workitem/workitem.model.factory',
], function (_, $, CommandHelper, OpenClassicPageCommand, CommandError, ConnectorFactory, WorkitemModelFactory) {
  'use strict';

  var OpenWorkItemCommand = OpenClassicPageCommand.extend({

    defaults: {
      signature: 'OpenWorkflowStep'
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return node && node.get('type') === 153;
    },

    openTab: true,
    execute: function (status, options) {
      var node = CommandHelper.getJustOneNode(status);
      if (node.get('workflow_open_in_smart_ui')) {
        options = options || {};
        var context   = status.context || options && options.context,
            deferred  = $.Deferred(),
            workItem = context.getModel(WorkitemModelFactory);
        workItem.set({
          process_id: node.get('workflow_id'),
          subprocess_id: node.get('workflow_subworkflow_id'),
          task_id: node.get('workflow_subworkflow_task_id'),
          url_org: location.href,
          isAttachmentCentric: node.get('smartViewAttachmentsView')
        });
        return deferred;
      } else if ( node.get('maptask_subtype')=== 110 ) {
        this.openTab = false ;
        return this._navigateTo(node, options);
        } else {
        return this._navigateTo(node, options);
      }
    },

    openInNewTab: function () {
        return this.openTab;
    },
    getUrlQueryParameters: function (node, options) {

      return {
        func: 'work.EditTask',
        workid: node.get('workflow_id'),
        subworkid: node.get('workflow_subworkflow_id'),
        taskid: node.get('workflow_subworkflow_task_id'),
        nexturl: location.href
      };
    }
  });

  return OpenWorkItemCommand;

});