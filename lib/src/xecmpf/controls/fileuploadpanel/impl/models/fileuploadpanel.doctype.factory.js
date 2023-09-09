/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/utils/contexts/factories/factory',
  'xecmpf/controls/fileuploadpanel/impl/models/fileuploadpanel.doctype.model'
], function (_,
    ModelFactory,
    FileUploadPanelDocTypeModel) {

  var FileUploadPanelDocTypeFactory = ModelFactory.extend({

    propertyPrefix: 'fileUploadPanelDocType',

    constructor: function FileUploadPanelDocTypeFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      this.property = new FileUploadPanelDocTypeModel(options.fileUploadPanelDocType.options);
      this.fetch();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return FileUploadPanelDocTypeFactory;

});