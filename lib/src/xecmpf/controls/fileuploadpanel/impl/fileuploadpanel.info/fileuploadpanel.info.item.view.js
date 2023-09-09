/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/marionette',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.info/fileuploaditem',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.info/fileuploaditem',
], function (Marionette, fileItemTemplate, lang) {
  "use strict";

  var FileInfoItemView = Marionette.ItemView.extend({
    className: 'xecmpf-file-upload-item',
    tagName: 'li',
    template: fileItemTemplate,
    ui: {
      deleteBtn: '.xecmpf-file-upload-item-delete .xecmpf-file-upload-item-delete-icon'
    },
    initialize: function () {
      this.$el.attr('role', 'listitem').attr('tabindex', -1);
    },
    events: {
      'click @ui.deleteBtn': 'deleteUploadItem',
      'keydown @ui.deleteBtn': 'doClickOnEnter'
    },
    templateHelpers: function () {
      return {
        name: this.model.get('name'),
        size: this.formatFilzeSize(this.model.get('size')),
        iconClass: this.model.get('iconClass'),
        sizeLabel: lang.sizeLabel,
        deleteItemTitle: lang.deleteItemTitle
      }
    },
    formatFilzeSize: function (size) {
      if (size) {
        var filesSize = lang.fileSizeByte;
        if (size > 1024) {
          filesSize = lang.fileSizeKByte;
          size = size / 1024;
          if (size > 1024) {
            filesSize = lang.fileSizeMByte;
            size = size / 1024;
            if (size > 1024) {
              filesSize = lang.fileSizeGByte;
              size = size / 1024;
            }
          }
        }
        return Math.ceil(size) + ' ' + filesSize;
      }
      return size;
    },
    doClickOnEnter: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        this.trigger('delete:uploaded:item', this.model, { keyBoardEvent: true });
      }
    },
    deleteUploadItem: function () {
      this.trigger('delete:uploaded:item', this.model);
    }
  });
  return FileInfoItemView;
});