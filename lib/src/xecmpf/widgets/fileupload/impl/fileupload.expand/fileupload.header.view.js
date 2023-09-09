/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/marionette',
    'csui/controls/perspective.header/perspective.header.view',
    'csui/dialogs/file.open/file.open.dialog',
    'xecmpf/controls/fileuploadpanel/fileuploadpanel.view',
    'hbs!xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.header',
    'i18n!xecmpf/widgets/fileupload/impl/nls/lang',
    'css!xecmpf/widgets/fileupload/impl/fileupload'
], function (_, $, Marionette, PerspectiveHeaderView, FileOpenDialog, FileUploadPanelView, headerTemplate, lang) {

    var FileUploadPerspectiveHeaderView = PerspectiveHeaderView.extend({
        template: headerTemplate,
        templateHelpers: function () {
            return {
                filterTitle: lang.showFilterTitle,
                backTitle: lang.backTitle,
                icon: this.options.icon,
                title: this.options.title,
                addTitle: lang.addTitle,
                addItem: lang.addItem,
                addDocumentLabel: lang.addDocumentLabel
            };
        },
        events: {
          'click .xecmpf-fileupload-upload-btn': 'onUploadBtnClick'
        },
        constructor: function FileUploadPerspectiveHeaderView(options) {
            PerspectiveHeaderView.prototype.constructor.apply(this, arguments);
            this.fileUploadPanelView = new FileUploadPanelView({
              connector: this.options.connector,
              context: this.options.context,
              node: this.options.node
            });
        },
        onKeyInView: function (event) {
            if (event.keyCode === 32 || event.keyCode === 13) {
                $(event.target).find(".action-element").click();
                $(event.target).focus();
            }
        },
        onUploadBtnClick: function () {
          var fileOpenDialog = new FileOpenDialog({multiple: true});
          fileOpenDialog.listenTo(fileOpenDialog, 'add:files', (function (files) {
                console.log("Number of files uploaded ", files.length);
                fileOpenDialog.destroy();
                this.fileUploadPanelView.showSidePanelView(files);
              }).bind(this))
              .show();
        }
    });
    return FileUploadPerspectiveHeaderView;

});