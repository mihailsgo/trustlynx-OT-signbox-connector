csui.define([
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'i18n!conws/widgets/header/impl/nls/header.lang',
  'hbs!conws/widgets/header/impl/editicon',
  'css!conws/widgets/header/impl/editicon'
], function (require, _, $, Marionette, lang, template) {

  var EditIconView = Marionette.ItemView.extend({

    classname: 'conws-popover',

    template: template,

    triggers: {
      'click .reset > a': 'click:reset',
      'click .upload': 'click:upload',
      'click .cancel': 'click:cancel'
    },

    events: {
      'keydown': 'onKeyDown'
    },

    // initializes the 'EditIcon' view.
    constructor: function EditIconView(options) {
      // initialize options
      options || (options = {});
      options.title = options.title || lang.changeIconDialogTitle;
      options.message = options.message || lang.changeIconDialogMessage;
      options.resetButton = options.resetButton !== undefined ? options.resetButton : true;
      options.uploadButton = options.uploadButton !== undefined ? options.uploadButton : true;

      // prepare tabable elements list
      this.tabableElements = [];
      if ((_.isFunction(options.resetButton) && options.resetButton()) ||
          options.resetButton === true) {
        this.tabableElements.push('.reset > a');
      }
      this.tabableElements.push('.upload', '.cancel');

      // ensure initial focus
      var self = this;
      $('.conws-header-edit').on('shown.binf.popover', function () {
        // focus first element
        self._currentlyFocusedElement = self.tabableElements[0];
        self.$el.find(self._currentlyFocusedElement).focus();
        // detach event
        $('.conws-header-edit').off('shown.binf.popover');
      });

      // apply arguments
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    templateHelpers: function () {
      return {
        title: this.options.title,
        message: this.options.message,
        resetButton: this.options.resetButton,
        reset: lang.changeIconDialogBtnReset,
        resetTitle: lang.changeIconDialogBtnResetTitle,
        uploadButton: this.options.uploadButton,
        upload: lang.changeIconDialogBtnUpload,
        uploadTitle: lang.changeIconDialogBtnUploadTitle,
        cancel: lang.changeIconDialogBtnCancel,
        cancelTitle: lang.changeIconDialogBtnCancelTitle
      };
    },

    _focusNextElement: function (backwards) {
      // state
      var success = true;

      // get actual index
      var idx = _.indexOf(this.tabableElements, this._currentlyFocusedElement);

      // get next index
      if (!backwards) {
        if (++idx === this.tabableElements.length) {
          idx = 0;
        }
      } else {
        if (--idx < 0) {
          idx = this.tabableElements.length - 1;
        }
      }

      // get next element
      var next = this.tabableElements[idx];

      // get the element and check whether it is focusable
      var elem = this.$el.find(next);
      if ((elem.length === 1) && (elem.is(':visible'))) {
        // ... and focus
        this._currentlyFocusedElement = next;
        elem.focus();
      }

      // return state
      return success;
    },

    onKeyDown: function (e) {
      switch (e.keyCode) {
      case 9:
        // focus the next/previous element
        if (this._focusNextElement(e.shiftKey)) {
          // if successful stop propagation
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      case 27:
        e.preventDefault();
        e.stopPropagation();
        // execute cancel.
        $('.cancel').trigger('click');
        break;
      }
    },

    onClick: function (action) {
      if (typeof this.options.callback === 'function') {
        this.options.callback(action);
      }
    },

    onClickReset: function (e) {
      this.onClick('reset');
    },

    onClickUpload: function (e) {
      this.onClick('upload');
    },

    onClickCancel: function (e) {
      this.onClick('cancel');
    }
  });

  return EditIconView;
});
