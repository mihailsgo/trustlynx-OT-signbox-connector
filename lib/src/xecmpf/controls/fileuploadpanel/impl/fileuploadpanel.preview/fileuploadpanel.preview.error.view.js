/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/marionette',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.preview/impl/fileuploadpanel.preview.error',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.preview/impl/fileuploadpanel.preview.error'
],
  function (Marionette, PreviewErrorTemplate, lang) {
    var FileUploadPreviewError = Marionette.ItemView.extend({
      className: 'xecmpf-file-upload-preview-error',
      templateHelpers: function () {
        return { title: lang.previewError, 'iconClass': this.model.get('iconClass') }
      },
      template: PreviewErrorTemplate
    });
    return FileUploadPreviewError;
  });