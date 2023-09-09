/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/draganddrop/draganddrop.view',
  'csui/controls/fileupload/fileupload',
  'csui/controls/globalmessage/globalmessage',
  'i18n!workflow/widgets/workitem/workitem.attachments/impl/nls/lang'
], function (_, Marionette, DragAndDrop, FileUploadHelper, GlobalMessage, lang) {
  'use strict';
  var WorkItemDragDropView = DragAndDrop.extend({
    constructor: function WorkItemDragDropView(options) {
      DragAndDrop.prototype.constructor.call(this, options);
    },
    onDropView: function (currentEvent) {
      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      var self         = this,
          dataTransfer = currentEvent.originalEvent &&
                         currentEvent.originalEvent.dataTransfer ||
              {
                files: currentEvent.originalEvent &&
                       currentEvent.originalEvent.target &&
                       currentEvent.originalEvent.target.files || []
              };
      this.checkFiles(dataTransfer)
          .always(function (files) {
            files = _.reject(files, function (file) {
              return file instanceof Error;
            });
            if (files.length) {
              if (files.length === 1) {
                self.collection.singleFileUpload = true;
              }
              if (self.canAdd()) {
                var fileUploadModel = FileUploadHelper.newUpload(
                    _.extend({
                      originatingView: self.parentView
                    }, _.clone(self.options))
                );
                var containerId = self.container ? self.container.get("id") : undefined;
                var parentContainerId = (self.parentView && self.parentView.options && self.parentView.options.collection && self.parentView.options.collection.node) ? self.parentView.options.collection.node.get("id") : undefined;
                if (containerId !== parentContainerId) {
                  fileUploadModel.originalCollectionUrl = "";
                }
                fileUploadModel.addFilesToUpload(files, {
                  collection: self.collection
                });
              } else {
                var nodeName = self.container.get('name');
                GlobalMessage.showMessage('error',
                    lang.AddTypeDenied.replace('{1}', nodeName));
              }
            } else {
              GlobalMessage.showMessage('error', lang.NoFiles);
            }
          });
      this.disable();

    },

    onOverView: function (currentEvent) {

      currentEvent.preventDefault();
      currentEvent.stopPropagation();
      this.parentView.showDropMessage = true;
      this.parentView.checkDropMessage = true;

      if (this.leaveViewTimeout) {
        clearTimeout(this.leaveViewTimeout);
        this.leaveViewTimeout = undefined;
      } else if (!this.options.hideDropMessage){
        this.enable(false);
      }
      var dataTransfer = currentEvent.originalEvent &&
                         currentEvent.originalEvent.dataTransfer,
          items = dataTransfer.items,
          validItems = items && items.length && _.all(items, function (item) {
            return item.kind === 'file';
          }),
          types = dataTransfer && dataTransfer.types,
          validTypes = types && types.length && _.any(types, function (type) {
            return type.toLowerCase() === 'files';
          }),
          invalidMessage = lang.dropInvalid;
      this.valid = items && validItems || validTypes;

      if (!this.canAdd()) {
        var validContainer = this.isDndSupportedContainer(this.parentView.container);
        this.valid = validContainer && this.options.isSupportedRowView;
        invalidMessage = lang.dropNotPermitted;
      }

      if (this.currentRowHighlightedTarget) {
        this.highlightedTarget = this.currentRowHighlightedTarget;
        this.currentRowHighlightedTarget = undefined;
      }

      if (!this.options.hideDropMessage && this.valid) {
        this._resetMessage({items: items});
      }

      if (!this.overViewTimeout) {

        this.overViewTimeout = undefined;
        var dropMessage = this.parentView.csuiDropMessage, options,
            isCsuiDisabled = dropMessage.hasClass('csui-disabled');
        if (this.valid) {
          isCsuiDisabled && dropMessage.removeClass('csui-disabled');
          options = {disabled: false, highlightedTarget: this.highlightedTarget};
        } else {

          !isCsuiDisabled && dropMessage.addClass('csui-disabled');
          if (!this.options.hideDropMessage) {
            dropMessage.html(this.template({message: invalidMessage}));
          }
          options = {disabled: true};
        }
        if (!this.options.hideDropMessage) {
          dropMessage.show();
        }
        this.visible = true;
        this.trigger('drag:over', this, options);
      }
    }
  });
  return WorkItemDragDropView;
});
