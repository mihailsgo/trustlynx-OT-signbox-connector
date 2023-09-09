/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define([
  'require',
  'csui/lib/marionette',
  'csui/utils/commands/open.plugins/open.plugins',
  'csui/models/node/node.model',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.preview/fileuploadpanel.preview.error.view',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.preview/impl/fileuploadpanel.preview',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.preview/impl/fileuploadpanel.preview',
], function (require, Marionette, OpenPlugins, NodeModel, FileUploadPreviewError, PreviewTemplate, lang) {

  var FileUploadPanelPreviewView = Marionette.LayoutView.extend({

    className: 'xecmpf-file-upload-preview',
    attributes: {
      contenteditable: 'false'
    },
    regions: {
      viewer: '.xecmpf-file-upload-preview-viewer'
    },
    constructor: function FileUploadPanelPreviewView(options) {
      this.options = options || {};
      Marionette.LayoutView.prototype.constructor.apply(this, this.options);
    },
    initialize: function () {
      this.previewLoaded = false;
      Marionette.LayoutView.prototype.initialize.apply(this, arguments);
    },
    template: PreviewTemplate,
    showPreview: function () {
      var docNodeDetails,
        docNode,
        plugin,
        widgetView,
        docView;
      if (!this.previewLoaded && this.options.model.get('node')) {
        docNodeDetails = this.options.model.get('node');
        if (docNodeDetails && docNodeDetails.data && docNodeDetails.data.properties) {
          docNode = new NodeModel(docNodeDetails.data.properties, { connector: this.options.connector });
          plugin = OpenPlugins.findByNode(docNode, {});
          widgetView = (plugin && plugin.widgetView) || "";
          require([widgetView], (function (DocumentView) {
            docView = new DocumentView({ data: { id: this.options.model.get('dataId') }, context: this.options.context });
            this.viewer.show(docView);
            this.listenTo(docView, 'destroy', (function () {
              this.viewer.show(new FileUploadPreviewError({ model: this.options.model }));
            }).bind(this));
            this.previewLoaded = true;
          }).bind(this));
        }
      }
    }
  });

  return FileUploadPanelPreviewView;

});

