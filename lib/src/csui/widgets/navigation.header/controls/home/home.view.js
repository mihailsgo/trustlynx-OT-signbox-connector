/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/url', 'csui/utils/base',
  'i18n!csui/widgets/navigation.header/controls/home/impl/nls/localized.strings',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/contexts/factories/application.scope.factory', 'csui/utils/node.links/node.links',
  'hbs!csui/widgets/navigation.header/controls/home/impl/home'
], function (_, $, Marionette, Url, base, localizedStrings, TabableRegionBehavior,
    ApplicationScopeModelFactory, NodeLinks, template) {
  'use strict';

  var HomeView = Marionette.ItemView.extend({
    tagName: 'a',

    className: 'csui-home binf-hidden',

    attributes: {
      href: '',
      title: localizedStrings.HomeIconTitle,
      'aria-label': localizedStrings.HomeIconAria
    },

    events: {
      'click': 'onClickHomeIcon',
      'keydown': 'onKeydownHomeIcon'
    },

    template: template,

    templateHelpers: function () {
      return {
        title: localizedStrings.HomeIconTitle
      };
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function () {
      return this.$el;
    },

    constructor: function HomeView(options) {
      Marionette.ItemView.call(this, options);
      this.listenTo(options.context, 'sync error', this._toggleVisibility);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
    },

    onRender: function () {
      var connector = this.options && this.options.context && this.options.context._user && this.options.context._user.connector,
          serverUrl = new Url(connector && connector.connection.url || location.href),
          link      = NodeLinks.getHomeUrl(serverUrl);
      this.$el.attr('href', link);
    },

    onClickHomeIcon: function (e) {
      if (base.isControlClick(e)) {
      } else {
      e.preventDefault();
      this.applicationScope.set('id', '');
      }
    },

    onKeydownHomeIcon: function (e) {
      if (e.keyCode === 32) {
        this.onClickHomeIcon(e);
      }
    },

    _toggleVisibility: function () {
      if (this._isRendered) {
        if (!this.applicationScope.id) {
          this.$el.addClass('binf-hidden');
        } else {
          this.$el.removeClass('binf-hidden');
        }
      }
    }
  });

  return HomeView;
});
