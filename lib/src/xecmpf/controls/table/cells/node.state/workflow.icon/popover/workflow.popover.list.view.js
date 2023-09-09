/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/marionette',
'xecmpf/controls/table/cells/node.state/workflow.icon/popover/workflow.popover.item.view',
'hbs!xecmpf/controls/table/cells/node.state/workflow.icon/popover/impl/workflow.list'
], function (_, Marionette, WorkflowPopoverItemView,template) {
  'use strict';
  var WorkflowPopoverView = Marionette.CompositeView.extend({
    className: 'workflow-collection',
    template: template,
    childViewContainer: '.workflow-list',
    childView: WorkflowPopoverItemView,

    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this,
      };
    },

    constructor: function WorkflowPopoverView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },
  });
  return WorkflowPopoverView;
});