/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  "csui/lib/jquery",
  'csui/lib/marionette3',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/item.name/item.name.behavior',
  'csui/utils/accessibility',
  'hbs!csui/controls/compound.document/dialog.view/impl/create.release.revision',
  'css!csui/controls/compound.document/dialog.view/impl/compound.document.dialog'
],
  function (_, $, Marionette, TabableRegion, ItemNameBehavior, Accessibility, template) {

    var CreateRevisionReleaseView = Marionette.View.extend({
      template: template,

      className: function () {
        return this.options.className;
      },

      ui: {
        'nameInput': 'input.csui-archive-name',
        'titleError': '.title-error',
        'saveButtonInEditMode': '.cs-add-button'
      },

      events: {
        'input @ui.nameInput': 'toggleSubmitButton',
        'focusin .csui-archive-name': 'onFocusInArchiveName',
        'keypress .csui-archive-name': 'onKeyInView'
      },

      behaviors: function () {
        return {
          ItemName: {
            behaviorClass: ItemNameBehavior
          },
          TabableRegion: {
            behaviorClass: TabableRegion
          }
        };
      },

      isTabable: function () {
        return this.$('*[tabindex]').length > 0;
      },

      templateContext: function () {
        return {
          currentVersionLabel: this.options.currentVersionLabel,
          currentVersionNumber: this.options.currentVersionNumber,
          newVersionLabel: this.options.newVersionLabel,
          newVersionNumber: this.options.newVersionNumber,
          versionNameLabel: this.options.versionNameLabel,
          versionNameNumber: this.options.versionNameNumber,
          alertMsgId: _.uniqueId('msg'),
          nameErrorId: _.uniqueId('err'),
          inputId: _.uniqueId('input'),
          versionId: this.versionId
        };
      },
      constructor: function CreateReleaseView(options) {
        options || (options = {});
        this.options = options;
        this.currentValue = this.options.currentVersionNumber;
        this.versionId = _.uniqueId('msg');
        Marionette.View.prototype.constructor.apply(this, arguments);
      },

      onFocusInArchiveName: function (event) {
        if (Accessibility.isAccessibleMode()) { return; }
        $(event.target)[0].select();
      },

      onRender: function () {
        var dialog = this._parent._parent._parent.$el.find('.binf-modal-dialog');
        dialog.attr('aria-describedby', this.versionId);
        dialog.attr('aria-label', this.options.arialabel);
      },

      currentlyFocusedElement: function (event) {
        var tabElements = this.$('*[tabindex]');
        if (tabElements.length) {
          tabElements.prop('tabindex', 0);
        }
        if (!!event && event.shiftKey) {
          return $(tabElements[tabElements.length - 1]);
        } else {
          return $(tabElements[0]);
        }
      },

      onLastTabElement: function (shiftTab, event) {
        return (shiftTab && event.target === this.$('*[tabindex]')[0]);
      },

      onKeyInView: function (e) {
        if (e.type === 'keypress' && e.keyCode === 13) {
          e.preventDefault();
          var submitBtn = this._parent._parent._parent.$el.find(".cs-add-button");
          if (submitBtn.length && !submitBtn.is(':disabled')) {
            submitBtn.trigger('click');
          }
        }
      },

      toggleSubmitButton: function () {
        if (this.ui.nameInput.val() === "") {
          this.options.originatingView._dialog.updateButton('submit', { disabled: true });
        } else {
          this.options.originatingView._dialog.updateButton('submit', { disabled: false });
        }
      },

      _validate: function () {
        var currentValue = this.currentValue;
        var inputValue = this.getInputBoxValue();
        inputValue = inputValue.trim();
        if (currentValue !== inputValue) {
          return this.validate(inputValue);
        }
      },

      getInputBoxValue: function () {
        return this.ItemNameBehavior.getInputBoxValue();
      },

      validate: function (iName) {
        return this.ItemNameBehavior.validate(iName);
      }
    });

    return CreateRevisionReleaseView;
  }
);