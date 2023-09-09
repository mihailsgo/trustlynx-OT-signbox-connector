/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require',
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/lib/marionette',
  'smart/controls/tab.panel/tab.links.ext.scroll.mixin',
  'smart/behaviors/keyboard.navigation/smart.tabables.behavior',
  'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'smart/controls/tab.panel/tab.panel.view',
  'smart/controls/tab.panel/impl/tab.contents.view',
  'smart/controls/tab.panel/impl/tab.links.view',
  'smart/controls/tab.panel/behaviors/tab.panel.keyboard.behavior',
  'csui-ext!smart/controls/user/tab.extension',
  'hbs!smart/controls/user/impl/user.profile.tabs',
  'i18n!smart/controls/user/nls/lang',
  'css!smart/controls/user/impl/userprofile.css'
], function (require, $, _, Backbone, Marionette,
  TabLinksScrollMixin, TabablesBehavior, TabableRegionBehavior, LayoutViewEventsPropagationMixin,
  TabPanelView, TabContentCollectionView,
  TabLinkCollectionView, TabPanelKeyboardBehavior,
  extraTabs, simpleUserWidgetTabsTemplate, Lang) {

  _.extend(TabPanelView.prototype, TabLinksScrollMixin);
  var UserProfileTabContentCollectionView, UserProfileTabPanelView, UserProfileTabLinkCollectionView;

  UserProfileTabContentCollectionView = TabContentCollectionView.extend({
    className: 'esoc-simple-user-widget-tab-view',
    constructor: function UserProfileTabContentCollectionView(options) {
      options || (options = {});
      _.defaults(options, {
        toolbar: true,
        searchTabContentForTabableElements: true
      });
      TabContentCollectionView.prototype.constructor.apply(this, arguments);
    }
  });
  UserProfileTabPanelView = TabPanelView.extend({
    className: 'esoc-simple-user-widget-tab-view',
    constructor: function UserProfileTabPanelView(options) {
      options || (options = {});
      _.defaults(options, {
        toolbar: true,
        searchTabContentForTabableElements: true
      });
      TabPanelView.prototype.constructor.apply(this, arguments);

    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      TabPanelKeyboardBehavior: {
        behaviorClass: TabPanelKeyboardBehavior
      }
    },
    currentlyFocusedElement: function (shiftTab) {
      var element = this.options.focusedElement;
      if (shiftTab === undefined || shiftTab.shiftKey === false) {
        return $(this.$el.find("a[title]").filter(":visible").filter(":not(a:empty)")[0]);
      } else if (element && $(element).length) {
        return element;
      }
    },
    onLastTabElement: function (shiftTab) {
      var tabableElements = this.$el.find(
        "[tabindex=" + this.options.tabCount + "]").filter(
          ":visible").filter(":not(a:empty)");
      var focusElement = shiftTab ? this.$el.find("a[title]").filter(":visible").filter(
        ":not(a:empty)")[0] : tabableElements.last();
      if (!shiftTab && tabableElements.length === 1 &&
        this.options.tabIndex + 1 === this.options.tabCount) {
        this.options.tabIndex = 0;
        return true;
      }
      return $(focusElement).hasClass(
        TabableRegionBehavior.accessibilityActiveElementClass);
    }
  });
  UserProfileTabLinkCollectionView = TabLinkCollectionView.extend({
    className: 'esoc-simple-user-widget-tab-view',
    constructor: function UserProfileTabLinkCollectionView(options) {
      options || (options = {});
      _.defaults(options, {
        toolbar: true,
        searchTabContentForTabableElements: true
      });
      TabLinkCollectionView.prototype.constructor.apply(this, arguments);
    }
  });

  var SimpleUserWidgetViewTabs = Marionette.ItemView.extend({
    className: 'esoc-simple-user-widget-tab-view',
    template: simpleUserWidgetTabsTemplate,
    templateHelpers: function () {
      return {
        uniqueId: this.options.uniqueId,
        extraTabs: this.getExtraTabs(extraTabs),
        messages: {
          profile: Lang.profile,
          settings: Lang.settings
        }
      };
    },
    events: {
      'click .esoc-user-profile-tab': 'showTab',
      "keydown": "onKeyPress",
    },
    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      TabPanelKeyboardBehavior: {
        behaviorClass: TabPanelKeyboardBehavior
      }
    },
    onKeyPress: function (event) {
      if ($(event.target).hasClass("cs-tablink") && (!(event.keyCode === 9 || event.shiftKey))) {
        this.onKeyInView(event);
        event.preventDefault();
        event.stopPropagation();
      }
    },
    constructor: function SimpleUserWidgetViewTabs(options) {
      options = options || {};
      _.defaults(options, {
        toolbar: true,
        tabClickedOnce: false,
        initialActivationWeight: 1
      });
      $(window).on('resize', { view: this }, this._onWindowResize);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.uniqueId = _.uniqueId();
      this.userProfileTabViewMapping = {};
    },
    onRender: function (e) {
      var that = this;
      this.propagateEventsToRegions();
      this.userProfileTabPanelViewClass = new UserProfileTabPanelView(_.extend(that));
      this.userProfileTabPanelViewClass.tabLinks = new UserProfileTabLinkCollectionView(_.extend(
        that));
      this.userProfileTabPanelViewClass.tabContent = new UserProfileTabContentCollectionView(_.extend(
        that));
      this.userProfileTabPanelViewClass.options = that.options;
      $.extend(that, this.userProfileTabPanelViewClass);
      this._initializeOthers();
    },

    onShow: function () {
    },

    onAfterShow: function () {

    },

    _onWindowResize: function (event) {
      if (event && event.data && event.data.view) {
        event.data.view._enableToolbarState();
      }
    },

    _initializeOthers: function () {
      var options = {
        gotoPreviousTooltip: Lang.previous,
        gotoNextTooltip: Lang.next
      };
      this.userProfileTabPanelViewClass._initializeToolbars(options);
      this.userProfileTabPanelViewClass._listenToTabEvent();
      setTimeout(_.bind(this.userProfileTabPanelViewClass._enableToolbarState, this.userProfileTabPanelViewClass), 300);
    },
    showTab: function (e) {
      this.options.userwidgetmodel = this.options.model;
      var item = this.userProfileTabViewMapping[e.currentTarget.id];
      if (item) {
        var regionId = "esoc-simple-user-widget-form-body-" + this.options.uniqueId,
          contentRegion = new Marionette.Region({
            el: this.$el.find("#" + regionId)
          }),
          viewInstance = new this.userProfileTabViewMapping[e.currentTarget.id](this.options);
        contentRegion.show(viewInstance);
      }
      var $selected = this.$el.find("#" + e.currentTarget.id);
      $selected.find('a').attr('aria-selected', true);
      $selected.siblings().find('a').attr('aria-selected', false);
    },

    sortExtratabs: function (extraTabs, sortOrder) {
      sortOrder.forEach(function (ele, i) {
        var temp = _.findIndex(extraTabs, function (item) {
          return item.tabName === ele;
        });
        var value = extraTabs.splice(temp, 1);
        value.length && extraTabs.splice(i, 0, value[0]);
      });
    },

    getExtraTabs: function (extraTabs) {
      var that = this;
      extraTabs = _.flatten(extraTabs, true);
      that.extraTabsShownCount = 0;
      _.each(extraTabs, function (tab) {
        if (!!tab.tabCount) {
          tab.tabCount.count = tab.tabCount.getItemCount(that.model, that.options);
        }
        tab.show = true;
        if (!!tab.showTab) {
          tab.show = tab.showTab(that.model, that.options);
        }
        if (tab.show) {
          var str = "esoc-user-profile-" + tab.tabName + "-tab";
          that.userProfileTabViewMapping[str] = tab.tabContentView;
          that.extraTabsShownCount += 1;
        }
      });
      if (this.options.sequence) {
        this.sortExtratabs(extraTabs, this.options.sequence);
      }
      return extraTabs;
    }
  });

  _.extend(SimpleUserWidgetViewTabs.prototype, LayoutViewEventsPropagationMixin);

  return SimpleUserWidgetViewTabs;
});
