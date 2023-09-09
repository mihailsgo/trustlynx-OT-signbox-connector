/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "csui/lib/underscore",
  "csui/lib/marionette3",
  'hbs!csui/controls/table/inlineforms/base/views/selectfield/impl/selectfield.view',
  'css!csui/controls/table/inlineforms/base/views/selectfield/impl/selectfield'
], function (
    _, Marionette, baseTemplate) {

  var selectFieldView = Marionette.View.extend({

    className: function () {
      return "csui-inlineform-type-" + this.fieldName;
    },

    ui: {
      'inputFieldName': 'select'
    },

    events: {
      'change @ui.inputFieldName': 'toggleSaveButton'
    },

    templateContext: function () {
      var errorMessage = this.parentView.model.get('csuiInlineFormErrorMessage'),
          data = {
            haveErrorMessage: !!errorMessage,
            name: this.parentView.model.get(this.fieldName),
            namePlaceholder: this.model.get('namePlaceholder'),
            prefix: this.fieldName,
            selectEnum: this.selectEnum
          };

      if (data.haveErrorMessage) {
        data.errorMessage = errorMessage;
        data.errorMsgId = _.uniqueId("err");
      }
      return data;
    },

    template: baseTemplate,

    constructor: function selectFieldView(options) {
      this.parentView = options.parentView;
      this.fieldName = options.model.get('fieldName');
      this.selectEnum = [];
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.fetchDropDownValues();
    },

    toggleSaveButton: function (event) {
      this.updateFieldModel(event.target.value);
      this.parentView.trigger('enable:save:btn');
    },
    updateFieldModel: function (newName) {
      newName = newName.trim();
      if (!newName.length || newName === this.parentView.model.get(this.fieldName)) {
        this.model.set({'validField': false, 'value': newName});
        return false;
      } else {
        this.model.set({'validField': true, 'value': newName});
        return true;
      }
    },

    isReadyToSave: function () {
      var inputName = this._getInputName();
      return (inputName.length > 0);
    },

    _getInputName: function () {
      var elInput = this.ui.inputFieldName,
          name = elInput.val();
      name = name && name.trim();
      return name;
    },

    fetchDropDownValues: function () {
      var options = {
        context: this.options.context,
        node: this.parentView.model
      };

      var enumval = this.model.get('getData');
      if (_.isFunction(enumval)) {
        enumval(options).always(_.bind(function (selectEnum) {
          this.selectEnum = selectEnum;
          this.render();
          this.bindUIElements();
        }, this));
      } else {
      }
    }

  });

  return selectFieldView;

});