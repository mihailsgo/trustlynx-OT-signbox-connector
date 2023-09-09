/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/marionette', 'nuc/lib/backbone',
  'nuc/utils/log', 'nuc/utils/base',
  'nuc/lib/handlebars',
  'hbs!smart/dialogs/modal.alert/impl/modal.alert',
  'i18n!smart/dialogs/modal.alert/impl/nls/lang',
  'smart/lib/binf/js/binf',
  'css!smart/dialogs/modal.alert/impl/modal.alert',
  'css!smart/controls/globalmessage/globalmessage_icons',
  'css!smart/controls/dialog/impl/dialog'

], function (module, _, $, Marionette, Backbone, log, base, Handlebars, template, lang /*TabKeyBehavior*/) {

  log = log(module.id);

  var SimpleMessageModel = Backbone.Model.extend({

    defaults: {
      message: ''
    },

    constructor: function SimpleMessageModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var SimpleMessageView = Marionette.ItemView.extend({
    className: 'csui-simple-message-view',

    template: Handlebars.compile('{{message}}'),

    constructor: function SimpleMessageView(options) {
      options.model = new SimpleMessageModel({message: options.message});

      Marionette.ItemView.prototype.constructor.call(this, options);
    }

  });

  var ModalAlertView = Marionette.LayoutView.extend({

    className: function () {
      var className = 'csui-alert cs-dialog binf-modal binf-fade';
      if (this.options.modalClass) {
        className += ' ' + this.options.modalClass;
      }
      return className;
    },

    template: template,

    ui: {
      defaultButton: '.binf-modal-footer > .csui-default',
      buttonYes: '.binf-modal-footer > .binf-btn.csui-yes',
      buttonNo: '.binf-modal-footer > .binf-btn.csui-no',
      buttonCancel: '.binf-modal-footer > .binf-btn.csui-cancel'
    },

    regions: {
      bodyRegion: '.binf-modal-body'
    },

    triggers: {
      'click .csui-yes': 'click:yes',
      'click .csui-no': 'click:no'
    },

    events: {
      'shown.binf.modal': 'onShown',
      'hide.binf.modal': 'onHiding',
      'hidden.binf.modal': 'onHidden',
      'keydown': 'onKeyDown'
    },

    constructor: function ModalAlertView(options) {
      this.previousFocusedElement = document.activeElement;

      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      if (this.options.message || !this.options.bodyView) {
        this.options.bodyView = SimpleMessageView;
        this.options.bodyViewOptions = {message: (this.options.message || '')};
        this.options = _.omit(this.options, 'message');
      }
      options = this.options;
      var buttonData = _.reduce(ModalAlertView.buttonData, function (result, value, key) {
        result['label' + key] = value.label;
        result['tooltip' + key] = value.tooltip;
        result['aria' + key] = value.aria;
        return result;
      }, {});
      options.buttons = _.defaults({}, _.isEmpty(options.buttons) ?
                                       ModalAlertView.buttons.Close :
                                       options.buttons, buttonData);
      _.defaults(options, ModalAlertView.defaultOptions.Information, {
        centerVertically: true,
        showHeader: options.title !== ''
      });

      this._deferred = $.Deferred();
    },

    templateHelpers: function () {
      var templateVals = _(this.options).clone();
      templateVals.dlgTitleId = _.uniqueId('dlgTitle');
      templateVals.dlgMsgId = _.uniqueId('dlgMsg');
      templateVals.closeButtonAria = templateVals.buttons.ariaClose;
      templateVals.closeButtonTooltip = templateVals.buttons.tooltipClose;
      templateVals.bodyViewExists = templateVals.bodyView != false;
      return templateVals;
    },

    show: function () {
      this.render();
      var staticBackdrop = this.options.staticBackdrop === false ? this.options.staticBackdrop : true;
      this.$el.binf_modal({
        backdrop: staticBackdrop ? 'static' : true,
        keyboard: this.options.closeWithEsc !== false
      });
      this.$el.attr('tabindex', 0);
      if (this.options.centerVertically) {
        this.centerVertically();
      }
      this.$el.binf_modal('show');
      this.triggerMethod('show');
      var promise = this._deferred.promise(),
          self = this;
      promise.close = function () {
        self.$el.binf_modal('hide');
        return promise;
      };
      return promise;
    },

    centerVertically: function () {
      var $clone;
      var top;
      $clone = this.$el.clone();
      $clone.css('display', 'block');
      $clone.appendTo($.fn.binf_modal.getDefaultContainer());
      top = Math.round(($clone.height() - $clone.find('.binf-modal-content').height()) / 2);
      top = top > 0 ? top : 0;

      $clone.remove();
      this.$el.find('.binf-modal-content').css("margin-top", top);
    },

    onShown: function () {
      this._deferred.notify({state: 'shown'});
      this.trigger('modalalert:after:shown', false);

    },

    onHiding: function () {
      var self = this;
      this.$el.addClass('binf-fadein');
        setTimeout(function(){
          self._deferred.notify({state: 'hiding'});
        }, 300);
    },

    onRender: function () {
      var bodyView = new this.options.bodyView(this.options.bodyViewOptions);
      this.showChildView('bodyRegion', bodyView);
    },

    onDestroy: function () {
      if (this.previousFocusedElement && document.body.contains(this.previousFocusedElement)) {
        this.previousFocusedElement.focus();
      }
    },
    updateButtons: function (settingsObj) {
      if (settingsObj) {
        var hasYes, hasNo, hasCancel;
        if (this.options.buttons.showYes) {
          hasYes = true;
        }
        if (this.options.buttons.showNo) {
          hasNo = true;
        }
        if (this.options.buttons.showCancel) {
          hasCancel = true;
        }
        var disableSettings = _.pick(settingsObj, 'disableYes', 'disableNo', 'disableCancel');
        this.options.buttons = _.extend({}, this.options.buttons, disableSettings);
        var val;
        if (hasYes) {
          this.ui.buttonYes[0].disabled = !!this.options.buttons.disableYes;
        }
        if (hasNo) {
          this.ui.buttonNo[0].disabled = !!this.options.buttons.disableNo;
        }
        if (hasCancel) {
          this.ui.buttonCancel[0].disabled = !!this.options.buttons.disableCancel;
        }
      }
    },

    onHidden: function (event) {
      this.destroy();
      if (this.options.callback) {
        this.options.callback(this._result);
      }
      if (this._result) {
        this._deferred.resolve(this._result);
      } else {
        this._deferred.reject(this._result);
      }
    },

    onKeyDown: function (event) {
      var keyCode = event.keyCode;
      switch (keyCode) {
      case 13:
        if (event.target === this.el) {
          this.ui.defaultButton.trigger('click');
        } else {
          $(event.target).trigger('click');
        }
        break;
      case 9:
        this.trigger('modalalert:after:shown', event.shiftKey);
        return false;
      }
    },

    onClickYes: function () {
      this._result = true;
    },

    onClickNo: function () {
      this._result = false;
    }

  }, {

    defaultOptions: {
      Success: {
        title: lang.DefaultSuccessTitle,
        titleIcon: 'csui-icon-notification-success-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'success-header'
      },
      Information: {
        title: lang.DefaultInfoTitle,
        titleIcon: 'csui-icon-notification-information-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'info-header'
      },
      Warning: {
        title: lang.DefaultWarningTitle,
        titleIcon: 'csui-icon-notification-warning-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'warning-header'
      },
      Error: {
        title: lang.DefaultErrorTitle,
        titleIcon: 'csui-icon-notification-error-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'error-header'
      },
      Message: {
        title: lang.DefaultMessageTitle,
        titleIcon: '',
        showTitleIcon: false,
        titleCloseIcon: 'csui-icon-dismiss',
        showTitleCloseButton: false,
        headerClass: 'message-header'
      },
      Question: {
        title: lang.DefaultQuestionTitle,
        titleIcon: 'csui-icon-notification-confirmation-white',
        showTitleIcon: true,
        titleCloseIcon: 'csui-icon-dismiss-white',
        showTitleCloseButton: false,
        headerClass: 'question-header'
      }
    },

    buttons: {
      YesNoCancel: {
        showYes: true,
        showNo: true,
        showCancel: true
      },
      YesNo: {
        showYes: true,
        showNo: true,
        showCancel: false
      },
      OkCancel: {
        showYes: true,
        labelYes: lang.OkButtonLabel,
        showNo: false,
        showCancel: true
      },
      Ok: {
        showYes: true,
        labelYes: lang.OkButtonLabel,
        showNo: false,
        showCancel: false
      },
      Cancel: {
        showYes: false,
        showNo: false,
        showCancel: true
      },
      Close: {
        showYes: false,
        showNo: false,
        showCancel: true,
        labelCancel: lang.CloseButtonLabel
      }
    },

    buttonData: {
      Yes: {
        label: lang.YesButtonLabel,
        tooltip: lang.YesButtonLabel,
        aria: ''
      },
      No: {
        label: lang.NoButtonLabel,
        tooltip: lang.NoButtonLabel,
        aria: ''
      },
      Ok: {
        label: lang.OkButtonLabel,
        tooltip: lang.OkButtonLabel,
        aria: ''
      },
      Cancel: {
        label: lang.CancelButtonLabel,
        tooltip: lang.CancelButtonLabel,
        aria: ''
      },
      Close: {
        label: lang.CloseButtonLabel,
        tooltip: lang.CloseButtonLabel,
        aria: lang.CloseButtonAria
      }
    },

    showSuccess: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Success,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showInfo: function (callback, message, title, options) {
      this.showInformation.apply(this, arguments);
    },

    showInformation: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Information,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showWarning: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Warning,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showError: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Error,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    showMessage: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Message,
          ModalAlertView.buttons.Close);
      return this._show(options);
    },

    confirmSuccess: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Success,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmInfo: function (callback, message, title, options) {
      log.warn('The method \'configInfo\' has been deprecated and will be removed.' +
               '  Use \'configInformation\' instead.') && console.warn(log.last);
      log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
      this.confirmInformation.apply(this, arguments);
    },

    confirmInformation: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Information,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmWarning: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Warning,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmError: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Error,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmQuestion: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Question,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    confirmMessage: function (callback, message, title, options) {
      options = this._makeOptions(arguments, ModalAlertView.defaultOptions.Message,
          ModalAlertView.buttons.YesNo);
      return this._show(options);
    },

    _makeOptions: function (parameters, defaultOptions, defaultButtons) {
      var callback = parameters[0],
          message = parameters[1],
          title = parameters[2],
          options = parameters[3];
      if (typeof callback !== 'function') {
        options = title;
        title = message;
        message = callback;
        callback = undefined;
      }
      if (typeof message === 'object') {
        options = _.clone(message);
      } else if (typeof title === 'object') {
        options = _.defaults({message: message}, title);
      } else {
        options = _.defaults({
          message: message,
          title: title
        }, options);
      }
      options.buttons = _.defaults({}, options.buttons, defaultButtons);
      options.callback = callback;
      return _.defaults(options, defaultOptions);
    },

    _show: function (options) {
      var alert = new ModalAlertView(options);
      return alert.show();
    }

  });

  return ModalAlertView;

});
