/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/base',
  'csui/controls/tab.panel/tab.panel.view', 'csui/controls/grid/grid.view',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/contexts/factories/active.tab.factory',
  'csui/controls/tab.panel/tab.links.ext.scroll.mixin',
  'csui/controls/tab.panel/tab.links.ext.view',
  'csui/perspectives/tabbed/behaviors/tab.extensions.behavior',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/fragment/context.fragment',
  'csui/perspectives/tabbed/tab.index/tab.index.preferences',
  'hbs!csui/perspectives/tabbed/impl/tabbed.perspective',
  'css!csui/perspectives/impl/perspective',
  'css!csui/perspectives/tabbed/impl/tabbed.perspective'
], function (module, _, Backbone, $, Marionette, base, TabPanelView, GridView,
    WidgetContainerBehavior, LayoutViewEventsPropagationMixin,
    ActiveTabModelFactory, TabLinksScrollMixin, TabLinkCollectionViewExt,
    TabExtensionsBehavior, NodeViewStateMixin, NextNodeModelFactory,
    ContextFragment, tabIndexPreferences, perspectiveTemplate) {
  'use strict';

  var config = module.config();
  var delayTabContent = /\bdelayTabContent\b(?:=([^&]*)?)?/i.exec(location.search);
  delayTabContent = delayTabContent ? delayTabContent[1] !== 'false' : true;
  if (delayTabContent === undefined) {
    delayTabContent = config.delayTabContent;
  }

  var GridRowWidgetContainerView = GridView.RowView.extend({

    cellView: function (model) {
      var widget = model.get('widget');
      if (widget) {
        var view = widget.view;
        if (!view) {
          throw new Marionette.Error({
            name: 'UnresolvedWidgetError',
            message: 'Widget "' + widget.type + '" not resolved: ' +
                     widget.error
          });
        }
        return view;
      }
    },

    cellViewOptions: function (model) {
      var widget = model.get('widget');
      return {
        context: this.options.context,
        data: widget && widget.options || {},
        model: undefined
      };
    },

    constructor: function GridRowWidgetContainerView() {
      GridView.RowView.prototype.constructor.apply(this, arguments);
    }

  });

  var TabWidgetContainerView = TabPanelView.extend({

    contentView: GridRowWidgetContainerView,

    contentViewOptions: function (model) {
      return {
        context: this.options.context,
        columns: model.get('columns')
      };
    },

    constructor: function TabWidgetContainerView(options) {
      options || (options = {});
      _.defaults(options, {
        delayTabContent: delayTabContent,
        overlappingTabActivation: false,
        toolbar: true,
        TabLinkCollectionViewClass: TabLinkCollectionViewExt,
        tabBarLeftExtensionViewClass: options.tabBarLeftExtensionViewClass,
        tabBarLeftExtensionViewOptions: options.tabBarLeftExtensionViewOptions,
        tabBarRightExtensionViewClass: options.tabBarRightExtensionViewClass,
        tabBarRightExtensionViewOptions: options.tabBarRightExtensionViewOptions
      });

      if (options.tabs) {
        _.each(options.tabs, function (tab, tabIndex) {
          _.each(tab.columns, function (col, columnIndex) {
            col.widget.cellAddress = 'tab' + tabIndex + ':r0:c' + columnIndex;
          });
        });
      }
      this.behaviors = _.extend({
        TabExtensionsBehavior: {
          behaviorClass: TabExtensionsBehavior
        }
      }, this.behaviors);

      $(window).on('resize', {view: this}, this._onWindowResize);
      TabPanelView.prototype.constructor.call(this, options);
    },

    _onWindowResize: function (event) {
      if (event && event.data && event.data.view) {
        event.data.view._enableToolbarState();
      }
    }

  });

  _.extend(TabWidgetContainerView.prototype, TabLinksScrollMixin);

  function AllowTabIndexBeSet() {
    if (this.context && this.context.viewStateModel) {
      var isFirstRoute = this.context.viewStateModel.get('isFirstRoute');
      var routeFromUrl = this.context.viewStateModel.get('routeFromUrl');
      var isFromHistory = this.context.viewStateModel.get('isFromHistory');
      if (isFirstRoute || !routeFromUrl && !isFromHistory) {
        return true;
      }
    }
  }

  var TabbedPerspectiveView = Marionette.LayoutView.extend({

    className: 'cs-tabbed-perspective cs-perspective binf-container-fluid',
    template: perspectiveTemplate,

    behaviors: {
      WidgetContainer: {
        behaviorClass: WidgetContainerBehavior
      }
    },

    regions: {
      headerRegion: '> .cs-header',
      contentRegion: '> .cs-content'
    },

    constructor: function TabbedPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);

      this.context = options.context;
      var viewStateModel = this.context && this.context.viewStateModel;
      viewStateModel.setDefaultViewState('tab', 0);
      viewStateModel.addUrlParameters(['tab']);
      this.activeTab =  this._initActiveTabFromViewState();
      this.associatedRouter = viewStateModel.get("activeRouterInstance");
      viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.ALLOW_WIDGET_URL_PARAMS, false);

      var widget = options && options.header && options.header.widget;
      if (widget) {
        options.header.widget = base.filterUnSupportedWidgets(widget, config);
      }
      if (options.tabs) {
        options.tabs = _.each(options.tabs, function (tab, tabIndex) {
          tab.columns = _.filter(tab.columns, function (col, columnIndex) {
            return base.filterUnSupportedWidgets(col.widget, config) != undefined;
          });
        });
      }

      Marionette.LayoutView.prototype.constructor.call(this, options);

      this.listenTo(this.context.viewStateModel, 'change:state', this.onViewStateChanged);

      this.listenTo(this.context,'before:change:perspective',function(){
        if (AllowTabIndexBeSet.call(this)) {
          this.context.viewStateModel.setViewState('tab',undefined,{silent:true});
        }
      }.bind(this));

      this.listenTo(this.context,'retain:perspective',function(){
        if (this.tabPanel && this.tabPanel.activeTab) {
          var tabPanelTab = this.tabPanel.activeTab.get('tabIndex');
          this.context.viewStateModel.setViewState('tab',tabPanelTab,{silent:true});
        }
      }.bind(this));

      this.nextNode = this.context.getModel(NextNodeModelFactory);

      this.propagateEventsToRegions();
    },

    onRender: function () {
      this.navigationHeader = this.options.header.widget ?
                              this._createWidget(this.options.header.widget) : {};
      this.tabPanel = new TabWidgetContainerView(_.extend({
        activeTab: this.activeTab,
        delayTabContent: this.options.delayTabContent,
        tabBarLeftExtensionViewClass: this.navigationHeader.tabBarLeftExtensionView,
        tabBarLeftExtensionViewOptions: this.navigationHeader.tabBarLeftExtensionViewOptions,
        tabBarRightExtensionViewClass: this.navigationHeader.tabBarRightExtensionView,
        tabBarRightExtensionViewOptions: this.navigationHeader.tabBarRightExtensionViewOptions,
        disableExtensionOnFirstTab: this.navigationHeader.disableExtensionOnFirstTab,
        disableExtensionOnOtherTabs: this.navigationHeader.disableExtensionOnOtherTabs
      }, this.options));
      this._updateToggleHeaderState();
      this.listenTo(this.tabPanel, 'before:populate:tab', this._onBeforePopulateTab)
          .listenTo(this.tabPanel, 'populate:tab', this._onPopulateTab)
          .listenTo(this.tabPanel, 'activate:tab', this._onActivateTab);
      if (!_.isEmpty(this.navigationHeader)) {
        this.$el.removeClass('csui-no-header');
        this.headerRegion.show(this.navigationHeader);
      } else {
        this.$el.addClass('csui-no-header');
      }
      this.contentRegion.show(this.tabPanel);
      this.headerRegion.$el.on(this._transitionEnd(), _.bind(function (event) {
        if (event.target === this.headerRegion.el) {
          this.$el.removeClass('cs-toggling');
          this.triggerMethod('dom:refresh');
        }
      }, this));

    },

    _onBeforePopulateTab: function (tabPanel, tabPane) {
      if (delayTabContent && !tabPane.contextFragment) {
        tabPane.contextFragment = new ContextFragment(this.context);
      }
    },

    _onPopulateTab: function (tabPanel, tabPane) {
      if (tabPane.contextFragment) {
        tabPane.contextFragment.fetch();
        tabPane.contextFragment.destroy();
        tabPane.contextFragment = undefined;
      }
    },

    _onActivateTab: function (tabContent, tabPane, tabLink) {
      this._updateToggleHeaderState(tabContent, tabPane, tabLink);
      this._notifyHeader();
    },

    _notifyHeader: function(tabContent, tabPane, tabLink){
      var tabIndex = this.tabPanel.activeTab.get('tabIndex');
      var isCollapsed = this.tabPanel.activeTab.get('isCollapsed');
      this.navigationHeader.triggerMethod("active:tab", {'tabIndex':tabIndex, 'isCollapsed': isCollapsed});
    },

    onBeforeRender: function () {
      if (this.headerRegion && this.headerRegion.$el) {
        this.headerRegion.$el.off(this._transitionEnd());
      }
    },

    onBeforeDestroy: function () {
      if (this.headerRegion && this.headerRegion.$el) {
        this.headerRegion.$el.off(this._transitionEnd());
      }
    },

    enumerateWidgets: function (callback) {
      var widget = this.options && this.options.header && this.options.header.widget;
      widget && callback(widget);
      _.each(this.options.tabs, function (tab) {
        _.each(tab.columns || [], function (column) {
          column.widget && callback(column.widget);
        });
      });
    },

    _createWidget: function (widget) {
      var Widget = widget.view;
      if (!Widget) {
        throw new Marionette.Error({
          name: 'UnresolvedWidgetError',
          message: 'Widget not resolved: "' + widget.type + '"'
        });
      }
      return new Widget({
        context: this.options.context,
        data: widget.options || {}
      });
    },

    _updateToggleHeaderState: function (tabContent, tabPane, tabLink) {
      var tabIndex    = tabLink ? tabLink.model.collection.indexOf(tabLink.model) :
                        this.activeTab && this.activeTab.get('tabIndex') || 0,
          method      = tabIndex === 0 ? 'removeClass' : 'addClass',
          isCollapsed = this.$el.hasClass('cs-collapse');
      if (method === 'removeClass' && isCollapsed ||
          method === 'addClass' && !isCollapsed) {
        this.$el.addClass('cs-toggling');
        this.$el[method]('cs-collapse');
      }
      this.tabPanel.activeTab.set('isCollapsed', (tabIndex > 0) );

      if (this.tabPanel && this.tabPanel.tabLinks) {
        this.setViewStateTabIndex(tabIndex);
      }
    },

    onDomRefresh: function () {
      this.onViewStateChanged();
    },

    _initActiveTabFromViewState: function () {
      var tabIndex = this.getViewStateTabIndex();
      var context = this.context;

      var newTabIndex = tabIndex;
      if ((tabIndex === undefined || tabIndex === null) && AllowTabIndexBeSet.call(this)) {
        newTabIndex = tabIndexPreferences.getPreferredTabIndex({context: context});
      }

      if (newTabIndex !== undefined && newTabIndex !== tabIndex) {
        tabIndex = newTabIndex;
        this.context.viewStateModel.set('replaceURL', true);
        this.setViewStateTabIndex(tabIndex);
      }
      if (tabIndex) {
        return new Backbone.Model({tabIndex: tabIndex});
      }
    },

    onViewStateChanged: function (forceActivation) {

      if (this.context.viewStateModel.get('disable_tab_switching')) {
        return;
      }
      var activeRouter = this.context.viewStateModel.get("activeRouterInstance");
      if (activeRouter!==this.associatedRouter) {
        return;
      }
      
      var tabIndex = this.getViewStateTabIndex(),
          defaultTabIndex = this.getDefaultViewStateTabIndex(),
          tabPanel = this.tabPanel,
          tabLinks = tabPanel && this.tabPanel.tabLinks,
          self     = this;

      if (tabIndex === undefined) {
        tabIndex = defaultTabIndex || 0;
      }
      function isTabContentCreated(index) {
        var tabPanels = tabPanel.el.querySelectorAll('[role=tabpanel]');
        if (self.context.viewStateModel.get('routeFromUrl')) {
          return true;
        } else if (tabPanels && tabPanels.length > index) {
          return $(tabPanels[index]).height() > 0;
        }
      }

      function activateTabWhenReady(tab, tabIndex) {
        if (isTabContentCreated(tabIndex)) {
          tab.activate();
        } else {
          setTimeout(activateTabWhenReady.bind(self, tab, tabIndex), 50);
        }
      }

      if (tabLinks && tabIndex !== undefined) {
        var tab = tabLinks.children.findByIndex(tabIndex);
        if (tab && !tab.isActive()) {
          activateTabWhenReady(tab, tabIndex);
        }
      }
    },

    _setFirstTabPanelVisibility: function (show) {
      var tabPanel = this.tabPanel.el.querySelector('[role=tabpanel]');
      tabPanel && (tabPanel.style.visibility = show ? 'visible' : 'hidden');
    },
    _transitionEnd: _.once(
        function () {
          var transitions = {
                transition: 'transitionend',
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend'
              },
              element     = document.createElement('div'),
              transition;
          for (transition in transitions) {
            if (typeof element.style[transition] !== 'undefined') {
              return transitions[transition];
            }
          }
        }
    ),

    _supportMaximizeWidget: true

  });

  _.extend(TabbedPerspectiveView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(TabbedPerspectiveView.prototype, NodeViewStateMixin);

  return TabbedPerspectiveView;
});
