/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

define(['csui/models/form', 'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang'], function (FormModel, lang) {
    var FileUploadPanelCategoryFormModel = FormModel.extend({
        constructor: function FileUploadPanelDocTypeFormModel(options) {
            this.options = options || (options = {});
            var context = options.context,
                attributes  = {
                  schema: { properties: {} },
                  options: { fields: {} },
                  data: {}
                };
            FormModel.prototype.constructor.call(this, attributes, options);
        },
        resetToEmptyRequiredModel: function() {
          this.set({
            schema: { properties: {} },
            options: { fields: {} },
            data: {}
          });
        }
    });
    return FileUploadPanelCategoryFormModel;
});