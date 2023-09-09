/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/lib/alpaca/js/alpaca.lite',
  'xecmpf/controls/form/fields/documenttypepicker.view',
  'i18n!xecmpf/controls/form/impl/nls/lang'
], function (_, $, Backbone,
    Marionette, Alpaca,
    DocumentTypePickerView,
    Lang) {

  Alpaca.Fields.XecmpfDocumentTypePickerField = Alpaca.Fields.TextField.extend({

    constructor: function XecmpfDocumentTypePickerField(container, data, options, schema, view,
        connector, onError) {
      var errorMessage = "Invalid item";
      options = _.extend(options, {
        alpacaFieldType: 'xecmpf_document_type_picker',
        lang: {
          invalidItem: errorMessage
        },
      });

      this.base(container, data, options, schema, view, connector, onError);
    },

    setValueAndValidate: function (value, validate) {
      this.setValue(value);
      var bIsValid = true;
      if (validate) {
        bIsValid = this.validate();
        this.refreshValidationState(false);
      } else {
        this.fieldView.$el.trigger($.Event('field:invalid'));
        var formValue = this.fieldView.ui.writeField && this.fieldView.ui.writeField.val();
        if (this.fieldView.$el.hasClass('cs-formfield-invalid') && this.fieldView.preVal !==
            formValue) {
          this.fieldView.$el.find('input.typeahead').select();
          this.fieldView.preVal = formValue;
        }
      }
      return bIsValid;
    },

    postRender: function (callback) {
      this.base(callback);
      this.showField({
        'classification_name': "",
        'classification_id': null
      });
      this.field.parent().addClass("csui-field-" + this.getFieldType());
    },

    getValue: function () {
      var retValue = "";
      if (!!this.data && !!this.data.classification_id) { // updated field
        retValue = this.data.classification_id;
      } else if (!!this.data) { // initial value
        retValue = (this.data.classification_id === "" || this.data.classification_id === null) ?
                   "" : this.data;
      }
      return retValue;
    },

    handleValidate: function () {
      var ret = this.base();
      if (!ret) {
        var arrayValidations = this.validation;
        if (this.fieldView.$el.find("input").val() !== undefined &&
            this.fieldView.$el.find("input").val()) {
          arrayValidations["notOptional"]["status"] = true;
          arrayValidations["notOptional"]["message"] = "";
          return ret;
        }
        for (var validation in arrayValidations) {
          if (arrayValidations[validation]["status"] === false) {
            if (validation !== "notOptional") {
              arrayValidations[validation]["status"] = true;
              arrayValidations[validation]["message"] = "";
            }
          }
        }
      }
      return ret;
    },

    showField: function (data) {

      var id = this.id;
      var id4Label, id4Description = this.options ? this.options.descriptionId : '',
          labelElement             = $(this.field[0]).find('label');

      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr('for') + "Label";
        labelElement.attr('id', id4Label);
      }
      this.fieldView = new DocumentTypePickerView({
        model: new Backbone.Model({
          data: data,
          options: this.options,
          schema: this.schema,
          inputType: 'text',
          id: id
        }),
        data: data,
        context: this.connector.config.context,
        id: _.uniqueId(id), // wrapper <div>
        alpacaField: this,
        labelId: id4Label,
        descriptionId: id4Description,
        value: this.data,
        dataId: this.name,
        path: this.path,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        }
      });

      if (this.options.fieldValidator) {
        this.options.validator = this.options.fieldValidator;
      } else {
        this.options.validator = function (callback) {
          var status = this.fieldView && this.fieldView.getItemPicked &&
                       this.fieldView.getItemPicked();
          callback({
            "status": status,
            "message": status ? "" :
                       this.options.lang && this.options.lang.invalidItem || Lang.invalidItem
          });
        };
      }
      var $field = $('<div>').addClass('alpaca-control');
      this.getControlEl().replaceWith($field);
      this.region = new Marionette.Region({el: $field});
      this.region.show(this.fieldView);

      return;
    },
  });

  Alpaca.registerFieldClass('xecmpf_document_type_picker',
      Alpaca.Fields.XecmpfDocumentTypePickerField);

  return $.alpaca.Fields.XecmpfDocumentTypePickerField;
});
