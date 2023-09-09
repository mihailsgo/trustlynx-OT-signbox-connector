/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require',
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/utils/log',
  "csui/utils/base",
  'hbs!csui/controls/item.title/impl/name/name',
  'i18n!csui/controls/item.title/impl/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/behaviors/item.name/item.name.behavior',
  'csui/utils/contexts/factories/ancestors',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'css!csui/controls/item.title/impl/name/name'
], function (require, $, _, Backbone, Marionette, log, base, template, lang,
    CommandHelper, ItemNameBehavior, AncestorCollectionFactory,
    ViewEventsPropagationMixin) {

  var ItemTitleNameView = Marionette.ItemView.extend({

    className: 'csui-item-name',
    template: template,

    templateHelpers: function () {
      return {
        name: this.model.get("name"),
        edit_name_tooltip: lang.editNameTooltip,
        cancel_edit_name_tooltip: lang.cancelEditNameTooltip,
        save_edit_name_tooltip: lang.saveEditNameTooltip,
        placeholderName: lang.placeHolderName,
        mlDataEnabled: this.metadataLanguages.enabled,
        itemTitleAria: _.str.sformat(lang.itemTitleAria, this.model.get('name'))
      };
    },

    ui: {
      name: '.csui-item-name-readonly', // for compatibility with item.name.behavior
      nameReadonly: '.csui-item-name-readonly',
      nameEdit: '.csui-item-name-edit',
      nameEditDiv: '.csui-item-name-edit',  // for compatibility with item.name.behavior
      nameInput: '.csui-item-name-edit>input',
      inputName: '.csui-item-name-edit>input',  // for compatibility with item.name.behavior
      nameEditCancelIcon: '.csui-item-name-edit>.csui-edit-cancel',
      titleError: '.csui-item-name-error',
      saveButtonInEditMode: '.csui-edit-save',
      globeIcon: ".csui-multilingual-icon" // for multiligual
    },

    modelEvents: {
      'change': 'render'
    },

    events: {
      'keydown': 'onKeyInView',
      'input @ui.inputName': 'onChangeName',
      "click @ui.globeIcon": "onClickGlobeIcon", 
      'keydown @ui.globeIcon': 'onKeyDownGlobeIcon'
    },

    behaviors: {
      ItemName: {
        behaviorClass: ItemNameBehavior,
        autoSave:false
      }
    },

    constructor: function ItemTitleNameView(options) {
      var self = this;
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.metadataLanguages = base.getMetadataLanguageInfo();
      self.saveMldata = '';
      this.listenTo(this, "ml:value:updated", function (obj) {
        self.model.set("name_multilingual", obj.value_multilingual, {
          silent: true,
        });
        self.targetElement.val(obj.value);
        self.saveMldata = obj;
        self.enableAddButton = true;
        self.ui.saveButtonInEditMode.prop('disabled', !self.enableAddButton);
        self.refreshTabableElements();
      });
      this.listenTo(this.model.actions, 'reset update', function () {
        this._checkAndEnableOrDisableEditing();
      });
    },

    onClickGlobeIcon: function () {
      this._showLanguagePopover();
    },

    onKeyDownGlobeIcon: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.multiLingualForm && this.keyDownOnGlobeIcon(event);
       }
    },

    onChangeName: function (event) {
      if (this.ui.saveButtonInEditMode.length) {
        var currentInputElementVal = this.ui.inputName.val().trim();
        this.enableAddButton        = false;
        this.enableAddButton = this.isSaveEnabled(event.target.value);
        _.isFunction(this.updateMLdata) && this.updateMLdata(event);
        this.ui.saveButtonInEditMode.prop('disabled', !this.enableAddButton);
      }
      this.refreshTabableElements();
    },

    isSaveEnabled: function (newName) {
      newName = newName.trim();
      if (!newName.length || (newName === this.model.get('name') && !this.saveMldata)) {
        return false;
      } else {
        return true;
      }
    },

    refreshTabableElements: function () {
      this.tabableElements = this.$el.find('input:not([disabled]),  button:not([disabled])').filter(
          ':visible').toArray();
    },

    _moveTab: function (event) {
      this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
      if (event.shiftKey) {
        if (this.currentlyFocusedElementIndex > 0) {
          this.currentlyFocusedElementIndex -= 1;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
        } else {
          this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
        }
      } else {
        if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
          this.currentlyFocusedElementIndex += 1;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
        } else {
          this.currentlyFocusedElementIndex = 0;
          $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
        }
      }
      event.stopPropagation();
      event.preventDefault();
    },

    onRender: function () {
	    var self = this;
      this.editing = false;
      this.ui.nameEdit.addClass('binf-hidden');
      this._checkAndEnableOrDisableEditing();
      if (this.metadataLanguages.enabled ) {
        this.ui.nameInput.addClass('csui-multilingual-input');
        var inputElement = this.ui.nameInput, mlGlobeIcon = self.ui.globeIcon;
        require(["csui/controls/multilingual.text.picker/multilingual.popover.mixin"], function (
            MultiLingualPopoverMixin
        ) {
          MultiLingualPopoverMixin.mixin(ItemTitleNameView.prototype);
          var mlOptions = {
            parentView: self,
            targetElement: inputElement,
            mlGlobeIcon: mlGlobeIcon,
            validationRequired: true,
            multilingualData: self.model.get("name_multilingual")
          };
          self._loadMultiLingualPopover(mlOptions); //loading
        });
      }
    },

    _checkAndEnableOrDisableEditing: function () {
      var nameEle = $(this.ui.name);
      if(nameEle.length && this.ItemNameBehavior._isEditingEnabled()) {
        var title = _.str.sformat(lang.itemTitleAria, this.model.get('name'));
        nameEle.attr('aria-label', title);
        nameEle.attr('title', title);
        nameEle.prop('disabled', false);
        nameEle.addClass('csui-acc-focusable');
      } else {
        nameEle.removeAttr('aria-label');
        nameEle.removeAttr('title');
        nameEle.prop('disabled', true);
        nameEle.removeClass('csui-acc-focusable');
      }
    },

    _validateAndSave: function () {
      var currentValue = this.model.get('name');
      var inputValue = this.getInputBoxValue();
      inputValue = inputValue.trim();
      if (currentValue !== inputValue || this.model.changed.name_multilingual) {
        var success = this.validate(inputValue);
        if (success === true) {
          var self = this;
          this.setInputBoxValue(inputValue);
          this.setValue(inputValue);

          self._blockActions();
          var attributes = {name: inputValue};
          if (this.model.changed.name_multilingual && self.saveMldata) {
            _.extend(attributes, {
              name_multilingual: this.model.changed.name_multilingual,
            });
          }
          var context = this.options.context;
          var node = self.options.model;
          var silent = !!attributes.name;
          node.save(attributes, {
            wait: true,
            patch: true,
            silent: silent
          })
              .then(function () {
                if (silent) {
                  node.set('name', currentValue, {silent: true});
                }
                node.fetch()
                    .done(function (resp) {
                      self._unblockActions();
                      self.options.originatingView.unblockActions();
                    })
                    .fail(function (error) {
                      self._unblockActions();
                      var errorMsg = self._getErrorMessageFromResponse(error);
                      log.error('Saving failed. ', errorMsg) && console.error(errorMsg);
                    });
                self._toggleEditMode(false);
              })
              .fail(function (err) {
                self._unblockActions();
                self.saveMldata && self.model.set({name_multilingual: self.prevMultilingualVal});
                var errorMessage = self._getErrorMessageFromResponse(err);
                self.setValue(currentValue);
                self._toggleEditMode(true);
                self.showInlineError(errorMessage);
              });
        }
      } else {
        this.clearInlineError();
        this._toggleEditMode(false);
      }
    },

    _blockActions: function () {
      var origView = this.options.originatingView;
      origView && origView.blockActions && origView.blockActions();
    },

    _unblockActions: function () {
      var origView = this.options.originatingView;
      origView && origView.unblockActions && origView.unblockActions();
    },
    onKeyInView: function (event) {
      return this.ItemNameBehavior.onKeyInView(event);
    },

    _toggleEditMode: function (edit) {
      this.ItemNameBehavior._toggleEditMode(edit);
    },

    onClickName: function (event) {
      return this.ItemNameBehavior.onClickName(event);
    },

    getValue: function () {
      return this.ItemNameBehavior.getValue();
    },

    setValue: function (value) {
      return this.ItemNameBehavior.setValue(value);
    },

    getInputBoxValue: function () {
      return this.ItemNameBehavior.getInputBoxValue();
    },

    setInputBoxValue: function (value) {
      return this.ItemNameBehavior.setInputBoxValue(value);
    },

    validate: function (iName) {
      return this.ItemNameBehavior.validate(iName);
    },

    setEditModeFocus: function () {
      return this.ItemNameBehavior.setEditModeFocus();
    },

    showInlineError: function (error) {
      return this.ItemNameBehavior.showInlineError(error);
    },

    clearInlineError: function () {
      return this.ItemNameBehavior.clearInlineError();
    },

    _getErrorMessageFromResponse: function (err) {
      return this.ItemNameBehavior._getErrorMessageFromResponse(err);
    }

  });

  _.extend(ItemTitleNameView.prototype, ViewEventsPropagationMixin);

  return ItemTitleNameView;

});
