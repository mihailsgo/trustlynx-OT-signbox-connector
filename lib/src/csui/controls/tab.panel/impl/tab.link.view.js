/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/log',
  'hbs!csui/controls/tab.panel/impl/tab.link', 'csui/lib/binf/js/binf',
  'csui/utils/handlebars/l10n' // support {{csui-l10n ...}}
], function (module, _, Marionette, log, tabLinkTemplate) {
  'use strict';

  log = log(module.id);

  var TabLinkView = Marionette.ItemView.extend({
    tagName: 'li',

    className: function () {
      return this._isOptionActiveTab() ? 'binf-active' : '';
    },

    attributes: function () {
      return {
        'data-csui-tab': this.model.get('name'),
        role: 'presentation'
      };
    },

    template: tabLinkTemplate,

    templateHelpers: function() {
      var uniqueTabId = this.model.get('uniqueTabId');
      return {
        linkId: 'tablink-' + uniqueTabId,
        selected: this._isOptionActiveTab()
      };
    },

    events: {
      'show.binf.tab > a': 'onShowingTab',
      'shown.binf.tab > a': 'onShownTab'
    },

    ui: {
      link: '>a'
    },

    constructor: function TabLinkView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.clickActivatingSemaphore = this.options.clickActivatingSemaphore;
    },

    _isOptionActiveTab: function () {
      var active = false;
      var activeTabIndex = 0;
      if (this.options.activeTab && this.options.activeTab.get('tabIndex') !== undefined) {
        activeTabIndex = this.options.activeTab.get('tabIndex');
      }
      activeTabIndex = Math.max(0, activeTabIndex);
      this.model === this.model.collection.at(activeTabIndex) && (active = true);
      return active;
    },

    activate: function (setFocus) {
      this.ui.link.binf_tab('show');
      setFocus && this.ui.link.trigger('focus');
    },

    isActive: function () {
      return this.$el.hasClass('binf-active');
    },

    onShowingTab: function (event) {
      if (this.clickActivatingSemaphore && !this.clickActivatingSemaphore.enter()) {
        log.debug('Ignoring start of a tab link activation (tab {0}, {1}).',
          this._index, this.cid) && console.log(log.last);
        return;
      }

      log.debug('Starting a tab link activation (tab {0}, {1}).',
        this._index, this.cid) && console.log(log.last);
      this.triggerMethod('before:activate:tab', this);
    },

    onShownTab: function (event) {
      var tabIndex = this.model.collection.indexOf(this.model);
      if (this.clickActivatingSemaphore && !this.clickActivatingSemaphore.exit()) {
        log.debug('Ignoring finish of a tab link activation (tab {0}: {1}).',
          tabIndex, this.cid) && console.log(log.last);
        return;
      }

      var activeTab = this.options.activeTab;
      if (log.can('DEBUG')) {
        log.debug('Finishing a tab link activation (tab {0}: {1}, previous {2}).',
          tabIndex, this.cid, activeTab ? activeTab.get('tabIndex') : 'unknown')
          && console.log(log.last);
      }
      activeTab && activeTab.set('tabIndex', tabIndex);
      this.triggerMethod('activate:tab', this);
    }
  });

  return TabLinkView;
});
