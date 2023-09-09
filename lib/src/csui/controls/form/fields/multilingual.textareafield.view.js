/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/controls/form/fields/textareafield.view', 'csui/utils/base',
  'hbs!csui/controls/form/impl/fields/multilingual.textareafield/textareafield',
  'css!csui/controls/form/impl/fields/multilingual.textareafield/textareafield',
  'csui/lib/binf/js/binf'
], function (require, _, $, Backbone, Marionette, TextAreaFieldView, base, template) {
  "use strict";

  var MultilingualTextAreaFieldView = TextAreaFieldView.extend({

    constructor: function MultilingualTextAreaFieldView(options) {
      options || (options = {});
      var alpOptions = options.model.get('options') || {};
      this.ui.subInputField = '.csui-multilingual-icon';
      this.metadataLanguages = alpOptions.metadataLanguages
        || base.getMetadataLanguageInfo();
      this.isMultilingualEnabled = this.metadataLanguages.enabled;
      this.isTextAreaField = true;
      this.saveMldata = '';
      this.isF2KeyPressed = false;
      this.keyAttribute = options.model && options.model.has('options') &&
                          options.model.get('options').keyAttribute;
      this.model = options.model;
      this.loadAddionalInformation();
      this.oldVal = this.curVal = options.model.get('data');
      this.editVal = this.curVal;
      this._isReadyToSave = false;
      TextAreaFieldView.apply(this, arguments);
    },

    ui: function () {
      return _.extend({}, TextAreaFieldView.prototype.ui, {
        globeIcon: '.csui-multilingual-icon'
      });
    },

    events: function () {
      var eventsObj = _.extend({}, TextAreaFieldView.prototype.events, {
        'input @ui.writeField': 'onValueChange'
      });
      if (this.isMultilingualEnabled) {
        _.extend(eventsObj, {
          'click @ui.globeIcon': 'onClickMLGlobeIcon',
          'keydown @ui.globeIcon': 'onKeydownGlobeIcon',
          'focus .csui-multilingual-icon': 'onFocus',
          'focusout .csui-multilingual-icon': 'onFocusOut'
        });
      }
      return eventsObj;
    },

    className: 'cs-formfield cs-textareafield cs-ml-textareafield',

    template: template,

    loadAddionalInformation: function () {
      this.updateDataObject();
      if (!this.isMultilingualEnabled) {
        return;
      }
      var self = this;
      require(['csui/controls/multilingual.text.picker/multilingual.popover.mixin'],
          function (MultiLingualPopoverMixin) {
            MultiLingualPopoverMixin.mixin(MultilingualTextAreaFieldView.prototype);
            self.trigger('mlMixin:isReady');
          });
      this.listenTo(this, "ml:value:updated", function (obj) {
        var node = self.formView && self.formView.node && self.formView.node;
        self.prevMultilingualVal = node && node.get(self.keyAttribute);
        self.keyAttribute && node.set(self.keyAttribute, obj.value_multilingual, {
          silent: true
        });
        self.targetElement.val(obj.value);
        if (!!self.keyAttribute) {
          self.editVal = obj.value;
        } else {
          self.editVal = obj.value_multilingual;
        }
        this.isTextareaAutoHeight && this.adjustTextareaHeight();
        self.saveMldata = obj;
        self.mlDataChanged = true;

        if (self.isF2KeyPressed) {
          var event = $.Event('keydown');
          event.keyCode = event.which = 113;
          self.ui.writeField.trigger(event);
        }
      });

      this.listenTo(this, "ml:close:writeMode", function () {
        var button = self.$el.find('.csui-icon-edit.edit-cancel');
        button.length && button.trigger('click');
      });
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
      !this.metadataLanguages.enabled && (this._isReadyToSave = true);
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
    updateDataObject: function () {
      var self = this,
          data = self.model && self.model.get('data'),
          defaultLocal = self.metadataLanguages && self.metadataLanguages.defaultLanguage,
          text;
      if (_.isObject(data)) {
        text = data[defaultLocal];
        if (!text && self.metadataLanguages) {
          var languages = self.metadataLanguages.languages;
          for (var key in languages) {
            if (data[languages[key].language_code]) {
              text = data[languages[key].language_code];
              break;
            }
          }
        }
        self.textareaValue = text;
      }
    },

    setStateWrite: function () {
      if (!this.metadataLanguages.enabled) {
        return;
      }
      this.updateDataObject();
      this.saveMldata = '';
      this.isF2KeyPressed = false;
      var data = this.model.get('data'), mlOptions,
          defaultLocal = this.metadataLanguages.defaultLanguage;
      !!this.keyAttribute && (data = this.formView && this.formView.node
                                     && this.formView.node.get(this.keyAttribute) || {});
      if (_.isString(data)) {
        data = {};
        data[defaultLocal] = this.model.get('data');
      }
      mlOptions = {
        targetElement: this.ui.writeField,
        mlGlobeIcon: this.ui.globeIcon,
        validationRequired: false,
        multilingualData: data,
        isTextAreaField: true,
        changetoReadmodeOnclose: this.mode !== "writeonly",
        popoverClosed: false
      };
      if (this.isMultilingualEnabled) {
        if (_.isFunction(this._loadMultiLingualPopover)) {
          this._loadMultiLingualPopover(mlOptions);
        } else {
          this.listenToOnce(this, 'mlMixin:isReady',
              _.bind(function () {
                this._loadMultiLingualPopover(mlOptions);
              }, this)
          );
        }
      }
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
      if (this.mode === "read") {
        this.editVal = this.ui.writeField.val();
      }
      return this.editVal;
    },

    getOldValue: function () {
      return this.oldVal;
    },

    preSetValue: function (val) {
      var defaultLocal = this.metadataLanguages && this.metadataLanguages.defaultLanguage,
          value = val[defaultLocal] === '' ? '' : val[defaultLocal] ? val[defaultLocal] : val;
      this.textareaValue = value;
      val = this.getMLData(value);
      return val;
    },


    isReadyToSave: function () {
      return this._isReadyToSave;
    }

  });

  return MultilingualTextAreaFieldView;

});
