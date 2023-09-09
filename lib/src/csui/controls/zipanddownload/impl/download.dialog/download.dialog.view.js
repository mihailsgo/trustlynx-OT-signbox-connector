/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/underscore',
      'csui/controls/dialog/dialog.view', 'csui/utils/base', 'csui/utils/nodesprites',
      'csui/controls/tile/behaviors/perfect.scrolling.behavior',      
      'i18n!csui/controls/zipanddownload/impl/nls/lang', 'csui/models/node/node.model',
      'csui/utils/accessibility',
      'hbs!csui/controls/zipanddownload/impl/download.dialog/impl/download.dialog',
      'css!csui/controls/zipanddownload/impl/download.dialog/impl/download.dialog'
    ],
    function ($, Backbone, _, DialogView, base, NodeSprites, PerfectScrollingBehavior,
         lang, NodeModel, Accessibility, template) {
      var DownloadDialogView = DialogView.extend({
        className: 'csui-zipanddownload-dialog csui-download-dialog',
        template: template,
        templateHelpers: function () {
          var jobs                 = this.options.model,
              unprocessedItemsSize = this.options.model.get("unprocessed_items_list") &&
                                     this.options.model.get("unprocessed_items_list").length,
              alertMsgId = _.uniqueId('msg'),
              nameErrorId = _.uniqueId('err');
          if (this.options.model.get("unprocessed_items_list")) {
            this.options.model.get("unprocessed_items_list").map(function (skippedModel) {
              skippedModel.mimeIcon = NodeSprites.findClassByNode(new NodeModel({
                id: skippedModel.id,
                container: skippedModel.container,
                mime_type: skippedModel.mimetype,
                type: skippedModel.subtype
              }));
            });
          }
          if (unprocessedItemsSize && unprocessedItemsSize>0) {
            this.describedBy = alertMsgId;
          }
          var tempSize = jobs.get("total_size"),
          tempItemCount = jobs.get("total");
          return {
            inputId: _.uniqueId('input'),
            alertMsgId: alertMsgId,
            nameErrorId: nameErrorId,
            skipped: jobs.get("total_skipped"),
            skippedTypes: jobs.get("unprocessed_items_list"),
            supported: jobs.get("total_supported"),
            size: base.formatFriendlyFileSize(jobs.get("total_supported_size")),
            fileName: this.options.model.get('name'),
            zipFileName: lang.zipFileName,
            labelType: lang.labelType,
            labelName: lang.labelName,
            labelLocation: lang.labelLocation,
            labelMessage: lang.labelMessage,
            skippedItemsLabel: _.str.sformat(
                unprocessedItemsSize === 1 ? lang.skippedItemLabel : lang.skippedItemsLabel,
                unprocessedItemsSize),
            itemsCount: tempItemCount? tempItemCount+ ' ' + lang.txtItems : '',
            fileSize: tempSize? base.formatFriendlyFileSize(tempSize * 1024) : '',
          };
        },

        ui: _.extend(
            {
              fileName: 'input[name=download-name]',
              errorEl: '.csui-archive-name-error'
            }, DialogView.prototype.ui
        ),

        events: _.extend(
            {
              'keypress @ui.fileName': 'downloadArchive',
              'focusin @ui.fileName': 'onFocusInFileName'
            }, DialogView.prototype.events
        ),

        behaviors: {
        },

        constructor: function DownloadDialogView(options) {
          options || (options = {});
          options.dialogTxtAria = lang.downloadDialogTitle;
          DialogView.prototype.constructor.call(this, options);
        },

        downloadArchive: function (e) {
          if (e.type === 'keypress' && e.keyCode === 13) {
            e.preventDefault();
            var downloadBtn = this.$el.find("#zipDownload").first();
            if (downloadBtn.length && !downloadBtn.is(':disabled')) {
              downloadBtn.trigger('click');
            }
          }
        },

        onFocusInFileName: function (event) {
          if (Accessibility.isAccessibleMode()) { return; }
          var currentInputElement    = $(event.target)[0],
              currentInputElementVal = currentInputElement.value,
              selEnd                 = !!currentInputElementVal ? currentInputElementVal.length : 0;

          if (currentInputElementVal.lastIndexOf('.') > 0 &&
              currentInputElementVal.lastIndexOf('.') < currentInputElementVal.length - 1) {
            selEnd = currentInputElementVal.lastIndexOf('.');
          }
          currentInputElement.selectionEnd = selEnd;
        }
      });
      return DownloadDialogView;
    }
);