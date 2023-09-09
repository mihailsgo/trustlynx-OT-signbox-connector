/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/controls/form/form.view',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.category/impl/fileuploadpanel.category'
], function (FormView, formTemplate, lang) {

  var FileUploadPanelCategoryView = FormView.extend({

    constructor: function FileUploadPanelCategoryView(options) {
      FormView.prototype.constructor.call(this, options);
    }

  });

  return FileUploadPanelCategoryView;
});