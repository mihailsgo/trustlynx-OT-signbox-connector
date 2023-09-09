/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette','csui/utils/base',
  'xecmpf/models/workflows/metadata.workflow.collection',
  'xecmpf/utils/commands/workflows',
  'csui/utils/commandhelper',
  'i18n!xecmpf/controls/table/cells/node.state/workflow.icon/impl/nls/lang',
  'hbs!xecmpf/controls/table/cells/node.state/workflow.icon/popover/impl/workflow.item'
], function (_, $, Marionette, base, WorkflowCollection, Commands, CommandHelper, lang, template) {
  'use strict';
  var WorkflowPopoverItemView = Marionette.ItemView.extend({
    className: 'workflow-item',
    tagName: 'li',
    template: template,
    templateHelpers: function () {
      var initiatedDate = this.model.get('InitiatedDate');
      return {
        title: this.model.get('WorkflowTitle'),
        from: lang.from,
        created: lang.created,
        initiator: this.model.get('InitiatedByName'),
        initiatedDate: base.formatExactDate(initiatedDate) + " " + base.formatExactTime(initiatedDate)
      };
    },

    attributes: {
      role: 'none'
    },

    events: {
      'click .csui-title-link': 'onClickWorkflowName',
      'keydown .csui-title-link': 'onKeyInView',
    },

    constructor: function WorkflowPopoverItemView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    onClickWorkflowName: function () {
      var originatingView = this.options && this.options.originatingView;
      if (originatingView) {
        originatingView.closePopover(originatingView);
      }

      var status = { nodes: new WorkflowCollection([this.model]) },
        command = Commands.get('WorkflowOpen');
      var cmdOption = { context: this.options.context, originatingView: this };
      var promise = command.execute(status, cmdOption);
      CommandHelper.handleExecutionResults(
        promise, {
        command: command,
        suppressSuccessMessage: "Error Eecuting command",
        suppressFailMessage: "Fecting commands data failed"
      });
    },

    onKeyInView: function (event) {
      if (event.keyCode === 27) {
        this.$el.closest('.binf-popover').siblings('.csui-workflow-button').trigger('focus');
        this.options.originatingView.closePopover();
      }
      else if (event.keyCode === 13 || event.keyCode === 32) {
        this.onClickWorkflowName();
      }
    },

  });
  return WorkflowPopoverItemView;
});