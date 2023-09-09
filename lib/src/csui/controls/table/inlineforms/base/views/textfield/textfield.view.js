/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/lib/marionette3",
  'hbs!csui/controls/table/inlineforms/base/views/textfield/impl/textfield.view',
  'css!csui/controls/table/inlineforms/base/views/textfield/impl/textfield'
], function ($,
    _,
    Marionette,
    baseTemplate) {

  var TextFieldView = Marionette.View.extend({

    className: function () {
      return "csui-inlineform-text-field csui-inlineform-type-" + this.fieldName;
    },

    ui: {
      'inputFieldName': 'input'
    },

    events: {
      'input @ui.inputFieldName': 'toggleSaveButton',
      'focusin @ui.inputFieldName': 'onFocusInWrite'
    },

    template: baseTemplate,

    templateContext: function () {
      var errorMessage = this.parentView.model.get('csuiInlineFormErrorMessage'),
          data         = {
            haveErrorMessage: !!errorMessage,
            name: this.parentView.model.get(this.fieldName),
            namePlaceholder: this.model.get('namePlaceholder'),
            prefix: this.fieldName
          };

      if (data.haveErrorMessage) {
        data.errorMessage = errorMessage;
        data.errorMsgId = _.uniqueId("err");
      }
      return data;
    },

    constructor: function textFieldView(options) {
      this.parentView = options.parentView;
      this.fieldName = options.model.get('fieldName');
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    toggleSaveButton: function (event) {
      this.updateFieldModel(event.target.value);
      this.parentView.trigger('enable:save:btn');
      this.onInputValueChanged(event);
    },

    onRender: function(){
      var errorMessage = this.parentView.model.get('csuiInlineFormErrorMessage');
      if(!!errorMessage){
        this.$el.find('input').attr('aria-errormessage', this.options.node.get('errorid'));
      }
    },
    onInputValueChanged: function (event) {},
    updateFieldModel: function (newValue) {
      var oldValue   = this.parentView.model.get(this.fieldName),
          validValue = false;
      newValue = newValue.trim();

      if (!newValue.length || newValue === oldValue) {
        var isCreateMode = this.parentView.model.get('id') === undefined;
        if (isCreateMode && !!oldValue) {
          validValue = !!this.model.get('required') ? !!newValue : true;
        } else {
          validValue = false;
        }
      } else {
        validValue = true;
      }

      this.model.set({'validField': validValue, 'value': newValue});

      return validValue;
    },

    onFocusInWrite: function (event) {
      var currentInputElement    = $(event.target)[0],
          currentInputElementVal = currentInputElement.value,
          selEnd                 = !!currentInputElementVal ? currentInputElementVal.length : 0;
      if (this.model.get("type") === 144 && currentInputElementVal.lastIndexOf('.') > 0 &&
          currentInputElementVal.lastIndexOf('.') < currentInputElementVal.length - 1) {
        selEnd = currentInputElementVal.lastIndexOf('.');
      }
      currentInputElement.selectionEnd = selEnd;
    },

    isReadyToSave: function () {
      var inputName    = this._getInputName(),
          isValidInput = false;
      if (inputName.length > 0) {
        var regExp = this.model.get('regex');
        isValidInput = regExp ? inputName.match(this.model.get('regex')) : true;
      }
      isValidInput && this.model.set('value', inputName);
      return isValidInput;
    },

    _getInputName: function () {
      if (this.model.get('regex')) {
        return this._getInputUrl();
      }
      var elInput = this.ui.inputFieldName;
      var name = elInput.val();
      name = name.trim();
      return name;
    },
    _getInputUrl: function () {
      var elInput = this.ui.inputFieldName;
      var url = $(elInput).val().trim();
      if (!!url.length && !url.match(this.model.get('regex'))) {
        url = (!!url.match(/^[a-zA-Z]+:\/\//)) ? url : 'http://' + url;
        this.model.set('value', url);
      }

      return url;
    },

  });

  return TextFieldView;

});

