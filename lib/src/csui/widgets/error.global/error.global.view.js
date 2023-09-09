/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'csui/utils/contexts/factories/global.error', 'csui/utils/contexts/factories/application.scope.factory',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/widgets/error.global/impl/error.global',
  'i18n!csui/widgets/error.global/impl/nls/lang',
  'csui/utils/log',
  'module',
  'css!csui/widgets/error.global/impl/error.global'
], function (_, $, Marionette, base, GlobalErrorModelFactory,
    ApplicationScopeModelFactory, TabableRegionBehavior, template, lang, log, module) {
  'use strict';
  log = log(module.id);

  var GlobalErrorView = Marionette.ItemView.extend({
    className: 'csui-global-error',

    template: template,
    templateHelpers: function () {
      return {
        errorMessage: lang.errorMessage,
        backText: lang.backText,
        backTooltip: lang.backTooltip,
        homeText: lang.homeText,
        homeTooltip: lang.homeTooltip,
        closeText: lang.closeText,
        closeTooltip: lang.closeTooltip,
        msgId: _.uniqueId('msg'),
        regionAria: lang.globalErrorRegionAria,
        noHistory: this.noHistory
      };
    },

    TabableRegion: {
      behaviorClass: TabableRegionBehavior,
      initialActivationWeight: 100
    },

    ui: {
      errorMessage: '.error-message > span',
      closebutton: '.close-button'
    },

    events: {
      'keydown': 'onKeyInView',
      'click .go-home-button': 'onClickHome',
      'click .go-home-text': 'onClickHome',
      'click .go-back-button': 'onClickBack',
      'click .go-back-text': 'onClickBack',
      'click @ui.closebutton': 'onClickClose'
    },

    constructor: function GlobalErrorView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      if (!this.model) {
        this.model = options.context.getModel(GlobalErrorModelFactory, options);
      }

      this.noHistory = options.context &&
                       options.context.viewStateModel &&
                       options.context.viewStateModel.getHistory().length < 1;
      if (base.isIE11()) {
        var self = this;
        var resizeHandler = function () {
          self.render();
        };
        $(window).on('resize', resizeHandler);
        this.once('before:destroy', function () {
          $(window).off('resize', resizeHandler);
        });
      }
    },

    currentlyFocusedElement: function (event) {
      return this.ui.errorMessage;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        $(event.target).trigger('click');
      }
    },

    onClickHome: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var context = this.options.context,
          viewStateModel = context && context.viewStateModel,
          start_id = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.START_ID);
      if (start_id) {
        var nextNode = context.getModel('nextNode');
        nextNode.set('id', start_id);
      } else {
        var applicationScope = context.getModel(ApplicationScopeModelFactory);
        applicationScope.set('id', '');
      }
    },

    onClickBack: function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.history.back();
    },

    onClickClose: function(event) {
      event.preventDefault();
      event.stopPropagation();
      this.destroy();
    }

  });

  return GlobalErrorView;
});
