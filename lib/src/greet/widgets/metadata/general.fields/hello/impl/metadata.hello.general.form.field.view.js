/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/marionette',
  'csui/controls/form/form.view'
], function (Marionette, FormView) {
  'use strict';

  var MetadataHelloGeneralFormFieldView = FormView.extend({

    constructor: function MetadataHelloGeneralFormFieldView(options) {
      FormView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'change:field', this._saveField);
    },

    _saveField: function (args) {
      if (this.mode === 'create') {
        return;
      }
    }

  });

  return MetadataHelloGeneralFormFieldView;

});
