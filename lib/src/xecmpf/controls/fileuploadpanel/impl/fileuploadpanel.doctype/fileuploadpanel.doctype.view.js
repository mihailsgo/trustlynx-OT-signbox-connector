/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/controls/form/form.view',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.doctype/impl/fileuploadpanel.doctype',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.doctype/impl/fileuploadpanel.doctype'
], function (FormView, formTemplate, lang) {

  var FileUploadPanelDocTypeView = FormView.extend({

    constructor: function FileUploadPanelDocTypeView(options) {
      FormView.prototype.constructor.call(this, options);
    },

    formTemplate: formTemplate,

    formTemplateHelpers: function () {
      return {
        docTypeLabel: lang.docTypeLabel
      };
    },

    _getLayout: function () {
      var template = this.getOption('formTemplate'),
        html = template.call(this, {
          data: this.alpaca.data,
          mode: this.mode
        }),
        bindings = this._getBindings(),
        view = {
          parent: 'bootstrap-csui',
          layout: {
            template: html,
            bindings: bindings
          }
        };
      return view;
    },

    _getBindings: function () {
      return {
        doc_type: 'xecmpf-file-upload-doctype'
      };
    }

  });

  return FileUploadPanelDocTypeView;
});