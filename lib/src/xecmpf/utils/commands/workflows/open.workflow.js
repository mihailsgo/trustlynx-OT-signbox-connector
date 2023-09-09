/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/commands/open',
  'csui/utils/commandhelper', 'xecmpf/utils/commands/workflows/dialog/header.view',
  'xecmpf/utils/workflows/embed.appworks', 'csui/controls/dialog/dialog.view',
  'i18n!xecmpf/utils/commands/nls/localized.strings'
], function (_, $, OpenCommand, CommandHelper, HeaderView, EmbedWorkflowView, DialogView, lang) {
  'use strict';

  var WorkflowOpenCommand = OpenCommand.extend({
    defaults: {
      signature: 'WorkflowOpen',
      command_key: ['workflow_open', 'Open'],
      scope: 'single'
    },

    enabled: function (status) {
      var node      = CommandHelper.getJustOneNode(status),
          urlToLoad = node.get('OpenURL');
      return !!urlToLoad;
    },

    execute: function (status, options) {
      options || (options = {});
      var node              = CommandHelper.getJustOneNode(status),
          urlToLoad         = node.get('OpenURL'),
          dialogTitle       = node.get('WorkflowTitle'),
          deferred          = $.Deferred(),
          embedWorkflowView = new EmbedWorkflowView(options);
      options.title = dialogTitle
      this.headerView = new HeaderView(options);

      var dialog = new DialogView({

        title: dialogTitle,
        className: "workflow-dailog",
        largeSize: true,
        view: embedWorkflowView,
        headerView: this.headerView,
        attributes: {
          'aria-label': dialogTitle
        },
        buttons: [{
          id: "close",
          label: lang.close,
          close: true,
        }]
      });
      dialog.show();
      dialog.listenTo(dialog, 'hide', _.bind(this.onHideDialog, this));
      embedWorkflowView.dialogView = dialog;
      embedWorkflowView.loadUrlInIframe(urlToLoad);
      return deferred.resolve(dialog).promise();
    },

    onHideDialog: function () {
      if (this.headerView.options.originatingView.options.originatingView && !!this.headerView.options.originatingView.options.originatingView.$el.find('.csui-workflow-button').length) {
        this.headerView.options.originatingView.options.originatingView.$el.find('.csui-workflow-button').focus();
      }
      else {
        this.headerView.options.originatingView.previousFocusElm.focus();
        this.headerView.options.originatingView.previousFocusElm = undefined;
      }
    },

  });

  return WorkflowOpenCommand;
});