/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/utils/url', 'csui/utils/base',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/namedsessionstorage',
  'csui/models/nodes',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/accessibility',
  'csui/pages/start/perspective.routing',
  'csui/controls/settings/settings.view',
  'csui/controls/globalmessage/globalmessage',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/search.results/controls/sorting/sort.menu.view',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'hbs!csui/widgets/search.results/impl/search.results.header',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/widgets/search.results/impl/search.results.header.title.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/icon/icon.view',
  'csui/utils/high.contrast/detector!',
  'csui/utils/commands',
  'css!csui/widgets/search.results/impl/search.results'
], function (_, $, Backbone, Marionette, Url, base, PreviousNodeModelFactory, NextNodeModelFactory,
    NamedSessionStorage, NodeCollection, UserModelFactory, SearchQueryModelFactory, SearchFormQueryModelFactory,
    Accessibility,
    PerspectiveRouting, SettingsView, GlobalMessage, TabableRegionBehavior, SortingView, lang,
    headerTemplate, ApplicationScopeModelFactory, TitleView, ViewEventsPropagationMixin,
    IconView, highContrast, commands) {

  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable(),
      searchSortingRegion;
  var SearchHeaderView = Marionette.LayoutView.extend({
    className: "csui-search-results-header",
    template: headerTemplate,
    templateHelpers: function () {
      var messages = {
        searchResults: lang.searchResults,
        clearAll: lang.clearAll,
        about: lang.about,
        searchResultsHeaderAria: lang.searchResultsHeaderAria,
        searchBackTooltip: lang.searchBackTooltip,
        searchFilterTooltip: lang.filterExpandTooltip,
        searchFormTooltip: lang.searchFormExpandTooltip,
        filterLabelAria: lang.filterExpandAria,
        filterExpandedAria: this.options.originatingView.showFacet,
        searchFormLabelAria: lang.searchFormExpandAria,
        searchFormExpandedAria: this.options.originatingView.showSearch,
        enableSearchFilter: this.options.enableFacetFilter,
        tabularViewIconTitle: lang.tabularSearchView,
        descriptionTitle: lang.showDescription,
        showSettings: !!this.options.enableSearchSettings,
        settingsLabel: lang.searchSettings,
        tabularSearchView: this.collection.prevSearchDisplayStyle === "TabularView",
        iconTheme: this._useIconsForDarkBackground ? 'dark' : '',
        saveas: lang.saveAs,
        saveAsAria: lang.saveAsAria,
        updateSavedQuery: lang.updateQuery,
        updateSavedQueryAria: lang.updateQueryAria,
        saveOptionsAria: lang.saveOptionsAria
      };
      return {
        messages: messages,
        enableCustomSearch: this.enableCustomSearch,
        showSaveSearch : this.showSaveSearch
      };
    },

    ui: {
      back: '.cs-go-back',
      parent: '.csui-search-arrow-back-parent',
      filter: '.csui-search-filter',
      filterParent: '.csui-search-facet-filter-parent',
      searchParent: '.csui-search-filter-parent',
      search: '.csui-search-form-filter',
      resultTitle: '.csui-results-title',
      searchHeaderTitle: '.csui-search-header-title',
      settingsMenu: '.csui-setting-icon',
      toggleResultsView: '.csui-tabular-view',
      toggleDescription: '.csui-description-toggle',
      headerRightToolbar: '.csui-search-right-header-container',
      saveQuery : '.csui-query-save',
      updateQuery: '.csui-query-update',
      searchQuerySegmentedButton: '.csui-segemented-save-tools',
      segmentedButtonSection: '.csui-segmented-update-button',
      segmentedDropdownSection: '.csui-segmented-dropdown-button',
      saveSearchTools: '.csui-save-search-tools'
    },

    events: {
      'click @ui.saveQuery' : 'onClickSaveQuery',
      'click @ui.segmentedButtonSection' : 'onClickUpdateQuery',
      'click @ui.back': 'onClickBack',
      'click @ui.parent': 'onClickBack',
      'keypress @ui.back': 'onClickBack',
      'click @ui.filter': 'onClickFilter',
      'click @ui.search': 'onClickSearch',
      'keypress @ui.search': 'onClickSearch',
      'click @ui.searchParent': 'onClickSearch',
      'keypress @ui.filter': 'onClickFilter',
      'click @ui.filterParent': 'onClickFilter',
      'click @ui.settingsMenu': '_createSettingsDropdown',
      'keydown @ui.settingsMenu': 'showSettingsDropdown',
      'click @ui.toggleResultsView': 'toggleView',
      'keypress @ui.toggleResultsView': 'toggleView',
      'click @ui.toggleDescription': 'onToggleDescriptionClick',
      'keypress @ui.toggleDescription': 'onToggleDescriptionClick',
      'click .csui-update-query': 'onClickUpdateQuery',
      'click .csui-create-query': 'onClickSaveQuery',
      keydown: "onKeyView"
    },

    regions: {
      settingsRegion: '.csui-settings-dropdown'
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function (event) {
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden")');
      if (tabElements.length > 0) {
        tabElements.prop('tabindex', -1);
      }
      if (!!event && event.shiftKey) {
        return $(tabElements[tabElements.length - 1]);
      } else {
        return $(tabElements[0]).hasClass('csui-acc-focusable-active') ? this.ui.filter :
               $(tabElements[0]);
      }
    },

    currentlyFocusedElementInHeader: function (event) {
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden"):visible:not(":disabled")');
      var elementOfFocus = tabElements.length > 0? $(tabElements[this.accNthHeaderItemFocused]): null;
      return elementOfFocus;
    },

    namedSessionStorage: new NamedSessionStorage(),
    constructor: function SearchHeaderView(options) {
      options || (options = {});
      this.enableCustomSearch = options.originatingView.enableCustomSearch;
      this._icon_table_standard = 'csui_action_table_standard32';
      this._icon_table_tabular = 'csui_action_table_tabular32';
      this.localStorage = options && options.localStorage;
      this.accNthHeaderItemFocused = this.enableCustomSearch ? 2 : 0;
      Marionette.LayoutView.prototype.constructor.call(this, options); // apply (modified)
      if (this.collection) {
        this.listenTo(this.collection, 'reset',
            this.updateHeader) // render after reset of collection
            .listenTo(this.collection, 'remove', this._collectionItemRemoved);
      }
      this.previousNode = options.context.getModel(PreviousNodeModelFactory).clone();
      this.nextNode = options.context.getModel(NextNodeModelFactory);
      this.searchQuery = options.context.getModel(SearchQueryModelFactory);
      this.searchForm = options.context.getModel(SearchFormQueryModelFactory);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.context = options.context;
      this._useIconsForDarkBackground = (options.useIconsForDarkBackground && highContrast !== 2) || highContrast === 1;
      if (this.localStorage.storage && this.localStorage.storage.getItem('PrevSearchDisplayStyle')) {
        this.showDescription = this.localStorage.get(
            this._createSearchDisplayStyleKey() + '_showDescription');
      }

      this.showSaveSearch = this.options.saveSearchTools && this.isQueryObjectUnrestricted();
    },

    initialize: function () {
      this.titleView = this.options.titleView || new TitleView({});
    },

    isQueryObjectUnrestricted: function () {
      var objectTypes = this.options.context && this.options.context._factories.objecttypes && _.has(this.options.context._factories.objecttypes.property.attributes, "objecttypes") &&
      this.options.context._factories.objecttypes.property.attributes.objecttypes;
      return !!_.find(objectTypes, function(object){ return object.type === 258; });

    },

    toggleSaveSearchTools: function (showSegmented) {
      if(this.options.originatingView && this.options.originatingView.hasEditPermsForSearchQuery) {
        this.ui.searchQuerySegmentedButton[showSegmented ? 'removeClass' : 'addClass']('binf-hidden');
        this.ui.saveQuery[showSegmented ? 'addClass' : 'removeClass']('binf-hidden');
      }
    },

    updateSaveSearchTools: function (afterUpdate, afterSave) {
      var isSavedQuery = this.options.originatingView.enableCustomSearch;
      if (isSavedQuery) {
        if (afterUpdate) {  //For saved queries, after updating query, only Save as button should be visible
          this.disableSaveSearchTools = false;
          this.toggleSaveSearchTools(false);
        } else if (!this.disableSaveSearchTools && !afterSave) { //After modifying search, segmented buttons should be visisble
          this.disableSaveSearchTools = true;
          this.toggleSaveSearchTools(true);
        }
      } else if (!isSavedQuery && this.options.originatingView.previousSavedQuery) {
        this.ui.searchQuerySegmentedButton['removeClass']('binf-hidden');
        this.ui.saveQuery['addClass']('binf-hidden');
        if (afterSave || afterUpdate) {  //In case of normal search results,after performing save/update disable the segmented buttons
          this.ui.segmentedButtonSection['prop']('disabled', true);
          this.ui.segmentedDropdownSection['prop']('disabled', true);
        } else {
          this.ui.segmentedButtonSection['prop']('disabled', false);
          this.ui.segmentedDropdownSection['prop']('disabled', false);
        }
      } else {
        this.toggleSaveSearchTools(false);
      }
    },

    updateHeader: function () {
      if(!this.titleViewRendered){
        this.renderTitleView();
      }
      var toggleClasses = _.bind(function(toggle) {
        this.ui.back[toggle ? 'addClass' : 'removeClass']('search_results_data');
        this.ui.filter[toggle ? 'addClass' : 'removeClass']('search_results_data');
        this.ui.filterParent[toggle ? 'removeClass' : 'addClass']('binf-hidden');
        this.ui.searchParent[toggle
          && this.options.originatingView.enableCustomSearch
          ? 'removeClass' : 'addClass']('binf-hidden');
        this.ui.headerRightToolbar[toggle ? 'removeClass' : 'addClass']('binf-hidden');
        this.ui.saveSearchTools.length !== 0 && this.ui.saveSearchTools[toggle
           && !this.searchQuery.get('enableSearchForm') ? 'removeClass' : 'addClass']('binf-hidden');

        this.ui.saveSearchTools.length !== 0
         && !this.options.originatingView.hasEditPermsForSearchQuery
         && this.ui.searchQuerySegmentedButton['addClass']('binf-hidden');
      }, this);

      if (this.collection && this.collection.length) {
        toggleClasses(true);
        if (this.options.enableFacetFilter) {
          this.filterIconView = new IconView(
              {iconName: 'csui_action_filter32', states: true, on: this._filterStateIsOn});
          this.filterIconRegion = new Marionette.Region({el: this.ui.filter});
          this.filterIconRegion.show(this.filterIconView);
        }
        if (this.enableCustomSearch) {
          this.searchIconView = new IconView(
            {
              iconName: 'csui_action_search32',
              size: 'normal', states: true,
              on: this._searchStateIsOn
            });
          this.searchIconRegion = new Marionette.Region({ el: this.ui.search });
          this.searchIconRegion.show(this.searchIconView);
        }
        this.toggleDescriptionIconView = new IconView(
            {iconName: 'csui_action_reveal_description32', states: true, on: this.showDescription, theme: this._useIconsForDarkBackground ? 'dark' : ''});
        this.toggleDescriptionIconRegion = new Marionette.Region({el: this.ui.toggleDescription});
        this.toggleDescriptionIconRegion.show(this.toggleDescriptionIconView);

        this.toggleResultsIconView = new IconView(
            {iconName: this._icon_table_standard, states: true, theme: this._useIconsForDarkBackground ? 'dark' : ''});
        this.toggleResultsRegion = new Marionette.Region({el: this.ui.toggleResultsView});
        this.toggleResultsRegion.show(this.toggleResultsIconView);
        this.updateToggleIcon();
      } else {
        toggleClasses(false);
        this.setFacetOpened(false);
      }
      this.updateToggleDescriptionIcon();
      this.updateToggleDescription();
      if (this.collection.prevSearchDisplayStyle === "TabularView") {
        this._createSortRegion();
        this._createSortingView();
      }
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden")');
      tabElements.length > 0 && tabElements.splice(this.accNthHeaderItemFocused, 1);
      if (tabElements.length > 0) {
        tabElements.prop('tabindex', -1);
      }
      var ele = this.currentlyFocusedElementInHeader();
      ele && ele.attr("tabindex", 0);
      this.titleViewRendered = false;
    },

    setFacetOpened: function (isOpened) {
      this._filterStateIsOn = isOpened;
      this.filterIconView && this.filterIconView.setIconStateIsOn(isOpened);  // triggers rerender of icon with new state
    },
    setSearchOpened: function (isOpened) {
      this._searchStateIsOn = isOpened;
      this.searchIconView && this.searchIconView.setIconStateIsOn(isOpened);  // triggers rerender of icon with new state
    },

    updateToggleDescriptionIcon: function () {
      if (this.collection.prevSearchDisplayStyle === "TabularView") {
        this.$el.find('.csui-description-toggle').removeClass('search-settings-none');
        this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
        if (this.showDescription) {
          this.$el.find('.csui-description-toggle').attr("title", lang.hideDescription);
          this.$el.find('.csui-description-toggle').attr("aria-label", lang.hideDescription);
        } else {
          this.$el.find('.csui-description-toggle').attr("title", lang.showDescription);
          this.$el.find('.csui-description-toggle').attr("aria-label", lang.showDescription);
        }
      } else {
        this.$el.find('.csui-description-toggle').addClass('binf-hidden');
        this.$el.find('.csui-description-toggle').removeClass('icon-description-shown');
      }
    },

    updateToggleDescription: function () {
      if (this.options.originatingView &&
          this.options.originatingView.collection.prevSearchDisplayStyle === "TabularView") {
        if (accessibleTable && this.options.originatingView.targetView) {
          this.options.originatingView.getAdditionalColumns();
        } else {
          var descriptiveItems = this.options.originatingView.collection.filter(
              function (model) { return model.get('description') }),
              summaryItems = this.options.originatingView.collection.filter(
                  function (model) { return model.get('summary') }),
              showDescriptionFlag = this.localStorage.get(
                  this._createSearchDisplayStyleKey() + '_showDescription');
          this.selectedSettings = (this.selectedSettings) ? this.selectedSettings :
                                  this.collection.selectedSettings;
          switch (this.selectedSettings) {
          case 'DO': {
            if (descriptiveItems.length) {
              this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
              this._setShowDescriptions(showDescriptionFlag);
              if (showDescriptionFlag) {
                this.$el.find('.csui-description-toggle').removeClass('icon-description-hidden')
                    .addClass('icon-description-shown');
                this.$el.find('.csui-description-collapsed').removeClass(
                    'csui-description-collapsed');
              }
            } else if (!this.$el.find('.csui-description-toggle').hasClass('binf-hidden')) {
              this.$el.find('.csui-description-toggle').addClass('binf-hidden');
              this._setShowDescriptions(false);
              this.options.originatingView && this.options.originatingView.targetView &&
              this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                  'csui-description-collapsed');
            }
            break;
          }
          case 'SP':
          case 'DP':
          case 'SD': {
            if (descriptiveItems.length || summaryItems.length) {
              this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
              this._setShowDescriptions(showDescriptionFlag);
              if (showDescriptionFlag) {
                this.$el.find('.csui-description-toggle').removeClass(
                    'icon-description-hidden').addClass('icon-description-shown');
                this.$el.find('.csui-description-collapsed').removeClass(
                    'csui-description-collapsed');
              }
            } else if (!this.$el.find('.csui-description-toggle').hasClass('binf-hidden')) {
              this.$el.find('.csui-description-toggle').addClass('binf-hidden');
              this._setShowDescriptions(false);
              this.options.originatingView && this.options.originatingView.targetView &&
              this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                  'csui-description-collapsed');
            }
            break;
          }
          case 'SO': {
            if (summaryItems.length) {
              this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
              this._setShowDescriptions(showDescriptionFlag);
              if (showDescriptionFlag) {
                this.$el.find('.csui-description-toggle').removeClass(
                    'icon-description-hidden').addClass('icon-description-shown');
                this.$el.find('.csui-description-collapsed').removeClass(
                    'csui-description-collapsed');
              }
            } else if (!this.$el.find('.csui-description-toggle').hasClass('binf-hidden')) {
              this.$el.find('.csui-description-toggle').addClass('binf-hidden');
              this._setShowDescriptions(false);
              this.options.originatingView && this.options.originatingView.targetView &&
              this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                  'csui-description-collapsed');
            }
            break;
          }
          case 'NONE': {
            this.$el.find('.csui-description-toggle').addClass('search-settings-none');
            this.options.originatingView && this.options.originatingView.targetView &&
            this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                'csui-description-collapsed');
            this._setShowDescriptions(false);
            break;
          }
          }
        }
      }
    },
    onRender: function () {
      this.renderTitleView();
      if (this.collection && this.collection.length) {
        this.ui.back.addClass('search_results_data');
        this.ui.filter.addClass('search_results_data');
      } else {
        this.ui.back.addClass('search_results_nodata');
        this.ui.filter.addClass('search_results_nodata');
      }

      this.listenTo(this.options.originatingView, 'queryTools:update', function () {
        this.showSaveSearch && this.updateSaveSearchTools();
      });

      this.rendered = true;
      this.$el.show();

      var hideBackButton, viewStateModel = this.context && this.context.viewStateModel;
      if (this.options.enableBackButton) {
        this.ui.back.attr('title', this.options.backButtonToolTip);
        this.ui.back.attr('aria-label', this.options.backButtonToolTip);
      } else if (this._isViewStateModelEnabled() && !viewStateModel.hasRouted()) {
        hideBackButton = true;
      } else if (PerspectiveRouting.getInstance(this.options).hasRouted() || history.state ||
                 this._isViewStateModelEnabled() ||
                 this.previousNode.get('id') ||
                 (!!this.namedSessionStorage && this.namedSessionStorage.get("previousNodeId")) ||
                 this._isPreviousRouter("Metadata")) {
        this._setBackButtonTitle();
      } else {
        hideBackButton = true;
      }

      if (hideBackButton) {
        this.ui.back.hide();
        this.ui.parent.hide();
      }

      if (!this.tableRowSelectionToolbarRegion) {

        this._createToolbarRegion();

        this.options.originatingView._updateToolbarActions();
      }

      if (this._isViewStateModelEnabled()) {
        viewStateModel && this.listenTo(viewStateModel, "navigate", function (historyEntry) {
          if (historyEntry && hideBackButton) {
            this.ui.back.show();
            this.ui.parent.show();
          }
        });
      }
    },

    renderTitleView: function () {
      _.extend(this.titleView.options, {
        count: this.collection && this.collection.totalCount,
        useCustomTitle: !!this.options.useCustomTitle,
        searchHeaderTitle: this.collection && this.collection.searching ?
                           this.collection.searching.result_title : lang.searchResults
      });

      this.titleView.render();
      Marionette.triggerMethodOn(this.titleView, 'before:show', this.titleView, this);
      this.ui.searchHeaderTitle.append(this.titleView.el);
      Marionette.triggerMethodOn(this.titleView, 'show', this.titleView, this);
    },

    onBeforeDestroy: function () {
      this.titleView.destroy();
    },

    onClickSaveQuery: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.resetTabIndex();
      var self = this,
        context = this.context,
        connector = this.collection.connector,
        saveQuery = commands.get('SaveQuery'),
        promise = saveQuery.execute({
          context: context,
          connector: connector,
          originatingView: this.options.originatingView
        }, this.collection);
      promise.always(function () {
        var succeeded = promise.state() === 'resolved';
        succeeded && self.updateSaveSearchTools(false, true);
      });
      this._closeSaveSearchToolsDropdown();
    },

    onClickUpdateQuery: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.resetTabIndex();
      var self = this,
        context = this.context,
        connector = this.collection.connector,
        updateQuery = commands.get('UpdateQuery'),
        promise = updateQuery.execute({
          context: context,
          connector: connector
        }, {
          cache_id: this.collection.cacheId ? this.collection.cacheId : this.collection.searching.cache_id,
          queryId: this.searchQuery.get('query_id') ? this.searchQuery.get('query_id') : this.options.originatingView.previousSavedQuery
        });
      promise.always(function () {
        var succeeded = promise.state() === 'resolved';
        if(succeeded) {
          if(self.enableCustomSearch && !self.searchQuery.get('enableSearchForm')) {
            self.trigger('readonly:filters');
          }
          self.updateSaveSearchTools(true, false);
        }
      });
      this._closeSaveSearchToolsDropdown();
    },

    _closeSaveSearchToolsDropdown: function () {
      if (this.ui.segmentedDropdownSection && this.ui.segmentedDropdownSection.parent().hasClass('binf-open')) {
        this.ui.segmentedDropdownSection.binf_dropdown('toggle');
      }
    },

    showSettingsDropdown: function (event) {
      var keyCode = event.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        this._createSettingsDropdown(event);
        event.preventDefault();
        event.stopPropagation();
      }
    },

    _createSettingsDropdown: function (event) {
      var eventTarget = event.currentTarget;
      if (!eventTarget.classList.contains('csui-setting-icon')) {
        return; // event bubbled from dropdown to toolbar item => ignore it
      }
      if (!this.settingsView || (this.settingsView && this.settingsView.isDestroyed())) {
        $(document).on('mouseup.dropdown.' + this.cid, _.bind(this._closeSettingsMenu, this));
        this.data = {};
        this.settingsView = new SettingsView({
          model: this.options.settings,
          tableCollection: this.collection,
          data: this.data,
          searchResultsView: this.options.originatingView,
          isTabularView: this.collection.prevSearchDisplayStyle === 'TabularView'
        });
        this.listenTo(this.settingsView, 'close:menu', _.bind(function (event) {
          this._destroySettingsDropdown(event);
        }, this));
        this.settingsRegion.show(this.settingsView);
        this.$el.children().find('.csui-setting-icon').attr('aria-expanded', true);
        this.propagateEventsToViews(this.settingsView);
        this.settingsView.$el.find('.binf-show').trigger('focus');
        this.settingsView.isVisible = true;
        this.listenTo(this.settingsView, 'update:showSummaryDescriptions', function () {
          this.selectedSettings = this.settingsView.model.get(
              'display').summary_description.selected;
          if (this.collection.prevSearchDisplayStyle === "TabularView") {
            this.options.originatingView.targetView.selectedSettings = this.selectedSettings;
            this.options.originatingView.targetView.options.descriptionRowViewOptions
                .showSummaryOnly = this.selectedSettings === 'SO';
            this.updateHeader();
            this._createSortRegion();
            this._createSortingView();
            this._createToolbarRegion();
            this.options.originatingView._updateToolbarActions();
            if (this.options.originatingView.collection.selectedItems &&
                this.options.originatingView.collection.selectedItems.length > 0) {
              this.options.originatingView.collection.selectedItems.reset(
                  this.options.originatingView.targetView._allSelectedNodes.models);
              this.options.originatingView.targetView._tableRowSelectionToolbarView.trigger(
                  'toggle:condensed:header');
            }
          } else {
            this.options.originatingView.targetView.render();
            this.options.originatingView.targetView.trigger('render:metadata');
          }
        });
      } else {
        this._destroySettingsDropdown();
        this.$el.find('.csui-search-settings').attr('aria-expanded', false);
      }
      this.setAccNthHeaderItemFocused(this.ui.settingsMenu);
    },

    _destroySettingsDropdown: function (event) {
      this.settingsView.destroy();
      $(document).off('mouseup.dropdown.' + this.cid);
      if (!!this.data.summary_description || !!this.data.display_regions) {
        this.options.originatingView.blockActions();
        this.collection.isSortOptionSelected = true;
        this.formData = new FormData();
        var self = this;
        _.mapObject(this.data, function (value, key) {
          if (key === 'display_regions') {
            self.formData.append(key, value);
          } else if (key === 'summary_description') {
            self.formData.append(key, value);
          }
        });
        this.settingsView.model.save(null, {
          parse: false,
          data: this.formData,
          processData: false,
          cache: false,
          contentType: false
        }).done(_.bind(function (response) {
          if (!!self.data.summary_description) {
            self.settingsView.model.get(
                'display').summary_description.selected = self.data.summary_description;
            self.settingsView.trigger('update:showSummaryDescriptions');
            self.options.originatingView.collection.settings_changed = false;
          }
          if (!!self.data.display_regions) {
            self.options.originatingView.unblockActions();
            self.options.originatingView.collection.settings_changed = true;
            self.settingsView.options.tableCollection.fetch();
          }
          if (!self.options.originatingView.collection.settings_changed) {
            self.options.originatingView.executeEndProcess();
            self.trigger('render:table');
          }
          this.$el.find(".csui-setting-icon").trigger('focus');
        }, this)).fail(function (error) {
          error = new base.Error(error);
          GlobalMessage.showMessage('error', error.message);
          self.options.originatingView.unblockActions();
        });
        if (this.options.originatingView && this.options.originatingView.targetView &&
            this.options.originatingView.targetView.standardHeaderView) {
          this.options.originatingView.targetView.standardHeaderView.expandAllView.pageChange();
          this.options.originatingView.targetView.standardHeaderView.expandAllView._isExpanded = false;
        }
      }
      if (this.settingsView.isChanged) {
        if (this.options.originatingView) {
          this.trigger('render:table');
          this.settingsView.isChanged = false;
        }
      }
    },

    _closeSettingsMenu: function (e) {
      var loaderDisabled = !!this.options.originatingView.$el.find(
          '.load-container.binf-hidden').length;
      if (!loaderDisabled || (this.ui.settingsMenu.is && this.ui.settingsMenu.is(e && e.target)) ||
          (this.settingsView && this.settingsView.$el.has(e && e.target).length)) {
        e.stopPropagation();
      } else if (!(this.settingsView && this.settingsView.isDestroyed())) {
        this._destroySettingsDropdown(e);
        this.$el.find(".csui-setting-icon").trigger('focus').attr('aria-expanded', false);
      }
    },

    onToggleDescriptionClick: function (e) {
      if ((e.type === 'keypress' && (e.keyCode === 13 || e.keyCode === 32)) ||
          (e.type === 'click')) {
        e.preventDefault();
        var originatingView = this.options.originatingView;
        if (!this.showDescription) {
          this.localStorage.set(this._createSearchDisplayStyleKey() + '_showDescription', true);
          originatingView.targetView.options.descriptionRowViewOptions.showDescriptions = true;
          this.ui.toggleDescription.attr("title", lang.hideDescription);
          this.ui.toggleDescription.attr("aria-label", lang.hideDescription);
          this._setShowDescriptions(true);
        } else {
          this.localStorage.set(this._createSearchDisplayStyleKey() + '_showDescription', false);
          originatingView.targetView.options.descriptionRowViewOptions.showDescriptions = false;
          this.ui.toggleDescription.attr("title", lang.showDescription);
          this.ui.toggleDescription.attr("aria-label", lang.showDescription);
          originatingView.$el.find('.cs-description').addClass('csui-description-collapsed');
          this._setShowDescriptions(false);
        }
        this.$el.find('.csui-description-toggle').trigger('focus');
        this.currentlyFocusedElement();
        this.setAccNthHeaderItemFocused(this.ui.toggleDescription);
        var ele = this.currentlyFocusedElementInHeader();
        ele && ele.attr("tabindex",0);
      }
    },

    _setShowDescriptions: function (show) {
      this.showDescription = show;
      this.toggleDescriptionIconView && this.toggleDescriptionIconView.setIconStateIsOn(show);
      this.trigger('toggle:description', {showDescriptions: show});
    },

    toggleView: function (e) {
      if ((e.type === 'keypress' && (e.keyCode === 13 || e.keyCode === 32)) ||
          (e.type === 'click')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.ui.toggleResultsView.removeClass('csui-toggledView');
        if (this.collection.prevSearchDisplayStyle === "TabularView") {
          if (this.$el.parent('#header').hasClass('csui-show-header')) {
            this.$el.parent('#header').removeClass('csui-show-header');
            this.$el.find('.csui-search-header').removeClass('csui-show-header');
          }
          this.$el.find('.csui-table-rowselection-toolbar').addClass('binf-hidden');
          this._prevSearchDisplayStyleLocalStorage("StandardView");
          this.collection.prevSearchDisplayStyle = "StandardView";
          searchSortingRegion && searchSortingRegion.$el.empty();
        } else {
          this._prevSearchDisplayStyleLocalStorage("TabularView");
          this.collection.prevSearchDisplayStyle = "TabularView";
          this._createSortRegion();
          this.collection.isSortOptionSelected = true;
          this._createSortingView();
          this._createToolbarRegion();
          this.ui.toggleResultsView.addClass('csui-toggledView');
          if (this.collection.selectedItems.length > 0) {
            this.$el.find('.csui-search-header').addClass('csui-show-header');
            this.$el.parent('#header').addClass('csui-show-header');
          }
        }
        this.updateToggleIcon();
        this.updateToggleDescriptionIcon();
        this.updateToggleDescription();
        this.trigger('reload:searchForm');
        this.currentlyFocusedElement();
        this.setAccNthHeaderItemFocused(this.ui.toggleResultsView);
        var ele = this.currentlyFocusedElementInHeader();
        ele && ele.attr("tabindex", 0);
        this.ui.toggleResultsView.trigger('focus');
      }
    },

    updateToggleIcon: function () {
      if (this.collection.prevSearchDisplayStyle === "TabularView") {
        this.ui.toggleResultsView.attr("title", lang.standardSearchView);
        this.ui.toggleResultsView.attr("aria-label", lang.standardSearchView);
        this.toggleResultsIconView.setIcon(this._icon_table_standard);
      } else {
        this.ui.toggleResultsView.attr("title", lang.tabularSearchView);
        this.ui.toggleResultsView.attr("aria-label", lang.tabularSearchView);
        this.toggleResultsIconView.setIcon(this._icon_table_tabular);
      }
    },

    _createSortRegion: function () {
      searchSortingRegion = new Marionette.Region({
        el: this.$('#csui-search-sorting')
      });
    },

    _createSortingView: function () {
      var originatingView = this.options.originatingView,
          sortingView;

      if (originatingView) {
        if (!originatingView.sortingView) {
          sortingView = new SortingView({
            collection: this.options.collection,
            enableSorting: this.options.enableSorting !== undefined ? this.options.enableSorting :
                           true
          });
        } else {
          sortingView = originatingView.sortingView;
        }
        searchSortingRegion.show(sortingView);
      }
    },

    _createToolbarRegion: function () {
      var tableRowSelectionToolbarRegion = new Marionette.Region({
        el: '.csui-search-results-header .csui-table-rowselection-toolbar'
      });
      this.tableRowSelectionToolbarRegion = tableRowSelectionToolbarRegion;
    },

    _isPreviousRouter: function (name) {
      var viewStateModel = this.context.viewStateModel;
      return viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.LAST_ROUTER) === name;
    },

    _prevSearchDisplayStyleLocalStorage: function (searchDisplayStyle) {
      this.localStorage.set(this._createSearchDisplayStyleKey(), searchDisplayStyle);
    },

    _setBackButtonTitle: function () {
      var name = lang.searchBackToHome;
      var viewStateModel = this.context.viewStateModel;
      name = viewStateModel && viewStateModel.getBackToTitle();
      this.ui.back.attr('title', _.str.sformat(lang.searchBackTooltipTo, name));
      this.ui.back.attr('aria-label', _.str.sformat(lang.searchBackTooltipTo, name));
    },

    setCustomSearchTitle: function (title) {
      !!this.titleView.setCustomSearchTitle &&
      this.titleView.setCustomSearchTitle(title);
    },

    _collectionItemRemoved: function () {
      var originalCount = this.collection.totalCount;
      this.collection.totalCount = --this.collection.totalCount;
      if (this.collection.prevSearchDisplayStyle === "TabularView" &&
          this.tableRowSelectionToolbarRegion) {
        delete this.tableRowSelectionToolbarRegion;
      }
      this.render();
      this.titleViewRendered = true;
      this.updateHeader();
      this.collection.totalCount = originalCount;
    },

    onClickBack: function (event) {
      if (this.backButtonClicked) {
        return;
      }
      this.backButtonClicked = true;
      if ((event.type === 'keypress' && event.keyCode === 13) || (event.type === 'click')) {
        if (this.options.enableBackButton) {
          event.stopPropagation();
          this.trigger("go:back");
        } else if (this._isViewStateModelEnabled()) {
          if (this.context.viewStateModel.getLastRouterIndex() !== -1) {
            this.context.viewStateModel.restoreLastRouter();
          } else {
            this.applicationScope.set('id', '');
          }
        } else if (this.previousNode.get('id') ||
                   (!!this.namedSessionStorage && this.namedSessionStorage.get("previousNodeId"))) {
          this.nextNode.set('id', undefined, {silent: true});
          this.nextNode.set('id', this.namedSessionStorage.get("previousNodeId"));
        } else {
          this.applicationScope.set('id', '');
        }
      }
    },

    _isViewStateModelEnabled: function () {
      return this.context && this.context.viewStateModel;
    },

    onClickFilter: function (event) {
      if ((event.type === 'keypress'
        && (event.keyCode === 13 || event.keyCode === 32))
        || (event.type === 'click')) {
        event.preventDefault();
        event.stopPropagation();
        this.searchinit = false;
        this.filterinit = true;
        this.trigger("open:facet:view", this.options.originatingView);
        this.trigger("toggle:filter", this.options.originatingView);
        this.trigger("focus:filter", this.options.originatingView);
        this.trigger("correct:search:aria", this.options.originatingView);
        this.setAccNthHeaderItemFocused(this.ui.filter);
      }
    },

    onClickSearch: function (event) {
      if ((event.type === 'keypress'
        && (event.keyCode === 13 || event.keyCode === 32))
        || (event.type === 'click')) {
        event.preventDefault();
        event.stopPropagation();
        this.searchinit = true;
        this.filterinit = false;
        this.trigger("open:custom:view", this.options.originatingView);
        this.trigger("toggle:search", this.options.originatingView);
        this.trigger("focus:search", this.options.originatingView);
        this.trigger("correct:filter:aria", this.options.originatingView);
        this.setAccNthHeaderItemFocused(this.ui.search);
      }
    },

    onKeyView: function (event) {
      if (event.type === "keydown") {
        var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden"):visible:not(":disabled")');
        if (event.keyCode != 9 && event.keyCode != 16) {
          this.currentlyFocusedElement();
        }
        switch (event.keyCode) {
          case 39:
            if (this.accNthHeaderItemFocused < tabElements.length - 1) {
              this.accNthHeaderItemFocused++;
            }
            this._moveTo(event);
            break;
          case 37:
            if (this.accNthHeaderItemFocused > 0) {
              this.accNthHeaderItemFocused--;
            }
            this._moveTo(event);
            break;
          case 13:
          case 32:
            $(event.target).click();
            event.preventDefault();
            event.stopPropagation();
            this.currentlyFocusedElementInHeader().trigger("focus");
            this.currentlyFocusedElementInHeader().attr("tabindex", 0);
            break;
        }
      }
    },
    resetTabIndex: function(){
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden"):visible');
      if(tabElements && tabElements.length>0){
        tabElements[0].tabIndex=0;
        for (var i = 1; i < tabElements.length; i++) {
          tabElements[i].tabIndex=-1;
        }
        this.accNthHeaderItemFocused = 0;
      }
    },
    setAccNthHeaderItemFocused: function (icon) {
      var tabElements = this.$('*[tabindex]:not(".binf-hidden"):visible');
      this.accNthHeaderItemFocused = tabElements.index(icon);
    },

    _moveTo: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger("changed:focus", this);
      this.currentlyFocusedElementInHeader().trigger("focus");
      this.currentlyFocusedElementInHeader().attr("tabindex", 0);
    },

    _createSearchDisplayStyleKey: function () {
      var context = this.context || (this.options && this.options.context),
        srcUrl = new Url().getAbsolute(),
        userID = context && context.getModel(UserModelFactory).get('id'), hostname;
      if (srcUrl == "undefined" || srcUrl == "null") {
        hostname = !!srcUrl && !!userID ? (srcUrl + userID) : "defaultSearchDisplayStyle";
      }
      else {
        hostname = srcUrl && srcUrl.split('//')[1] && srcUrl.split('//')[1].split('/')[0].split(':')[0] + userID;
      }
      return hostname;
    }
  });
  _.extend(SearchHeaderView.prototype, ViewEventsPropagationMixin);
  return SearchHeaderView;
});