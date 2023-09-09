/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/lib/alpaca/js/alpaca.lite',
  'csui/controls/form/fields/typeaheadfield.view', 'csui/utils/base',
  'i18n!csui/controls/form/impl/nls/lang'
], function (module, _, $, Backbone, Marionette, Alpaca, TypeaheadFieldView, base,
    Lang) {
  
  var AlpTypeaheadFieldMixin = {
    mixin: function (prototype) {

      return _.extend(prototype, {

        makeAlpTypeaheadField: function () {
        },

        getFieldType: function () {
          return this.options !== undefined ? this.options.alpacaFieldType || '' : '';
        },

        postRender: function (callback) {
          var base = this.base;
          var data = {
            id: this.data,
            name: this.options.type_control ? this.options.type_control.name : ''
          };
          this.itemModel = undefined;
          if (!!this.data && this.data !== this.options.noId) {
            if (this.options.ItemModelFactory){
              this.itemModel = this.connector.config.context.getModel(this.options.ItemModelFactory, {
                attributes: {id: this.data || ''},
                temporary: true
              });
              var that = this;
              this.itemModel.ensureFetched().done(function () {
                base.call(that,callback);
                that.showField(that.itemModel.attributes);
                that.field.parent().addClass("csui-field-" + that.getFieldType());
                that.field.parent().addClass(that.options.alpacaFieldClasses||'csui-field-otcs_typeahead');
              }).fail(function(xhr){
                base.call(that,callback);
                that.showField(_.extend(data,{id:null}));
                that.field.parent().addClass("csui-field-" + that.getFieldType());
                that.field.parent().addClass(that.options.alpacaFieldClasses||'csui-field-otcs_typeahead');
                var message = xhr&&xhr.responseJSON&&xhr.responseJSON.error||that.options.lang&&that.options.lang.invalidItem||Lang.invalidItem;
                that.displayMessage([{id:"custom",message:message}], that.valid);
              });
            } else {
              base.call(this,callback);
              this.showField(_.extend(data,{id:null}));
              this.field.parent().addClass("csui-field-" + this.getFieldType());
              this.field.parent().addClass(this.options.alpacaFieldClasses||'csui-field-otcs_typeahead');
            }
          } else {
            base.call(this,callback);
            this.showField(data);
            this.field.parent().addClass("csui-field-" + this.getFieldType());
            this.field.parent().addClass(this.options.alpacaFieldClasses||'csui-field-otcs_typeahead');
          }
        },
    
        showField: function (data) {
    
          var id = this.id;
          var id4Label,
              id4Description = this.options ? this.options.descriptionId : '',
              labelElement             = $(this.field[0]).find('label');
    
          if (labelElement && labelElement.length === 1) {
            id4Label = labelElement.attr('for') + "Label";
            labelElement.attr('id', id4Label);
          }
          
          var FieldView = this.options.TypeaheadFieldView || TypeaheadFieldView;
          this.fieldView = new FieldView({
            context: this.connector.config.context,
            data: data,
            applyFlag: this.options.applyFlag,
            model: _.extend(new Backbone.Model({
              data: data,
                options: this.options,
                schema: this.schema,
                id: this.id
              }),{
                imageAttribute: this.itemModel && this.itemModel.imageAttribute,
                nameAttribute: this.itemModel && this.itemModel.nameAttribute
              }),
            dataId: this.name,
            noId: this.options.noId,
            alpacaField: this,
            labelId: id4Label,
            descriptionId: id4Description,
            path: this.path,
            alpaca: {
              data: this.data,
              options: this.options,
              schema: this.schema
            },
            id: _.uniqueId(this.id), // wrapper <div>
            css: this.options.css,
            lang: this.options.lang,
            pickerOptions: this.options.pickerOptions
          });
          if (this.options.fieldValidator) {
            this.options.validator = this.options.fieldValidator;
          } else {
            this.options.validator = function (callback) {
              var status = this.fieldView && this.fieldView.getItemPicked && this.fieldView.getItemPicked();
              callback({
                "status": status,
                "message": status ? "" : this.options.lang&&this.options.lang.invalidItem||Lang.invalidItem
              });
            };
          }
          var $field = $('<div>').addClass('alpaca-control');
          this.containerItemEl.find(".alpaca-control").replaceWith($field);
          this.region = new Marionette.Region({el: $field});
          this.region.show(this.fieldView);
          
        },
    
        getValue: function () {
          var retValue = "";
          if (!!this.data && !!this.data.id) { // updated field
            retValue = this.data.id;
          } else if (!!this.data) { // initial value
            retValue = (this.data.id === "" || this.data.id === null) ? "" : this.data;
          }
          return retValue;
        },
    
        setValueAndValidate: function (value, validate) {
          this.setValue(value);
          var bIsValid = true;
          if (validate) {
            bIsValid = this.validate();
            this.refreshValidationState(false);
          } else {
            this.fieldView.$el.trigger($.Event('field:invalid'));
            var formValue= this.fieldView.ui.writeField && this.fieldView.ui.writeField.val();
            if (this.fieldView.$el.hasClass('cs-formfield-invalid') && this.fieldView.preVal !== formValue) {
               this.fieldView.$el.find('input.typeahead').select();
               this.fieldView.preVal=formValue;
            }
          }
          return bIsValid;
        },
    
        destroy: function () {
          this.base();
          if (this.region) {
            this.region.destroy();
          }
        },
    
        handleValidate: function () {
          var ret = this.base();
          if (!ret) {
            var arrayValidations = this.validation;
            if (this.fieldView.$el.find(".picker-container input").val() !== undefined &&
                this.fieldView.$el.find(".picker-container input").val()) {
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
        }
      
      });
    }
  };

  return AlpTypeaheadFieldMixin;
});
