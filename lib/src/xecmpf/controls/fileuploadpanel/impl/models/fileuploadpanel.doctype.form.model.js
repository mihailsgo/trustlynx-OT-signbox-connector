/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

define(['csui/models/form', 'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang'], function (FormModel, lang
) {
    var FileUploadPanelDocTypeFormModel = FormModel.extend({
        constructor: function FileUploadPanelDocTypeFormModel(options) {
            this.options = options || (options = {});
            var context = options.context,
                attributes  = {
                  schema: { properties: {} },
                  options: { fields: {} },
                  date: {}
                };
            options.docTypeModel.on('change', (function () {
              if ( options.docTypeModel.hasChanged('docTypes') ) {
                this._setAttributes(options.docTypeModel);
              }
            }).bind(this));
            FormModel.prototype.constructor.call(this, attributes, options);
        },
        initialize: function (attributes, options) {
            this._setAttributes(this.options.docTypeModel);
        },
        _setAttributes: function ( docTypeModel ) {
            var docTypes, values = [], keys = [];
            if ( docTypeModel && docTypeModel.get('docTypes') ) {
              docTypes = docTypeModel.get('docTypes');
              values = docTypes.map(function(val) { return val.classification_id });
              keys = docTypes.map(function(val) { return val.classification_name });
            }
            this.set({
                schema: {
                    properties: {
                        doc_type: {
                            required: true,
                            type: 'select',
                            enum: values
                        }
                    }
                },
                options: {
                    fields: {
                      doc_type: {
                            label: lang.docTypeLabel,
                            type: 'select',
                            optionLabels: keys,
                            'events': {
                              'change': function() {
                                  this.fieldView.formView.trigger('doctype:change', this.getValue());
                              }
                            }
                        }
                    }
                },
                data: {
                  doc_type: ''
                }
            });
        }
    });
    return FileUploadPanelDocTypeFormModel;
});