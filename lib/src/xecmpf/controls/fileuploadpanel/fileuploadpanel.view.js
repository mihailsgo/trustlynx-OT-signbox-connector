/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/side.panel/side.panel.view',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/controls/progressblocker/blocker',
  'csui/utils/page.leaving.blocker',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.info/fileuploadpanel.info.view',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/fileuploadpanel.capture.view',
  'xecmpf/controls/fileuploadpanel/impl/models/fileuploadpanel.model',
  'csui/models/fileuploads',
  'csui/controls/globalmessage/globalmessage',
  'csui/utils/contexts/factories/next.node',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel'
], function (_, Marionette, SidePanelView, ModalAlert, BlockingView, PageLeavingBlocker, FileUploadPanelInfoView, FileUploadPanelCaptureView, FileUploadPanelItemsCollection, UploadFileCollection, GlobalMessage, NextNodeModelFactory, lang) {
  "use strict";

  var FileUploadPanelView = Marionette.ItemView.extend({
    className: 'xecmpf-file-upload-panel',
    template: _.template(''),
    constructor: function FileUploadPanelView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    showGlobalMessage: function (progressPanelOptions, collection, sidePanel, uploadCollection) {
      collection.reset();
      sidePanel.hide();
      GlobalMessage.showProgressPanel(uploadCollection, progressPanelOptions);
    },
    showSidePanelView: function (files, onClose) {
      var options = {
        collection: (new FileUploadPanelItemsCollection({ data: files, connector: this.options.connector })),
        connector: this.options.connector,
        context: this.options.context,
        wsNode: this.options.node
      },
        fileUploadInfoView = new FileUploadPanelInfoView(options),
        fileUploadCaptureView = new FileUploadPanelCaptureView(options),
        sidePanel;
      PageLeavingBlocker.enable();
      sidePanel = new (SidePanelView.extend({
        hide: function () {
          var that = this,
            wsId;
          if (options.collection.models.length > 0) {
            ModalAlert.confirmWarning({
              buttons: {
                labelYes: lang.yesLabel,
                labelNo: lang.noLabel
              },
              showHeader: true,
              showTitleIcon: true,
              title: lang.stopUploadConfirmation
            }).always(function (answer) {
              if (answer) {
                if (options.collection.parentId) {
                  wsId = options.wsNode ? options.wsNode.get("id") : 0;
                  options.collection.deletePreviewDocs(wsId, options.collection.parentId);
                }
                PageLeavingBlocker.disable();
                SidePanelView.prototype.hide.call(that);
                onClose && onClose();
              }
            });
          } else {
            PageLeavingBlocker.disable();
            SidePanelView.prototype.hide.call(that);
            onClose && onClose();
          }
        }
      }))({
        slides: [{
          title: lang.panelTitle,
          content: fileUploadInfoView,
          buttons: [{
            label: lang.continueButtonLabel,
            type: 'action',
            id: 'xecmpf-file-upload-panel-continue-btn',
            className: 'binf-btn binf-btn-primary xecmpf-file-upload-panel-continue-btn',
            disabled: false
          }, {
            type: 'next',
            hidden: true,
            disabled: true
          }],
          containerClass: 'xecmpf-file-upload-panel-slide-one'
        }, {
          title: lang.panelTitle,
          content: fileUploadCaptureView,
          buttons: [{
            label: lang.submitButtonLabel,
            type: 'action',
            id: 'xecmpf-file-upload-panel-submit-btn',
            className: 'binf-btn binf-btn-primary xecmpf-file-upload-panel-submit-btn',
            disabled: true
          }, {
            type: 'back',
            hidden: true,
            disabled: true
          }],
          containerClass: 'xecmpf-file-upload-panel-slide-two'
        }],
        backdrop: "sidepanel-backdrop",
        sidePanelClassName: "xecmpf-file-upload-panel",
        layout: {
          header: true,
          resize: true,
          footer: true,
          mask: true
        }
      });
      sidePanel.listenTo(fileUploadInfoView, "button:click", (function (actionButton) {
        var wsId = this.options.node ? this.options.node.get("id") : 0;
        if (actionButton.id === 'xecmpf-file-upload-panel-continue-btn') {
          fileUploadInfoView.blockActions();
          options.collection.getParentLocationId(wsId).then(function (parentId) {
            options.collection.uploadFiles(wsId, parentId).then(function () {
              fileUploadInfoView.unblockActions();
              var errEntries = options.collection.models.filter(function (model) {
                return model.get('upload_err') || false;
              });
              if (errEntries.length < options.collection.models.length) {
                sidePanel.trigger('click:next');
              } else {
                ModalAlert.showError(lang.uploadFailed);
              }
            }, function () {
              fileUploadInfoView.unblockActions();
            });
          }, function (errMsg) {
            ModalAlert.showError(errMsg);
            fileUploadInfoView.unblockActions();
          });
        }
      }).bind(this));
      
      sidePanel.listenTo(fileUploadCaptureView, "button:click", (function (actionButton) {
        var wsId = this.options.node ? this.options.node.get("id") : 0,
          progressPanelOptions = {
            originatingView: this,
            actionType: 'UPLOAD',
            allowMultipleInstances: true,
            hideGotoLocationSingleSet: true,
            hideGotoLocationMultiSet: true,
            context: this.options.context,
            nextNodeModelFactory: NextNodeModelFactory
          },
          models = options.collection.models,
          nodes = _.map(models, function (node) {
            return {
              name: node.get('name'),
              node: node
            };
          }),
          connector = options.connector,
          uploadCollection = new UploadFileCollection(nodes, { connector: connector });
        if (actionButton.id === 'xecmpf-file-upload-panel-submit-btn') {
          sidePanel.updateButton('xecmpf-file-upload-panel-submit-btn', { disabled: true });
          fileUploadCaptureView.categoryData.blockActions();
          fileUploadCaptureView.categoryData.submitDocumentDetails().then(function (response) {
            fileUploadCaptureView.categoryData.unblockActions();
            sidePanel.updateButton('xecmpf-file-upload-panel-submit-btn', { disabled: false });
            uploadCollection.models.forEach(function (val) {
              if (_.findWhere(response.results.successItems, { docId: val.get('node').get('dataId') })) {
                val.set('state', 'resolved');
              }
              else {
                val.set('state', 'rejected');
                val.set('errorMessage', _.findWhere(response.results.failedItems, { docId: val.get('node').get('dataId') }).errMsg);
              }
            });
          }, function (err) {
            fileUploadCaptureView.categoryData.unblockActions();
            sidePanel.updateButton('xecmpf-file-upload-panel-submit-btn', { disabled: false });
            uploadCollection.models.forEach(function (val) {
              val.set('state', 'rejected');
              val.set('errorMessage', lang.uploadFailed);
            });
          });
           this.showGlobalMessage(progressPanelOptions, options.collection, sidePanel, uploadCollection);
        }
      }).bind(this));

      sidePanel.listenTo(fileUploadCaptureView, "update:submit:button", (function (data) {
        var disableSubmitBtn = data.some(function (val) { return val.valid === false });
        if (disableSubmitBtn) {
          sidePanel.updateButton('xecmpf-file-upload-panel-submit-btn', { disabled: true });
        } else {
          sidePanel.updateButton('xecmpf-file-upload-panel-submit-btn', { disabled: false });
        }
      }).bind(this));

      sidePanel.listenTo(sidePanel, 'shown:slide', function (slide, slideIndex) {
        if (slideIndex === 1) {
          if (fileUploadCaptureView && fileUploadCaptureView.categoryData) {
            fileUploadCaptureView.categoryData.onUpdateSubmitButton();
            fileUploadCaptureView.listView.children.findByIndex(0).$el.click();
          }
        }
      });
      sidePanel.show();
    }
  });

  return FileUploadPanelView;

});