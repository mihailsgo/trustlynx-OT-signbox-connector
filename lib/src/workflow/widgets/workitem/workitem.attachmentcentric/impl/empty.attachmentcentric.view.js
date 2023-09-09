/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'workflow/widgets/workitem/workitem.body/workitem.body.view',
  'hbs!workflow/widgets/workitem/workitem.attachmentcentric/impl/empty.attachmentcentric',
  'i18n!workflow/widgets/workitem/workitem/impl/nls/lang',
  'css!workflow/widgets/workitem/workitem.attachmentcentric/impl/empty.attachmentcentric'
], function (_, $, Marionette, WorkItemBodyView, emptyTemplate, Lang) {
  'use strict';

  var EmptyAttachmentCentricView = Marionette.LayoutView.extend({

    template: emptyTemplate,
    className: 'workitem-no-attachment-view',
    regions: {
      wfattributes: '.workflow-attributes'
    },
    templateHelpers: function () {

      return {
        message: Lang.NoAttachmentsMessage,
        propertylabel: Lang.PropertyLabel,
        wfpropertylabel: Lang.wfPropertyLabel
      };
    },

    events: {
    'click .dropdown-link': 'onDropDownLinkClick'
    },

    constructor: function EmptyAttachmentCentricView(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'show:workflowAttributes:tab:content', function () {
        this.showWfPropertyContent();
      });
    },

    onRender: function () {
      this.options.model = this.options.parentView.model;
      var bodyView = this.bodyView = new WorkItemBodyView(this.options);
      this.wfattributes && this.wfattributes.show(bodyView);
    },

    onDropDownLinkClick: function(event){
      var value = event.target && event.target.textContent;
      if (value === Lang.PropertyLabel){
        this.showPropertyContent();
      } else if (value === Lang.wfPropertyLabel) {
        this.showWfPropertyContent();
      }
    },

    showPropertyContent: function(){
      var propertyEle = this.$el.find('.properties'),
          wfpropertyEle = this.$el.find('.workflow-attributes'),
          activePropertyEle = this.$el.find('#workflow-tab'),
          activewfPropertyEle = this.$el.find('#workflow-properties-tab'),
          selectedValueEle = this.$el.find('button .workflow-label');

      propertyEle.removeClass('hide-content');
      propertyEle.addClass('show-content');
      wfpropertyEle.addClass('hide-content');
      wfpropertyEle.removeClass('show-content');
      activewfPropertyEle.removeClass('binf-active');
      activePropertyEle.addClass('binf-active');
      if (selectedValueEle.length === 1 ){
        selectedValueEle[0].innerText = Lang.PropertyLabel;
      }
    },

    showWfPropertyContent: function(){
      var propertyEle = this.$el.find('.properties'),
          wfpropertyEle = this.$el.find('.workflow-attributes'),
          activePropertyEle = this.$el.find('#workflow-tab'),
          activewfPropertyEle = this.$el.find('#workflow-properties-tab'),
          selectedValueEle = this.$el.find('button .workflow-label');

      wfpropertyEle.removeClass('hide-content');
      wfpropertyEle.addClass('show-content'); 
      propertyEle.addClass('hide-content');
      propertyEle.removeClass('show-content');
      activewfPropertyEle.addClass('binf-active');
      activePropertyEle.removeClass('binf-active');
      if (selectedValueEle.length === 1 ){
        selectedValueEle[0].innerText = Lang.wfPropertyLabel;
      }
    }
  });

  return EmptyAttachmentCentricView;
});
