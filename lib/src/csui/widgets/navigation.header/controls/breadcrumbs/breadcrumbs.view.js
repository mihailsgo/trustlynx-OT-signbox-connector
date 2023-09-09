/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'i18n!csui/widgets/navigation.header/controls/breadcrumbs/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/factories/application.scope.factory',
  'hbs!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs',
  'css!csui/widgets/navigation.header/controls/breadcrumbs/impl/breadcrumbs'
], function (_, $, Marionette, localizedStrings, TabableRegionBehavior,
    AncestorCollectionFactory, ApplicationScopeModelFactory,
    template) {
  'use strict';

  var BreadcrumbsView = Marionette.ItemView.extend({
    tagName: 'button',

    attributes: {
      'type': 'button'
    },

    className: 'breadcrumbs-handle binf-btn',

    ui: {
      breadcrumbsTextContainer: '.csui-breadcrumb-btn-innertext',
      breadcrumbsCaretContainer: '.csui-breadcrumb-caret-type'
    },

    serializeData: function () {
      var flag = !!this.applicationScope.get('breadcrumbsVisible'),
          data = {
            breadcrumbsText: localizedStrings.ShowBreadcrumbs,
            breadcrumbsCaretName: 'icon-expandArrowDownWhite'
          };

      if (flag) {
        data = {
          breadcrumbsText: localizedStrings.HideBreadcrumbs,
          breadcrumbsCaretName: 'icon-expandArrowUpWhite',
        };
      }
      return data;
    },

    template: template,

    events: {
      'keydown': 'onKeyInView',
      'click': '_toggleBreadCrumbs'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onRender: function () {
      if (matchMedia) {
        this._mq = window.matchMedia("(max-width: 1124px)");
        this._mq.addListener(_.bind(this._windowsWidthChange, this));
        this._windowsWidthChange(this._mq);
      }
    },

    constructor: function BreadcrumbsView(options) {
      Marionette.ItemView.call(this, options);

      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.stopListening(this.applicationScope, 'change:breadcrumbsVisible')
          .listenTo(this.applicationScope, 'change:breadcrumbsVisible',
              this._breadcrumbVisibilityChanged)
          .listenTo(this.applicationScope, 'change:breadcrumbsVisible',
              this._breadcrumbUpdateText);

      this.stopListening(this.applicationScope, 'change:breadcrumbsAvailable')
          .listenTo(this.applicationScope, 'change:breadcrumbsAvailable',
              this._breadcrumbAvailabilityChanged);

      this.stopListening(this.applicationScope, 'change:hideToggleButton')
          .listenTo(this.applicationScope, 'change:hideToggleButton',
              this._hideToggleButton);

      this._breadcrumbVisibilityChanged();
      this._breadcrumbAvailabilityChanged();
    },

    _breadcrumbVisibilityChanged: function () {
      this._breadcrumbsVisible = this.applicationScope.get('breadcrumbsVisible');
      if (this._breadcrumbsVisible) {
        this.$el.removeClass('csui-breadcrumbs-hidden');
        this.triggerMethod('refresh:tabindexes');
      } else {
        this.$el.addClass('csui-breadcrumbs-hidden');
      }
    },

    _hideToggleButton: function (bcNode) {
      var hideBtn = !!bcNode.get('hideToggleButton');
      var btnElement = this.$el.closest('.tile-breadcrumb');
      if (btnElement.length) {
        btnElement[!!hideBtn ? 'addClass' : 'removeClass']('binf-hidden');
      }
    },

    _breadcrumbAvailabilityChanged: function () {
      this._breadcrumbsAvailable = this.applicationScope.get('breadcrumbsAvailable');
      if (this._breadcrumbsAvailable) {
        this.$el.removeClass('csui-breadcrumbs-not-available');
        this.triggerMethod('refresh:tabindexes');
      } else {
        this.$el.addClass('csui-breadcrumbs-not-available');
      }
    },
    _breadcrumbUpdateText: function () {
      if (!!this.applicationScope.get('breadcrumbsVisible')) {
        this.$el.attr('aria-label', localizedStrings.HideBreadcrumbs);
        this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowDownWhite').addClass(
            'icon-expandArrowUpWhite');
        this.ui.breadcrumbsTextContainer.text(localizedStrings.HideBreadcrumbs);
      } else {
        this.$el.attr('aria-label', localizedStrings.ShowBreadcrumbs);
        this.ui.breadcrumbsCaretContainer.removeClass('icon-expandArrowUpWhite').addClass(
            'icon-expandArrowDownWhite');
        this.ui.breadcrumbsTextContainer.text(localizedStrings.ShowBreadcrumbs);
      }
    },

    _showBreadcrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', true);
    },

    _hideBreadcrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', false);
    },
    _toggleBreadCrumbs: function () {
      this.applicationScope.set('breadcrumbsVisible', !this._breadcrumbsVisible);
    },

    _windowsWidthChange: function (mq) {
      if (mq.matches) {
        this._previousBreadcrumbState = this.applicationScope.get('breadcrumbsVisible');
        this.applicationScope.set('breadcrumbsVisible', true);
      } else {
        this.applicationScope.set('breadcrumbsVisible', this._previousBreadcrumbState);
      }
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 9:
        this.ignoreFocusBlur = false;
        break;
      case 13:
      case 32:
        this.ignoreFocusBlur = false;
        event.preventDefault();
        this.applicationScope.set('breadcrumbsVisible', !this._breadcrumbsVisible);
        break;
      }
    }

  });

  return BreadcrumbsView;
});
