/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/log',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/progressblocker/blocker',
  'csui/controls/globalmessage/globalmessage',
  'workflow/widgets/workitem/workitem.properties/workitem.properties.view',
  'workflow/widgets/workitem/workitem.attachments/workitem.attachments.view',
  'hbs!workflow/widgets/workitem/workitem.body/impl/workitem.body',
  'i18n!workflow/widgets/workitem/workitem.body/impl/nls/lang',
  'css!workflow/widgets/workitem/workitem.body/impl/workitem.body'
], function (_, Marionette, log, LayoutViewEventsPropagationMixin, BlockingView, GlobalMessage,
    WorkItemPropertiesView, WorkItemAttachmentsView, template, lang) {
  'use strict';
  var WorkItemBodyView = Marionette.LayoutView.extend({
    className: 'workflow-workitem-body',
    template: template,
    constructor: function WorkItemBodyView(options) {
      options || (options = {});

      this.context = options.context;
      this.parentView = options.parentView;
      this.extensions = options.extensions;
      if (options.originatingView && options.originatingView.options && options.originatingView.options.isAttachmentCentric === true) {
        this.parentView = options.originatingView.options.parentView;
        options.attachmentModel = options.model;
        delete options.model;
        options.model = options.originatingView.options.parentView.model;
      }

      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
    },

    regions: {
      properties: '.workitem-properties'
    },

    onRender: function () {
      if (this.model) {
        this.properties.show(new WorkItemPropertiesView({
          context: this.context,
          model: this.model,
          extensions: this.extensions,
          parentView: this
        }));
      } else {
        log.warn(lang.NoModelWarning);
      }
    }
  },
  {
    enabled: function (options) {
      var showWfPropertyItem = false;
      if (options.node && options.node.get('shortcutNode')) {
        showWfPropertyItem = options.node.get('shortcutNode').get('showWfPropertyMenuItem');
      } else {
        showWfPropertyItem = options.node.get('showWfPropertyMenuItem');
      }

      if (showWfPropertyItem && showWfPropertyItem === true){
        delete options.node.attributes.showWfPropertyMenuItem;
        return true;
      } else {
        return false;
      }
    }
  });

  _.extend(WorkItemBodyView.prototype, LayoutViewEventsPropagationMixin);

  return WorkItemBodyView;

});
