/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/handlebars',
  'csui/utils/base',
  'csui/utils/contexts/factories/connector',
  'csui/controls/form/fields/base/csformfield.view',
  'csui/utils/log',
  'xecmpf/controls/form/impl/fields/documenttypepicker/documenttypecollection',
  'hbs!xecmpf/controls/form/impl/fields/documenttypepicker/documenttypepicker',
  'i18n!xecmpf/controls/form/impl/nls/lang',
  'css!xecmpf/controls/form/impl/fields/documenttypepicker/documenttypepicker',
  'csui/lib/bootstrap3-typeahead'
], function (module, require, _, $, Backbone, Handlebars, base, ConnectorFactory,
    FormFieldView, Log, DocumentTypeCollection, template,
    lang) {

  var log = new Log(module.id);

  var DocumentTypePicker = FormFieldView.extend({

    constructor: function DocumentTypePicker(options) {
      FormFieldView.apply(this, arguments);
      options = options || {};
      this.connector = options.context.getObject(ConnectorFactory);
      this.emptyTemplate = Handlebars.compile(
          '<span>' +
          '<li class="csui-typeahead-picker-no-results {{#if classNoResults}}' +
          ' {{classNoResults}}{{/if}}">{{langNoResults}}</li>' +
          '</span>')({
        classNoResults: 'documenttypepicker-noresults',
        langNoResults: lang.noResultFound
      });
    },
    className: 'cs-formfield cs-documenttypepicker',

    template: template,
    typeaheadFieldWithCaret: true,

    ui: function () {
      return _.defaults({
        itempicker: 'div.cs-item-picker',
        caretIcon: '.icon-caret-down',
        inputBox: 'input',
      }, FormFieldView.prototype.ui);
    },

    events: function () {
      return _.defaults({
        'mousedown @ui.caretIcon': 'clickCaretIcon',
        'mousedown @ui.inputBox': 'mouseDownOnInput',
        'mouseup @ui.inputBox': 'mouseUpOnInput',
        'focus @ui.inputBox': 'selectText',
        'blur @ui.inputBox': 'onBlur',
        'keydown @ui.inputBox': 'onKeyDown',
        'mousedown': 'onMouseDown'
      }, FormFieldView.prototype.events);
    },

    templateHelpers: function () {
      var multiFieldLabel        = "",
          writeModeAria          = "",
          data                   = lang.alpacaPlaceholderGeneric,
          writeData              = "",
          readModeAria           = "", // better default value?
          readModeMultiFieldAria = "", // better default value?
          isRequired             = false,
          isReadOnly             = this.mode === "readonly",
          requiredTxt            = "",
          placeholder            = this.options.alpacaField && this.options.alpacaField.options &&
                                   this.options.alpacaField.options.placeholder ||
                                   lang.alpacaPlaceholderDocumentTypePicker,
          maxLength              = this.options.alpacaField && this.options.alpacaField.schema &&
                                   this.options.alpacaField.schema.maxLength;

      isRequired = this.options.alpacaField && this.options.alpacaField.isRequired();
      requiredTxt = isRequired ? lang.requiredField : "";
      writeModeAria = this.alpacaField.options.label || placeholder;
      if (!!this.model.get('data').classification_name) {
        data = this.model.get('data').classification_name;
        writeData = this.model.get('data').classification_name;
      }
      if (this.alpacaField && this.alpacaField.options &&
          this.alpacaField.options.isMultiFieldItem) {
        multiFieldLabel = (this.alpacaField.parent && this.alpacaField.parent.options) ?
                          this.alpacaField.parent.options.label : "";
      }
      if (this.model.get('options')) {
        readModeAria = isReadOnly ?
                       _.str.sformat(lang.fieldReadOnlyAria, this.model.get('options').label,
                           data) + requiredTxt :
                       _.str.sformat(lang.fieldEditAria, this.model.get('options').label, data) +
                       requiredTxt;
      }

      readModeMultiFieldAria = isReadOnly ?
                               _.str.sformat(lang.fieldReadOnlyAria, multiFieldLabel, data) +
                               requiredTxt :
                               _.str.sformat(lang.fieldEditAria, multiFieldLabel, data) +
                               requiredTxt;
      return _.extend(FormFieldView.prototype.templateHelpers.apply(this), {
        inputType: 'text',
        idBtnLabel: this.options.labelId,
        idBtnDescription: this.options.descriptionId,
        writeModeAria: writeModeAria,
        readModeAria: readModeAria,
        readModeMultiFieldAria: readModeMultiFieldAria,
        multiFieldLabel: multiFieldLabel,
        ariaRequired: isRequired,
        maxLength: maxLength,
        placeholder: placeholder,
        data: data,
        writeData: writeData
      });
    },

    initialize: function () {
      this.collection = new DocumentTypeCollection(undefined, {
        connector: this.options.context.getObject(ConnectorFactory),
        autoreset: true
      });
      this.collection.businessWorkspaceId = this.options.alpacaField &&
                                            this.options.alpacaField.options.businessWorkspaceId;
      this.getDocumentTypes();
    },
    onMouseDown: function (event) {
      if (this._isInPicker(event.target, '.typeahead.scroll-container')) {
        event.preventDefault();
        event.stopPropagation();
      }
    },

    _isInPicker: function (element, included) {
      var picker = this.$(".cs-item-picker");
      if (picker[0] && $.contains(picker[0], element)) {
        if (included && $(included).length) {
          if ($.contains($(included)[0], element)) {
            return true;
          }
        }
      }
      return false;
    },

    onBlur: function () {
      this.ui.inputBox.attr("aria-expanded", false);
    },

    selectText: function () {
      this.ui.inputBox.select();
    },

    mouseDownOnInput: function () {
      this.typeahead.options.showHintOnFocus = true;
    },

    mouseUpOnInput: function () {
      this.typeahead.options.showHintOnFocus = false;
    },

    isDropDownOpen: function () {
      return $('.binf-dropdown-menu').is(":visible");
    },

    isReadyToSave: function () {
      return this.getItemPicked();
    },

    getDocumentTypes: function (args) {
      this.collection.fetch();
    },

    source: function () {
      return this.collection.models;
    },

    setItemPicked: function (bool) {
      this.itemPicked = bool;
    },

    getItemPicked: function () {
      return this.itemPicked;
    },

    _afterSelect: function (item) {
      this.setItemPicked(true);
      this.ui.inputBox.attr("aria-expanded", false);
      this.editValue = item.attributes;
      this.selectText();
      this.alpacaField && this.alpacaField.refreshValidationState(false);
    },

    _retrieveDisplayText: function (item) {
      return item.get('classification_name');
    },

    onRender: function () {
      this.data = this.model.get('data');
      this.editValue = this.data;
      this.curVal = this.editValue;
      this.ui.inputBox.on('keyup', this.onKeyUp.bind(this));
      var typeaheadOptions = {
        items: 'all',
        showHintOnFocus: false,
        minLength: 0,
        source: this.source.bind(this),
        afterSelect: _.bind(this._afterSelect, this),
        autoSelect: false,
        appendTo: this.ui.itempicker,
        prettyScrolling: true,
        handleNoResults: true,
        emptyTemplate: this.emptyTemplate,
        displayText: this._retrieveDisplayText.bind(this),
        afterShow: this._adjustPerfectScroll.bind(this),
        scrollContainerHeight: 240,
        selectOnBlur: false
      };
      this.ui.inputBox.typeahead(typeaheadOptions);
      this.typeahead = this.ui.inputBox.data().typeahead;
      this.setItemPicked(true);
    },

    _adjustPerfectScroll: function () {
      this.typeahead.$scrollContainer.perfectScrollbar("update");
      this.ui.inputBox.attr("aria-expanded", true);
    },

    trySetValue: function () {
      var editVal           = this.getEditValue() !== null &&
                              this.getEditValue() !== undefined ? this.getEditValue() :
                              "", // new value
          curVal            = this.getValue() !== null && this.getValue() !== undefined ?
                              this.getValue().toString() : "",  // old value
          bIsValid          = true,
          hasClassInvalid   = this.$el.hasClass('cs-formfield-invalid'),
          isReadyToSaveView = this.isReadyToSave(),
          isRequired        = this.alpacaField && this.alpacaField.schema.required,
          validate          = this.alpacaField && this.alpacaField.options.validate,
          writeonly         = this.mode === "writeonly",
          emptyField        = curVal === "";

      bIsValid = this.getItemPicked && this.getItemPicked();
      if (isReadyToSaveView && ((editVal !== curVal) || writeonly || hasClassInvalid ||
          (!writeonly && isRequired && validate && emptyField)) || this.mlDataChanged) {
        bIsValid = this.setValue(editVal, true);
      }
      return bIsValid;
    },

    clickCaretIcon: function (e) {

      if (e.which === 1 && !this.$el.find('ul').is(':visible')) {
        setTimeout(function () {
          this.typeahead.options.showHintOnFocus = true;
          this.ui.inputBox.focus();
          this.typeahead.options.showHintOnFocus = false;
        }.bind(this));
      }
    },

    _getChangeEventValue: function () {
      var ret = this.getValue().classification_id;
      return ret;
    },

    getEditValue: function () {
      var fieldValue = this.ui.inputBox.val();
      if (!fieldValue) {
        this.editValue = {
          'classification_name': "",
          'classification_id': null
        };
      }
      if (this.getItemPicked()) {
        this.ui.inputBox.val(this.editValue.classification_name);
      }

      return this.editValue;
    },

    onKeyPress: function (event) {

      if (event.keyCode === 13) { // enter:13
        event.preventDefault();
        event.stopPropagation();
        if (this.getStatesBehavior().isStateRead() && this.allowEditOnEnter()) {
          this.getEditableBehavior().setViewStateWriteAndEnterEditMode();
        } else if (this.getStatesBehavior().isStateWrite() && this.allowSaveOnEnter()) {
          this.getEditableBehavior().trySetValueAndLeaveEditMode(true, true);
        }
      } else if (event.keyCode === 32) {  // space
        if (this.getStatesBehavior().isStateRead() && this.allowEditOnEnter()) {
          event.preventDefault();
          event.stopPropagation();
          this.getEditableBehavior().setViewStateWriteAndEnterEditMode();
        }
      }
      if (event.keyCode === 13 || event.keyCode === 16 ||  // enter, shift, f2
          event.keyCode === 113) {  // for refreshing validation state
        if (this.alpacaField && this.alpacaField.refreshValidationState) {
          this.alpacaField.refreshValidationState(false);
        }
      } else {
        this.setItemPicked(false);
      }
      return true; // we handle it
    },

    onKeyDown: function (event) {

      if (event.keyCode === 27) { // escape
        this.options.isDropDownOpen = this.isDropDownOpen();
        event.preventDefault();
      } else if (event.keyCode === 13 || event.keyCode === 32 || event.keyCode === 9) { // enter, space and tab
        if (this.alpacaField) {
          this.alpacaField.keyDown = true;
        }
      }

    },

    onKeyUp: function (event) {
      if (event.keyCode === 9 && !this.alpacaField.keyDown) { // tab
        event.stopImmediatePropagation();
      }
      if (event.keyCode === 13) { // enter:13
        if (this.alpacaField && this.alpacaField.refreshValidationState &&
            !!this.alpacaField.keyDown) {
          var that = this;
          this.alpacaField.refreshValidationState(false, function () {
            if (that.alpacaField.field.hasClass('alpaca-invalid')) {
              that.alpacaField.fieldView.$el.find('input').select();
            }
          });
        }

      }
      else if (event.keyCode === 8 || event.keyCode === 46) { // backspace and del key respectively
        if (event.target.value === '') {
          this.setItemPicked(true);
          this.$el.removeClass('cs-formfield-invalid');
          if (this.mode === 'writeonly') {
            this.model.set('data', "");
          }
        } else {
          this.setItemPicked(false);
        }
      }
      else if (event.keyCode === 27) { //escape:27
        this.ui.inputBox.attr("aria-expanded", false);
        event.preventDefault();
        event.stopPropagation();
      }
      if (this.alpacaField) {
        this.alpacaField.keyDown = false;
      }
    }
  });
  return DocumentTypePicker;
});
