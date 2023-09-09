/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/marionette',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.list/fileuploadpanel.capture.list.view',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.data/fileuploadpanel.capture.data.view',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture',
], function (Marionette, FileUploadCaptureListView, FileUploadCaptureCategoryDataView, fileUploadCaptureTemplate, lang) {
  "use strict";

  var FileUploadPanelCaptureView = Marionette.LayoutView.extend({
    className: 'xecmpf-file-upload-capture',
    template: fileUploadCaptureTemplate,
    regions: {
      listRegion: '#xecmpf-file-upload-capture-list',
      categoryDataRegion: '#xecmpf-file-upload-capture-category-data'
    },
    constructor: function FileUploadPanelCaptureView(options) {
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },
    onRender: function () {
      this.listView = new FileUploadCaptureListView({ collection: this.options.collection, context: this.options.context });
      this.categoryData = new FileUploadCaptureCategoryDataView({ collection: this.options.collection, context: this.options.context, wsNode: this.options.wsNode, connector: this.options.connector });
      this.listRegion.show(this.listView);
      this.categoryDataRegion.show(this.categoryData);
      this.listenTo(this.listView, 'on:document:select', (function (args) {
        this.categoryData.trigger('on:document:select', args);
      }).bind(this));
      this.listenTo(this.listView, 'get:form:status', (function (args) {
        this.categoryData.trigger('get:form:status', args);
      }).bind(this));
      this.listenTo(this.categoryData, 'update:form:status', (function (args) {
        this.listView.trigger('update:form:status', args);
      }).bind(this));
      this.listenTo(this.categoryData, 'update:submit:button', (function (args) {
        var selectedOne = args.filter(function (val) { return val.selected });
        if (selectedOne.length > 0) {
          this.listView.trigger('update:form:status', selectedOne[0]);
        }
        this.trigger('update:submit:button', args);
      }).bind(this));
    }
  });

  return FileUploadPanelCaptureView;

});