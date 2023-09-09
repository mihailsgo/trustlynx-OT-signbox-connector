/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/marionette',
  'csui/controls/tile/behaviors/blocking.behavior',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.doctype/fileuploadpanel.doctype.view',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.category/fileuploadpanel.category.view',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.preview/fileuploadpanel.preview.view',
  'xecmpf/controls/fileuploadpanel/impl/models/fileuploadpanel.doctype.form.model',
  'xecmpf/controls/fileuploadpanel/impl/models/fileuploadpanel.category.form.model',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.data/impl/fileuploadpanel.capture.data.item',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.data/impl/fileuploadpanel.capture.data.item',
], function (Marionette, BlockingBehavior, FileUploadPanelDocTypeView, FileUploadCategoryView, FileUploadPanelPreviewView, FileUploadPanelDocTypeFormModel, FileUploadPanelCategoryFormModel, FileUploadCaptureCategoryDataItemTemplate, lang) {
  "use strict";

  var FileUploadPanelCaptureCategoryDataItemView = Marionette.LayoutView.extend({
    className: 'xecmpf-file-upload-capture-category-data-item',
    template: FileUploadCaptureCategoryDataItemTemplate,
    regions: {
      docTypeRegion: '.xecmf-fileupload-capture-doc-type',
      previewRegion: '.xecmf-fileupload-capture-preview',
      categoryRegion: '.xecmf-fileupload-capture-category-info'
    },
    onRender: function () {
      var that = this;
      var categoryFormModel = new FileUploadPanelCategoryFormModel({ context: this.options.context, wsNode: this.options.wsNode, connector: this.options.connector });
      var docTypeFormModel = new FileUploadPanelDocTypeFormModel({ context: this.options.context, wsNode: this.options.wsNode, connector: this.options.connector, docTypeModel: this.options.docTypeModel });
      this.docTypeView = new FileUploadPanelDocTypeView({ model: docTypeFormModel, layoutMode: 'singleCol', context: this.options.context, mode: 'create' });
      this.previewView = new FileUploadPanelPreviewView({ model: this.options.model, context: this.options.context, connector: this.options.connector });
      this.categoryView = new FileUploadCategoryView({ model: categoryFormModel, layoutMode: 'singleCol', context: this.options.context, connector: this.options.connector, mode: 'create' });
      this.docTypeRegion.show(this.docTypeView);
      this.previewRegion.show(this.previewView);
      this.categoryRegion.show(this.categoryView);
      this.listenTo(this.docTypeView, 'invalid:field', function (event) {
        if (!this.docTypeView.getValues().doc_type) {
          categoryFormModel.resetToEmptyRequiredModel();
        }
        that.trigger('update:submit:button');
      });
      this.listenTo(this.docTypeView, 'doctype:change', function (val) {
          categoryFormModel.resetToEmptyRequiredModel();
          if (val) {
            that.blockActions();
            that.options.docTypeModel.getCategoryFormModel(parseInt(val)).then(function (response) {
              categoryFormModel.set(response);
              that.unblockActions();
              that.trigger('update:submit:button');
            });
          }
      });
      this.listenTo(this.categoryView, 'change:field', function (event) {
        this.trigger('update:submit:button');
      });
      this.listenTo(this.categoryView, 'invalid:field', function (event) {
        this.trigger('update:submit:button');
      });
    },
    behaviors: {
      Blocking: {
        behaviorClass: BlockingBehavior
      }
    }
  });

  return FileUploadPanelCaptureCategoryDataItemView;
});