/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/marionette',
  'csui/controls/tile/behaviors/blocking.behavior',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.data/fileuploadpanel.capture.data.item.view',
  'xecmpf/controls/fileuploadpanel/impl/models/fileuploadpanel.doctype.factory',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang'
], function (Marionette, BlockingBehavior, FileUploadPanelCaptureCategoryDataItemView, FileUploadPanelDocTypeFactory, lang) {

  "use strict";

  var FileUploadPanelCaptureCategoryDataView = Marionette.CollectionView.extend({
    className: 'xecmpf-file-upload-capture-category-data-list',
    childView: FileUploadPanelCaptureCategoryDataItemView,
    childViewOptions: function (model) {
      return {
        model: model,
        context: this.options.context,
        wsNode: this.options.wsNode,
        connector: this.options.connector,
        docTypeModel: this.options.docTypeModel
      }
    },
    childEvents: {
      'update:submit:button': 'onUpdateSubmitButton'
    },
    constructor: function FileUploadPanelCaptureCategoryDataView(options) {

      options.docTypeModel = options.context.getModel(FileUploadPanelDocTypeFactory, {
        options: {
          wsId: options.wsNode.get('id'),
          context: options.context,
          connector: options.connector
        }
      });
      Marionette.CollectionView.prototype.constructor.call(this, options);
      this.listenTo(this, 'on:document:select', (function (dataId) {
        this.children.forEach(function (view) {
          if (view.model.get('dataId') === dataId) {
            view.$el.addClass('selected');
            view.previewView.showPreview();
          } else {
            view.$el.removeClass('selected');
          }
        });
      }).bind(this));
      this.listenTo(this, 'get:form:status', (function (dataId) {
        this.doUpdateFormStatus(dataId);
      }).bind(this));

    },
    doUpdateFormStatus: function (dataId) {
      this.children.forEach((function (view) {
        var valid;
        if (view.model.get('dataId') === dataId) {
          valid = view.docTypeView && view.docTypeView.validate() && view.categoryView && view.categoryView.validate() && Object.keys(view.categoryView.getValues()).length > 0;
          this.trigger('update:form:status', { dataId: dataId, valid: valid });
        }
      }).bind(this));
    },
    onUpdateSubmitButton: function () {
      var validations = [], valid;
      this.children.forEach((function (view) {
        if (!view.model.get('upload_err')) {
          valid = false;
          try {
            valid = (view.docTypeView && view.docTypeView.validate() && view.categoryView && view.categoryView.validate() && Object.keys(view.categoryView.getValues()).length > 0);
          } catch (e) { }
          validations.push({ selected: view.$el.hasClass('selected'), dataId: view.model.get('dataId'), valid: valid });
        }
      }).bind(this));
      this.trigger('update:submit:button', validations);
    },
    isAllDocumentsInfoCaptured: function () {
      var isAllInfoCaptured = true;
      this.children.forEach((function (view) {
        if (!view.model.get('upload_err')) {
          isAllInfoCaptured = isAllInfoCaptured && (view.docTypeView.validate() && view.categoryView.validate());
        }
      }).bind(this));
      return isAllInfoCaptured;
    },
    getRequestPayload: function () {
      var payload = { 'docInfos': [] }, docInfo, that = this;
      this.children.forEach((function (view) {
        if (!view.model.get('upload_err')) {
          docInfo = {
            'docId': view.model.get('dataId'),
            'docType': parseInt(view.docTypeView.getValues().doc_type || '0'),
            'catId': that.options.docTypeModel.getCategoryIdForDocType(view.docTypeView.getValues().doc_type),
            'attrs': view.categoryView.getValues()
          };
          docInfo.attrs.id = docInfo.docId
          payload.docInfos.push(docInfo);
        }
      }).bind(this));
      return payload;
    },
    submitDocumentDetails: function () {
      if (this.isAllDocumentsInfoCaptured()) {
        return this.makeUploadDocsServiceCall();
      } else {
        return Promise.reject(lang.detailsMissing);
      }
    },
    makeUploadDocsServiceCall: function () {
      var that = this,
        promise = new Promise(function (resolve, reject) {
          var connector = that.options.connector,
            url = connector.getConnectionUrl().getApiBase('v2') + '/fileupload/uploaddocs',
            formData = new FormData();
          formData.append('payload', JSON.stringify(that.getRequestPayload()));
          formData.append('ws_id', that.options.wsNode.get('id'));
          connector.makeAjaxCall({
            url: url,
            type: "POST",
            data: formData,
            success: function (response, status, jXHR) {
              resolve(response);
            },
            error: function (xhr, status, text) {
              reject(xhr.responseJSON.error);
            }
          });
        });
      return promise;
    },
    behaviors: {
      Blocking: {
        behaviorClass: BlockingBehavior
      }
    }
  });

  return FileUploadPanelCaptureCategoryDataView;

});