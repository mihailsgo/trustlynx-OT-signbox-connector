/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/marionette',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.list/impl/fileuploadpanel.capture.list.item',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.list/impl/fileuploadpanel.capture.list.item',
], function (Marionette, fileUploadCaptureListItemTemplate, lang) {
  "use strict";

  var FileUploadPanelCaptureListItemView = Marionette.ItemView.extend({
    className: function () {
      var clsName = 'xecmpf-file-upload-capture-list-item';
      if (this.model.get('upload_err')) {
        clsName += ' xecmpf-file-upload-disabled-item';
      }
      return clsName;
    },
    template: fileUploadCaptureListItemTemplate,
    constructor: function (options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.model.on('change', (function () {
        if (this.model.hasChanged('upload_err')) {
          if (this.model.get('upload_err')) {
            this.$el.addClass('xecmpf-file-upload-disabled-item');
          } else {
            this.$el.removeClass('xecmpf-file-upload-disabled-item');
          }
        }
      }).bind(this));
    },
    templateHelpers: function () {
      return {
        name: this.model.get('name'),
        iconClass: this.model.get('iconClass')
      }
    },
    triggers: {
      'click': 'click:item'
    },
    updateFormStatus: function (valid) {
      var validIcon = this.$el.find('.xecmpf-file-upload-capture-item-validation-icon span.xecmpf-file-upload-valid'),
        invalidIcon = this.$el.find('.xecmpf-file-upload-capture-item-validation-icon span.xecmpf-file-upload-invalid');
      if (valid) {
        invalidIcon.removeClass('show-status-icon');
        validIcon.addClass('show-status-icon');
      } else {
        validIcon.removeClass('show-status-icon');
        invalidIcon.addClass('show-status-icon');
      }
    }
  });

  return FileUploadPanelCaptureListItemView;

});