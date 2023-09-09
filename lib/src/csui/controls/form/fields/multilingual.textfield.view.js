/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require',
  'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/form/impl/fields/csformfield.view',
  'csui/utils/url',
  'csui/utils/base',
  'csui/utils/contexts/factories/connector',
  'i18n!csui/controls/form/impl/nls/lang',
  'hbs!csui/controls/form/impl/fields/multilingual.textfield/multilingual.textfield',
  'css!csui/controls/form/impl/fields/multilingual.textfield/multilingual.textfield',
  'csui/lib/binf/js/binf',
  'csui/lib/handlebars.helpers.xif'
], function (require, _, $, Backbone, Marionette, FormFieldView, Url, base, ConnectorFactory, lang,
    template) {
  "use strict";
  var enableEditPageML = true;
  var i18n = csui.require.s.contexts._.config.config.i18n,
      defaultLocal = (i18n && i18n.locale) || 'en-US';

  var MultilingualTextFieldView = FormFieldView.extend({

    constructor: function MultilingualTextFieldView(options) {
      FormFieldView.apply(this, arguments);
      var data = this.model.get('data');
      this.editVal = data || {};
      this.oldVal = data;
      this._isReadyToSave = true;
      this.popoverRequired = !!this.formView.popover;
      this.loadAddionalInfo(this.popoverRequired);
    },

    getDisplayValue: function () {
      return this.getEditValue();
    },

    className: 'cs-formfield cs-multilingualfield',

    template: template,
    ui: function () {
      return _.extend({}, FormFieldView.prototype.ui, {
        globeIcon: '.csui-multilingual-icon'
      });
    },
    events: function () {
      var eventList = _.extend({}, FormFieldView.prototype.events, {
            'keypress @ui.readField': 'onKeyPressRead'
          }), 
          isPopoverRequired = !!this.formView.popover;
      if (isPopoverRequired) {
        _.extend(eventList, {
          'click .csui-multilingual-icon': 'onClickMLGlobeIcon',
          'keydown .csui-multilingual-icon': 'onKeydownGlobeIcon',
          'input @ui.writeField': 'onValueChange',
          'focus .csui-multilingual-icon': 'onFocus',
          'focusout .csui-multilingual-icon': 'onFocusOut'
        });

      } else {
        if (enableEditPageML) {
          _.extend(eventList, {
            'click @ui.writeField': 'onWiteFieldClick',
            'click .csui-multilingual-icon': 'onWiteFieldClick',
            'keydown @ui.writeField': 'onKeyDownWrite',
          });
        }
      }

      return eventList;
    },

    templateHelpers: function () {
      var multiFieldLabel = "",
          data = lang.noValue,
          text,
          readModeAria = "", // better default value?
          readModeMultiFieldAria = "", // better default value?
          isReadOnly = this.mode === "readonly",
          requiredTxt = "",
          isGlobeRequired = (!this.popoverRequired && enableEditPageML) ||
                            (this.popoverRequired && this.metadataLanguages &&
                             this.metadataLanguages.enabled),
          isRequired = this.options.alpacaField &&
                       this.options.alpacaField.isRequired();
      requiredTxt = isRequired ? lang.requiredField : "";

      if (!!this.model.get('data')) {
        data = this.model.get('data');
      }
      if (this.alpacaField && this.alpacaField.options &&
          this.alpacaField.options.isMultiFieldItem) {
        multiFieldLabel = (this.alpacaField.parent && this.alpacaField.parent.options) ?
                          this.alpacaField.parent.options.label : "";
      }
      if (this.model.get('options')) {
        readModeAria = isReadOnly ?
                       _.str.sformat(lang.fieldReadOnlyAria, this.model.get('options').label,
                           data[defaultLocal]) + requiredTxt :
                       _.str.sformat(lang.fieldEditAria, this.model.get('options').label,
                           data[defaultLocal]) +
                       requiredTxt;
      }

      readModeMultiFieldAria = isReadOnly ?
                               _.str.sformat(lang.fieldReadOnlyAria, multiFieldLabel,
                                   data[defaultLocal]) +
                               requiredTxt :
                               _.str.sformat(lang.fieldEditAria, multiFieldLabel,
                                   data[defaultLocal]) +
                               requiredTxt;

      if (this.popoverRequired) {
        if (_.isString(data) || !data) {
          text = data;
        } else {
          text = data[defaultLocal];
          if (!text && this.metadataLanguages) {
            var languages = this.metadataLanguages.languages;
            for (var key in languages) {
              if (data[languages[key].language_code]) {
                text = data[languages[key].language_code];
                break;
              }
            }
          }
        }

      } else {
        text = data[defaultLocal];
      }
      this.displayValue = text;

      return _.extend(FormFieldView.prototype.templateHelpers.apply(this), {
        inputType: 'text',
        idBtnLabel: this.options.labelId,
        idBtnDescription: this.options.descriptionId,
        readModeAria: readModeAria,
        readModeMultiFieldAria: readModeMultiFieldAria,
        multiFieldLabel: multiFieldLabel,
        ariaRequired: isRequired,
        multilangEnValue: text,
        isReadOnly: (!this.popoverRequired && enableEditPageML) ||
                    (this.popoverRequired && isReadOnly),
        isGlobeRequired: isGlobeRequired
      });
    },

    onFocus: function (event) {
      if (this.targetElement.hasClass("mlDisabled") && !this.mlOptions.popoverClosed) {
        this._openMLFlyoutInEditMode();
      }
    },

    onFocusOut: function (event) {
      this.mlOptions.popoverClosed = false;
    },

    getEditValue: function () {
      return this.editVal;
    },

    getOldValue: function () {
      return this.oldVal;
    },

    isReadyToSave: function () {
      return this._isReadyToSave;
    },

    onKeyDownWrite: function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        !this.popoverRequired && this._showMultilingualPicker();
      }
    },

    preSetValue: function (val) {
      if (enableEditPageML && !this.popoverRequired) {
        return val;
      }
      if (enableEditPageML && this.popoverRequired) {
        var value = val[defaultLocal] === '' ? '' : val[defaultLocal] ? val[defaultLocal] : val;
        val = this.getMLData(value);
        return val;
      }
      var fieldVal = this.ui.writeField.val(),
          data = _.clone(this.editVal);
      if (fieldVal !== this.displayValue && !(fieldVal === '' && this.displayValue === undefined)) {
        if (_.isString(data)) {
          data = {};
        }
        data[defaultLocal] = fieldVal;
        this.editVal = data;
      }
      return data;
    },

    onWiteFieldClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      !this.popoverRequired && this._showMultilingualPicker();
    },

    _showMultilingualPicker: function () {
      if (this.popoverRequired) {
        this._showmultilingualPopover();
      } else {
        enableEditPageML && this._showLanguageTextPicker();
      }
    },

    loadAddionalInfo: function (flag) {
      var self = this,
          data = self.model.get('data'),
          alpOptions = this.model.get('options') || {};
      self.metadataLanguages = this.options.metadataLanguages
        || alpOptions.metadataLanguages
        || base.getMetadataLanguageInfo();
      if (!flag || !self.metadataLanguages.enabled) {
        return;
      }

      self.isMultilingualField = true;

      defaultLocal = self.metadataLanguages && self.metadataLanguages.defaultLanguage;
      if (_.isString(data)) {
        data = {};
        data[defaultLocal] = self.model.get('data');
        self.oldVal = data;
      }
      this.stopListening(this, 'ml:value:updated').listenTo(this, "ml:value:updated",
          function (obj) {
            self.editVal = obj.value_multilingual;
            self.targetElement.val(obj.value);
            self.setValue(obj.value_multilingual, true);
            self.cancelReadmode();
          });
      require(['csui/controls/multilingual.text.picker/multilingual.popover.mixin'],
          function (MultiLingualPopoverMixin) {
            MultiLingualPopoverMixin.mixin(MultilingualTextFieldView.prototype);
            self.trigger('mlMixin:isReady');
          });
      self.stopListening(self, 'ml:close:writeMode').listenTo(self, "ml:close:writeMode",
          function () {
            self.cancelReadmode();
          });
    },
    setStateWrite: function () {
      if (!this.popoverRequired || !this.metadataLanguages.enabled) {
        return;
      }
      var self = this,
          data = self.model.get('data'),
          schema = self.model.get('schema') || {},
          mlOptions;
      if (_.isString(data)) {
        data = {};
        data[defaultLocal] = self.model.get('data');
      }
      mlOptions = {
        targetElement: self.ui.writeField,
        mlGlobeIcon: self.ui.globeIcon,
        validationRequired: schema.required,
        multilingualData: data,
        changetoReadmodeOnclose: this.mode !== "writeonly",
        isTextAreaField: false,
        popoverClosed: false
      };
        if(_.isFunction(self._loadMultiLingualPopover)){
          self._loadMultiLingualPopover(mlOptions);
        }else{
          self.listenToOnce(this, 'mlMixin:isReady',
          function(){
            self._loadMultiLingualPopover(mlOptions);
          }
         );
      }
    },
    _showmultilingualPopover: function () {
      this._showLanguagePopover();
    },
    cancelReadmode: function () {
      var cancelBtn = this.$el.find('.csui-icon-edit.edit-cancel');
      cancelBtn.length && cancelBtn.trigger('click');
    },
    onClickMLGlobeIcon: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this._showLanguagePopover();
    },

    getMLData: function (inputVal) {
      var mlObj = this.multiLingualForm && this.multiLingualForm.data,
          multiLang = {},
          def_locale = base.getUserMetadataLanguageInfo();
      _.each(mlObj, function (lang) {
        multiLang[lang.language_code] = lang.value;
      });
      multiLang && (multiLang[def_locale] = inputVal);
      return multiLang;
    },

    onValueChange: function (event) {
      var inputVal = event.target.value;
      this.targetElement && this.targetElement.val(event.target.value);
      this.editVal = this.getMLData(inputVal);
    },
    onKeydownGlobeIcon: function (event) {
      switch (event.keyCode) {
      case 13: // ENTER
      case 32: // SPACE
        event.stopPropagation();
        event.preventDefault();
        this.ui.globeIcon.trigger('click');
        break;
      case 27: // ESCAPE
        this.multiLingualForm && this.multiLingualForm.trigger('ml:hide:popover');
        break;
      case 9: //Tab
        if (this.multiLingualForm && this.multiLingualForm.isPopoverOpen) {
          this.trigger('ml:set:focus', event);
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
    },
    _showLanguageTextPicker: function () {
      if (!this._isReadyToSave) {
        return;
      }
      this._isReadyToSave = false;
      var self = this;
      require(['csui/dialogs/multilingual.text.picker/multilingual.text.picker'],
          function (MultilingualTextPicker) {
            var pickerOptions = {
              connector: self.connector,
              data: self.model.get('data')
            };
            var picker = new MultilingualTextPicker(pickerOptions);
            picker.show()
                .done(_.bind(self._handlePickerSuccess, self))
                .fail(_.bind(self._handlePickerCancel, self))
                .always(function () {
                  self.ui.writeField.trigger('focus');
                  self._isReadyToSave = true;
                });
          });
    },

    _handlePickerSuccess: function (data) {
      this.editVal = data;
      this.setValue(data, true);
      this.render();
    },

    _handlePickerCancel: function (cancelData) {

    }

  });

  return MultilingualTextFieldView;

});
