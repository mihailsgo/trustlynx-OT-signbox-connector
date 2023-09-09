/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/lib/backbone',
  'csui/models/node/node.model', 'csui/utils/contexts/factories/search.box.factory',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/namedlocalstorage',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/search.slices/search.slices.list.view',
  'csui/widgets/search.forms/search.forms',
  'csui/widgets/search.forms/search.forms.container.view',
  'csui/utils/contexts/factories/next.node',
  'i18n!csui/widgets/search.box/impl/nls/lang',
  'csui/utils/namedsessionstorage',
  'hbs!csui/widgets/search.box/impl/search.box',
  'hbs!csui/widgets/search.box/impl/search.slices.popover',
  'hbs!csui/widgets/search.box/impl/search.slice.dropdown', 'i18n', 'csui/utils/base',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'css!csui/widgets/search.box/impl/search.box',
  'csui/lib/jquery.ui/js/jquery-ui', 'csui/lib/binf/js/binf'
], function (module, _, $, Marionette, Backbone, NodeModel, SearchBoxFactory,
  SearchQueryModelFactory, ApplicationScopeModelFactory, NamedLocalStorage,
  TabableRegionBehavior, SearchSlicesListView,  SearchForms, SearchFormsContainerView,NextNodeModelFactory,
  lang, NamedSessionStorage, template,
  SlicePopOverTemplate, SliceDropDownTemplate, i18n, base, PerfectScrollingBehavior) {
  "use strict";

  var config = _.defaults({}, module.config(), {
    showOptionsDropDown: true,
    showSearchInput: false,
    showInput: false,
    inputValue: '',
    slice: '',
    nodeId: '',
    nodeName: '',
    searchFromHere: true,
    enableSearchBarSettings: true,
    customSearchIconClass: "icon-header-search",
    customSearchIconNoHoverClass: "icon-header-search-nohover",
    customSearchIconCloseClass: "icon-header-search_close"
  });

  var SearchBoxView = Marionette.ItemView.extend({
    className: 'csui-search-box',
    template: template,
    templateHelpers: function () {
      var messages = {
        showOptionsDropDown: this.options.data.showOptionsDropDown,
        placeholder: this.options.data.placeholder || lang.placeholder,
        clearerTitle: lang.clearerTitle,
        startSearchTitle:  lang.startSearch,
        searchIconTitle: lang.searchIconTitle,
        searchIconAria: lang.searchIconAria,
        searchBoxTitle: lang.searchBoxTitle,
        searchOptionsTitle: lang.searchOptionsTitle,
        startSearch: lang.startSearch,
        searchLandmarkAria: lang.searchLandmarkAria
      };
      return {
        messages: messages
      };
    },
    slicePopOverTemplate: SlicePopOverTemplate,
    sliceDropDownTemplate: SliceDropDownTemplate,
    namedSessionStorage: new NamedSessionStorage(),
    ui: {
      input: '.csui-input',
      clearer: '.csui-clearer',
      formfieldSearch: '.csui-formfield-search',
      innerSeparator: '.csui-separator',
      searchIcon: '.csui-header-search-icon',
      dropDown: '.csui-search-options-dropdown',
      dropDownWrapperClass : '.csui-search-options-wrapper'
    },
    events: {
      'click @ui.searchIcon': 'searchHeaderIconClicked',
      'keydown .csui-header-search-icon': 'searchIconKeyPressed',
      'click @ui.input': 'inputClicked',
      'keydown @ui.input': 'inputTyped',
      'keyup @ui.input': 'inputChanged',
      'paste @ui.input': 'inputChanged',
      'change @ui.input': 'inputChanged',
      'click @ui.clearer': 'clearerClicked',
      'click @ui.formfieldSearch': 'formfieldSearchClicked',
      'click .csui-searchbox-option': 'selectSearchOption',
      'keydown @ui.clearer': 'keyDownOnClear',
      'keydown @ui.formfieldSearch': 'keyDownOnFormfieldSearch',
      'keydown .csui-selected-checkbox': 'accessibility',
      'keyup .csui-selected-checkbox': 'keyUpHandler',
      'keyup .csui-slices-more': 'keyUpHandler',
      'keydown .csui-slices-more': '_handleSlicesShowMore',
      'click .csui-slices-more': 'showMore',
      'click .csui-searchforms-show-more': 'openSearchForm',
      'keydown .csui-searchforms-show-more': 'openSearchForm',
      'focus @ui.input': 'focusedOnSearchInput'
    },

    currentlyFocusedElement: function (arg) {
      if (this.$el) {
        var focusables = this.$el.find('*[data-cstabindex=-1]');
        if (focusables.length) {
          focusables.prop('tabindex', 0);
        }
        var shiftKey = !!arg && arg.shiftKey;
        if (!shiftKey && this.$el.find(".search-bar").length &&
            this.$el.find(".search-bar").is(":visible")) {
          this.focusElement = this.$el.find('.csui-input');
          this.skipShowingDropdown = true;
        } else if (this.$el.find('a.csui-acc-focusable').length) {
          this.focusElement = this.$el.find('a.csui-acc-focusable');
        }
      }
      return this.focusElement;
    },
     
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.csui-search-options-wrapper',
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    namedLocalStorage: new NamedLocalStorage('search_bar_settings'),

    constructor: function SearchBoxView(options) {
      options || (options = {});
      options.data = _.defaults({}, options.data, config);
      this.direction = i18n.settings.rtl ? 'left' : 'right';

      var context = options.context;
      if (!options.model) {
        options.model = context.getModel(SearchQueryModelFactory);
      }
      this.applicationScope = context.getModel(ApplicationScopeModelFactory);

      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.listenTo(this.model, 'change:where', this._updateInput);
      this.searchBoxFactory = context.getFactory(SearchBoxFactory);
      this.searchboxModel = this.searchBoxFactory.property;

      if (this.options.data.showOptionsDropDown) {
        this.listenTo(context, 'sync:perspective', this._perspectiveSynced);
        this.listenTo(context, 'change:current:node', this._currentNodeChanged);
        this.listenTo(this.searchboxModel, "change", this.prepareOptionsdropdown);
        this.listenTo(this.searchboxModel, "change", this.prepareSlicePopover);
        this.listenTo(this.searchboxModel, "change", this.prepareSearchFormsPopover);
        this.listenTo(this, "refine:search", this._refineSearch);
      }

      if (this.options.data.enableSearchBarSettings) {
        this.listenTo(this.searchboxModel, "change", this.updateSearchBarSettings);
      }

      if (!!this.model.get("where") || this.options.data.showSearchInput) {
        $(document).on('click.' + this.cid + ' keydown.' + this.cid, this, this._hideSearchBar);
      }
      $(document).on('keydown.' + this.cid, this, this._shortcutToQuery);

      this.searchForms = new SearchForms({
        options: this.options,
        connector: this.searchboxModel && this.searchboxModel.connector,
        originatingView: this
      });
    },

    _refineSearch: function(event, params) {
      this.model.clear({silent: true});
      this.model.set(params);
      this.hideSearchOptionsDropDown(event);
    },

    updateSearchBarSettings: function () {
      this.search_bar_settings = this.searchboxModel.get('search_bar_settings');
      if (this.search_bar_settings && this.search_bar_settings.full_text) {
        this.namedLocalStorage.set('full_text', this.search_bar_settings.full_text);
        if (!!this.model) {
          var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
          this.model.set('modifier', full_text.modifier, {silent: true});
          this.model.set('lookfor', full_text.lookfor, {silent: true});
        }
      }
    },

    _shortcutToQuery: function (event) {
      if (event.ctrlKey && event.keyCode == 114) {
        var self = event.data;
        if (self.isSearchInputVisible()) {
          self.ui.input.trigger('focus');
        } else {
          self.searchIconClicked(event);
        }
      }
    },

    onBeforeDestroy: function () {
      $(document).off('click.' + this.cid).off('keydown.' + this.cid);
    },

    isSearchbarVisible: function () {
      return this.$('.search-bar').is(':visible');
    },

    isSearchInputVisible: function () {
      return this.$('.csui-input').is(':visible');
    },

    handleKeydownNavbar: function (event) {
      var allFocusableElements = $('.csui-navbar.binf-navbar .binf-container-fluid')
        .find("*[tabindex]:visible").toArray();
      var elements = allFocusableElements.unshift(this.$el);
      if (document.activeElement === allFocusableElements[elements - 1]) {
        $(document).find('.csui-help .csui-acc-tab-region').trigger('focus');
      }
    },

    _perspectiveSynced: function (context, perspectiveSource) {
      this._currentNodeChanged(perspectiveSource);
    },

    _currentNodeChanged: function (currentNode) {
      if (currentNode instanceof NodeModel &&
        currentNode.get('container')) {
        this.searchboxModel.nodeId = currentNode.get('id');
        this.searchboxModel.nodeName = currentNode.get('name');
        this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
        this.searchboxModel.trigger("change");
      } else {
        this.searchboxModel.nodeId = undefined;
        this.searchboxModel.nodeName = undefined;
        this.searchboxModel.trigger("change");
      }
    },

    _dataSynced: function (context, perspectiveSource) {
      if (this.searchboxModel) {
        if ((this.options.data && this.options.data.alwaysFetchDropdown) || !(this.searchboxModel && this.searchboxModel.fetched)) {
          this.searchBoxFactory.fetch();
        }
      }
    },

    onRender: function (event) {
      if (this.options.data.showSearchInput) {
        this.$el.find(".search-bar").show();
        this.searchIconToClose();
      }
      var value = this.options.data.inputValue || this.model.get('where');
      this.slice = this.options.data.slice || this.model.get('slice');
      if (value) {
        this._setInputValue(value);
        this.$el.find(".search-bar").show();
      }
      if (this.options.data.showInput || value) {
        this.triggerMethod('before:show:input', this);
        this.ui.input.show();
        this.triggerMethod('show:input', this);
      }

      if (event && event.data) {
        this.$el.find('.csui-search-box .csui-header-search-icon').removeClass(
          event.data.options.data.customSearchIconCloseClass).addClass(
            event.data.options.data.customSearchIconClass);
      }

    },

    _createSliceCollection: function (list) {
      var model,
        collection = new Backbone.Collection();
      _.each(list, function (item) {
          model = new Backbone.Model({
            sliceId: item.sliceId,
            sliceDisplayName: item.sliceDisplayName,
            sliceTooltip: item.sliceTooltip
          });
          collection.add(model);
      });
      return collection;
    },

    prepareSlicePopover: function (e) {
      var slices = this.searchboxModel.get('slices'),
        collection = slices && slices.length > 3 ? this._createSliceCollection(slices.slice(0, 3)) : this._createSliceCollection(slices);
      if (this.options.data.showOptionsDropDown) {
        if (slices) {
          _.each(slices, function (slice) {
            var sliceDisplayName = slice.sliceDisplayName;
            slice.sliceTooltip = _.str.sformat(lang.searchOptionTooltip, sliceDisplayName);
          });
          if (!this.searchSlicesListView) {
            this.searchSlicesListView = new SearchSlicesListView({
              originatingView: this,
              collection: collection
            });
          }
        }
        if ($('.search-bar').is(':visible')) {
          $(".binf-navbar-brand").removeClass("binf-navbar-collapse");
        }
      }
    },

    showSlices: function () {
      if (!!this.searchSlicesListView) {
        this.searchSlicesRegion = new Marionette.Region({ el: '.csui-search-slice-region' });
        this.searchSlicesRegion.$el.length && this.searchSlicesRegion.show(this.searchSlicesListView);
        this.searchSlicesListView.getSelectedSlice();
      }
    },

    prepareSearchFormsPopover: function () {
      var searchForms       = this.searchboxModel.get('search_forms'),
          recentSearchForms = searchForms && searchForms.recent_search_forms || [];

      var hasQuickSearches = _.findIndex(recentSearchForms, {type: 'quick'}) !== -1;
      this.searchFormsContainerView = new SearchFormsContainerView({
        searchFormsList: {
          recent_search_forms: recentSearchForms.slice(0, 5)
        },
        originatingView: this,
        showMore: true,
        hasQuickSearches: hasQuickSearches,
        fromSearchBox: true
      });
    },

    showSearchForms: function () {
      if (this.$el.hasClass('csui-search-expanded') && this.searchFormsContainerView && !this.searchFormsContainerView._isRendered) {
        this.searchFormsRegion = new Marionette.Region({el: '.csui-recent-searchforms-container'});
        this.searchFormsRegion.$el.length  && this.searchFormsRegion.show(this.searchFormsContainerView);
      }
    },

    accessibility: function (event) {
      this.$el.find('.csui-selected-checkbox')
        .attr('tabindex', '0').removeClass('active');
      switch(event.keyCode){
        case 13: this.selectSearchOption(event);
        event.preventDefault();
        break;
        case 32: this.selectSearchOption(event);
        event.preventDefault();
        break;
        case 27:  this.$el.find('.csui-selected-checkbox').attr('tabindex', '-1');
        this.$el.find('.active').removeClass('active');
        if (this.options.data.showOptionsDropDown) {
          this.hideSearchOptionsDropDown(event);
        }
        break;
        case 9:  if (event.shiftKey) {
          this.ui.input[0].focus();
         } else {
          var slices = this.$el.find('.csui-search-popover-row-body');
          $(slices[0]).addClass('active');
          $(slices[0]).find('input[type="radio"]')[0].focus();
         }
         event.preventDefault();
         break;
      }
    },
    keyUpHandler: function (event) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (event.keyCode == 32 && isFirefox) {
        event.stopPropagation();
        event.preventDefault();
      }
    },

    hidePopover: function (event) {
      if (this.options.data.showOptionsDropDown) {
        this.$el.find('.csui-selected-checkbox').attr('tabindex', '-1');
        this.$el.find('.active').removeClass('active');
        this.showOptionsDropdown(event);
      }
    },

    resetPageDefaults: function (event) {
      this.model.resetDefaults = true;
    },

    searchIconKeyPressed: function (event) {
      if (event.keyCode === 32) {
        event.preventDefault();
        this.searchIconClicked(event);
      }
    },

    searchHeaderIconClicked: function (event) {
      if ($('.search-bar').is(':visible')) {
        this._hideSearchBar(event);
        this._hideSearchPanel(event);
      } else {
        this.searchIconToClose();
        this.searchIconClicked(event);
      }
      var parentView = this.options && this.options.parentView;
      parentView && parentView.listenToOnce(parentView, "control:clicked", _.bind(function() {
        if ($('.search-bar').is(':visible')) {
          this._hideSearchBar(event);
          this._hideSearchPanel(event);
        }
      }, this));
    },
    focusedOnSearchInput: function (event) {
      if (this.skipShowingDropdown || this._isDropdownVisible()) {
        this.skipShowingDropdown = false;
        return;
      } else {
        event.preventDefault();
        this._dataSynced();
        this.$el.addClass('csui-search-expanded');
        this.ui.input.prop('tabindex', 0);
        this.$el.addClass('csui-searchbox-ready');
        if (!(this.searchboxModel && this.searchboxModel.fetched)) {
          this.listenTo(this.searchboxModel, "change", function () {
            this.showSearchForms();
            this.showSlices();
            if (document.querySelector('.csui-search.search-input-open') &&
                this.applicationScope.get('id') !== 'search'
                && $(document.activeElement)[0] === this.ui.input[0]) {
              this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
            }
          });

          this._updateInput();

          if (this.options.data.showOptionsDropDown) {
            if (!this.searchboxModel.get('slices')) {
              this.prepareSlicePopover();
            }
            if (!this.searchboxModel.get('search_forms_slice')) {
              this.prepareSearchFormsPopover();
            }
          }
        } else {
          this.showSearchForms();
          this.showSlices();
          this.closeDropdown = false;
          if ($(document.activeElement)[0] === this.ui.input[0]) {
            this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
          }
        }
      }
    },

    searchIconClicked: function (event) {
      this._dataSynced();
      this.$el.parent().addClass("search-input-open");
      this.ui.searchIcon.attr('aria-expanded', 'true');
      var searchBoxOptions = this.$el.find('.csui-searchbox-option')[0];
      $(document).on('click.' + this.cid + ' keydown.' + this.cid, this, this._hideSearchBar);
      this.resetPageDefaults(event);
      if (this.options.data.showOptionsDropDown && !!searchBoxOptions) {
        this.searchboxModel.nodeId !== undefined ?
          (this.$el.find('.csui-searchbox-option')[0].checked = this.options.data.searchFromHere) :
          "";
      }
      if ($('.search-bar').is(':visible')) {
        var value = this.ui.input.val().trim();
        if (!!value) {
          this._setInputValue(value);
          $(event.currentTarget).attr("title", lang.startSearch);
          $(event.currentTarget).attr("aria-label", lang.startSearch);
          this.trigger("hide:breadcrumbspanel");
        }
        var searchOption = "",
          _selOption = this.$el.find(".csui-searchbox-option.selected");
        if (this.options.data.showOptionsDropDown) {
          if (!!_selOption) {
            searchOption = _selOption.val();
          }
        } else {
          searchOption = this.options.data.nodeId;
        }

        if (!!history.state && !!history.state.search) {
          this.previousState = history.state.search;
        }
        if (!!value) {
          this._setSearchQuery(value, this.options.sliceString, searchOption, event);
          this._updateInput();
          if (!this.options.data.searchFromHere) {
            $(this.ui.dropDown).addClass('csui-selected-checkbox-hidden');
          }
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown(event);
          }
          this.options.data.searchFromHere = true;

        }
        if (!!this.previousState) {
          this.model["prevSearchState"] = this.previousState;
        }
      } else {
        this.$el.addClass('csui-search-expanded');
        base.onTransitionEnd(this.$el.parent(), function () {
          if (this.isDestroyed) {
            return;
          }
          this.skipShowingDropdown = true;
          this.ui.input.trigger('focus');
          this.ui.input.prop('tabindex', 0);
          this.$el.addClass('csui-searchbox-ready');
          if (!(this.searchboxModel && this.searchboxModel.fetched)) {
            this.listenTo(this.searchboxModel, "change",function () {
              this.showSearchForms();
              this.showSlices();
              if (document.querySelector('.csui-search.search-input-open') &&
                  this.applicationScope.get('id') !== 'search'
                  && $(document.activeElement)[0] === this.ui.input[0]) {
                this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
              }
            });
          } else {
            this.showSearchForms();
            this.showSlices();
            this.closeDropdown = false;
            if ($(document.activeElement)[0] === this.ui.input[0]) {
              this.options.data.showOptionsDropDown && this.showOptionsDropdown(event);
            }
          }
        }, this);
        this._updateInput();
        $(".binf-navbar-brand").removeClass("binf-navbar-collapse");
        if (this.options.data.showOptionsDropDown) {
          if (!this.searchboxModel.get('slices')) {
            this.prepareSlicePopover();
          }
          if (!this.searchboxModel.get('search_forms_slice')) {
            this.prepareSearchFormsPopover();
          }
        }
        if (this.model.attributes.where === "") {
          event.currentTarget.title = "";
          $(event.currentTarget).addClass(this.options.data.customSearchIconNoHoverClass);
        }
      }
    },

    inputTyped: function (event) {
      var value = this.ui.input.val().trim();
      if (event.which === 13) {
        event.preventDefault();
        event.stopPropagation();
        this._setInputValue(value);
        if (!!value) {
          this.closeDropdown = true;
          this.searchIconClicked(event);
        } else {
          this.closeDropdown = false;
        }
        if (this.previousValue != value) {
          this.previousValue = value;
        }
      } else if (event.which === 27) {
        event.preventDefault();
        event.stopPropagation();
        this._hideSearchPanel(event);        
      } else {
        this.closeDropdown = false;
        if (event.which === 9 && this._isDropdownVisible() && !event.shiftKey) {
          if (this.$el.find('.csui-selected-checkbox').is(':visible')) {
            this.$el.find('.csui-selected-checkbox').attr('tabindex', '0').addClass('active');
            this.$el.find('.csui-selected-checkbox input[type="checkbox"]')[0].focus();
          } else {
            var slices = this.$el.find('.csui-search-popover-row-body');
            $(slices[0]).addClass('active');
            $(slices[0]).find('input[type="radio"]').trigger('focus');
          }
          event.preventDefault();
        }
        else if (event.shiftKey && event.key === 'Tab') {
          this.$el.find('.active').removeClass('active');
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown(event);
          }
        }
        else {
          this.inputChanged(event);
        }
      }
    },

    inputChanged: function (event) {
      var value = this.ui.input.val();
      this.ui.clearer.prop('tabindex', value !== '' ? 0 : -1);
      this.ui.formfieldSearch.prop('tabindex', value !== '' ? 0 : -1);
      this.ui.clearer.toggle(!!value.length);
      this.ui.innerSeparator.toggle(!!value.length);
      this.ui.formfieldSearch.toggle(!!value.length);
      if (event.keyCode === 13 && !!value) {
        if (!!value) {
          this.closeDropdown = true;
        } else {
          this.closeDropdown = false;
        }
      }
      if (this.options.data.showOptionsDropDown) {
        this.showOptionsDropdown(event);
      }
    },

    inputClicked: function (event) {
      if (!!this.closeDropdown) {
        this.closeDropdown = false;
      }
      this.hidePopover(event);
    },

    showOptionsDropdown: function (event) {
      this.hideBackButton = true;
      if (!this._isDropdownVisible()) {
        if (this.options.data.showOptionsDropDown) {
          var _e = event || window.event,
            slices = this.getSlices(),
            collection = slices && slices.length > 3 ? this._createSliceCollection(slices.slice(0, 3)) : this._createSliceCollection(slices);
          if (!this.searchboxModel.nodeId || (this.applicationScope.get('id') === 'search' &&
            $(this.ui.dropDown).hasClass('csui-selected-checkbox-hidden'))) {
            this.$el.find('.csui-selected-checkbox').addClass('binf-hidden');
            $(this.ui.dropDown).addClass('csui-selected-checkbox-hidden');
          } else {
            $(this.ui.dropDown).removeClass('csui-selected-checkbox-hidden');
          }
          if (_e.keyCode !== 27 && (!this.closeDropdown)) {
            $(this.ui.dropDown).removeClass('binf-hidden');
            if (this.$el.find('.csui-selected-checkbox').is(':visible')) {
              this.$el.find('.csui-searchbox-option')[0].checked = this.options.data.searchFromHere;
            }
            if (!$(document.body).hasClass('binf-modal-open')) {
              $(document.body).addClass('binf-search-box-open');
              $(document).find('.csui-navbar.binf-navbar').addClass('masked');
              if (!$(document).find('.search-box-widget-mask').length) {
                var compositeMask =  document.createElement('div');
                compositeMask.className = 'search-box-widget-mask';
                $(document.body).find('.binf-widgets').append(compositeMask);
              }
              $(document).find('.csui-navbar.binf-navbar').on(' keydown.',this.handleKeydownNavbar);
            }
          }
          if (this.options.data.searchFromHere) {
            this.$el.find('.csui-searchbox-option').addClass('selected');
            this.$el.find('.csui-icon').addClass('icon-listview-checkmark');
            this.$el.find('.csui-icon').addClass('icon-checkbox-selected');
          }
          if (slices) {
            if (this.searchboxModel.get('slices').more) {
              this.$el.find('.csui-slices-more').removeClass('binf-hidden');
            }
            this.searchSlicesListView = new SearchSlicesListView({
              originatingView: this,
              collection: collection
            });
          }
          if (this.$el.find('.csui-search-form-collection').length) {
            this.$el.find('.csui-search-form-collection').removeClass('binf-hidden');
          }
          this.showSearchForms();
          this.showSlices();
        }
      }
      this.ui.dropDownWrapperClass.scrollTop(this.ui.dropDownWrapperClass.position().top);
      this.trigger('ensure:scrollbar');
    },

    prepareOptionsdropdown: function (e) {
      if (this.options.data.showOptionsDropDown) {
        if (!this.searchboxModel.nodeId) {
          var currentNode = _.has(this.options, 'context') && this.options.context.getModel(NextNodeModelFactory);
          if (currentNode && currentNode instanceof NodeModel &&
            currentNode.get('container')) {
            this.searchboxModel.nodeId = currentNode.get('id');
            this.searchboxModel.nodeName = currentNode.get('name');
            this.namedSessionStorage.set(this.searchboxModel.nodeId, this.searchboxModel.nodeName);
          }
        }
        if (!this.searchboxModel.nodeId && this.model.get('location_id1')) {
          this.searchboxModel.nodeId = this.model.get('location_id1');
          if (!!this.namedSessionStorage.get(this.searchboxModel.nodeId)) {
            this.searchboxModel.nodeName = this.namedSessionStorage.get(this.searchboxModel.nodeId);
          }
        }
        this.searchOptions = {};
        if (this.searchboxModel.nodeId) {
          this.searchOptions.nodeId = this.searchboxModel.nodeId;
          this.searchOptions.nodeIdSO = _.uniqueId('csui-so-' + this.searchboxModel.nodeId);
          if (!this.searchboxModel.nodeName && this.options.data.nodeName) {
            this.searchboxModel.nodeName = this.options.data.nodeName;
          }
          if (this.searchboxModel.nodeName) {
            this.searchOptions.nodeName = " (" + this.searchboxModel.nodeName + ")";
          }
          this.searchOptions.select = lang.searchOptionsSelect;
          this.searchOptions.fromHere = lang.searchFromHere;
          this.searchOptions.checked = this.options.data.searchFromHere ? 'checked' : '';
        }
        if (!!this.searchboxModel.get('slices')) {
          this.searchOptions = _.extend(this.searchOptions, this.searchboxModel.attributes);
          this.searchOptions.slices.searchWithinLabel = lang.searchWithinLabel;
          this.searchOptions.slices.showMore = lang.showMore;
          this.searchOptions.slices.showMoreAria = lang.showMoreAria;
          this.searchOptions.slices.more = this.searchOptions.slices.length > 3 ? true : false;
        }
        var content = this.sliceDropDownTemplate(this.searchOptions);
        this.ui.dropDownWrapperClass.html(content);
        if (this.searchOptions.fromHere) {
          this.$el.find('.csui-searchbox-option').addClass('selected');
          this.$el.find('.csui-icon').addClass('icon-listview-checkmark icon-checkbox-selected');
          this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', true);
        }
      }
    },

    destroyOptionspopover: function (e) {
      this.ui.dropDown.html("");
      this.ui.dropDown.addClass('binf-hidden');
    },

    selectSearchOption: function (e) {
      if (e.type === "keydown" && (e.keyCode === 13 || event.keyCode === 32)) {
        this.$el.find('.csui-selected-checkbox').attr('tabindex', '0').addClass('active');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').trigger('focus');
      } else if (e.type === "click") {
        this.$el.find('.active').removeClass('active');
        this.$el.find('.csui-selected-checkbox')
          .attr('tabindex', '0').removeClass('active').trigger('focus');
      }
      if (!this.options.data.searchFromHere) {
        this.options.data.searchFromHere = true;
        this.$el.find('.csui-searchbox-option').addClass('selected');
        this.$el.find('.csui-icon').addClass('icon-listview-checkmark');
        this.$el.find('.csui-icon').addClass('icon-checkbox-selected');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', true);
      } else {
        this.options.data.searchFromHere = false;
        this.$el.find('.csui-searchbox-option').removeClass('selected');
        this.$el.find('.csui-icon').removeClass('icon-listview-checkmark');
        this.$el.find('.csui-icon').removeClass('icon-checkbox-selected');
        this.$el.find('.csui-selected-checkbox input[type="checkbox"]').attr('aria-checked', false);
      }
    },


    handleSelectCheckbox: function (e) {
      if (e.keyCode === 40) {
        var elms = this.$el.find('.csui-search-popover-row-body'),
          index = elms.index(elms.filter('.active'));
        index = (index >= 0) ? index : 0;
        $(elms[index]).attr('tabindex', 0);
        $(elms[index]).addClass('active');
        $(elms[index]).find('input[type="radio"]')[0].focus();
      }
    },

    hideSearchOptionsDropDown: function (event) {
      var that = this;
      if (that.$el.find('.csui-searchbox-option')[0] === document.activeElement) {
        return false;
      } else if (that.options.data.showOptionsDropDown) {
        var self = that;
        self.showSearchOptionDropDown(event);
        return true;
      }
    },

    showSearchOptionDropDown: function (event) {
      if (this.options.data.showOptionsDropDown) {
        if (!(this.ui.dropDown.is(":hover")) || event.type === 'click') {
          this.ui.dropDown && this.ui.dropDown.addClass('binf-hidden');
          if ($(document.body).hasClass('binf-search-box-open')) {
            $(document.body).removeClass('binf-search-box-open');
            $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
            $(document.body).find('.search-box-widget-mask').remove();
            $(document).find('.csui-navbar.binf-navbar').off(' keydown.', this.handleKeydownNavbar);
          }
        } else if (this.popoverTimer) {
          clearTimeout(this.popoverTimer);
        }
      }
    },

    keyDownOnClear: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.clearerClicked(event);
      }
    },
    clearerClicked: function (event) {
      event.preventDefault();
      event.stopPropagation();

      this._setInputValue('');
      this.hidePopover(event);
      this.ui.input.trigger('focus');
    },

    keyDownOnFormfieldSearch: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.formfieldSearchClicked(event);
      }
    },
    formfieldSearchClicked: function (event) {
      this.searchIconClicked(event);
    },

    _setSearchQuery: function (value, sliceString, searchOption, event) {
      this.model.clear({ silent: true });
      var params = {};
      if (!!sliceString) {
        params['slice'] = sliceString;
      }
      if (!!searchOption) {
        params['location_id1'] = searchOption;
      }
      if (value) {
        params['where'] = value;
      }
      var full_text = this.search_bar_settings && this.search_bar_settings.full_text;
      if (full_text && (full_text.modifier || full_text.lookfor)) {
        params['modifier'] = full_text.modifier;
        params['lookfor'] = full_text.lookfor;
      }
      this.model.set(params);
    },

    getSlices: function () {
      var selectedSlice, slices,
          selectedSliceId = this.options.model && this.options.model.get("slice") ? this.options.model.get("slice") :
                            this.namedLocalStorage.get('selectedSlice');
      this.options.sliceString = selectedSliceId;
      if (selectedSliceId) {
        slices = _.filter(this.searchboxModel.get('slices'), function (item) {
          if (item.sliceId != selectedSliceId.substring(1, selectedSliceId.length - 1)) {
            return true;
          } else {
            selectedSlice = item;
          }
        });
      }
      else {
        slices = this.searchboxModel.get('slices');
      }
      selectedSlice && slices.unshift(selectedSlice);
      return slices;
    },

    showMore: function () {
      var collection = this._createSliceCollection(this.getSlices());
      this.searchSlicesListView = new SearchSlicesListView({
        originatingView: this,
        collection: collection
      });
      this.$el.find('.csui-slices-more').addClass('binf-hidden');
      this.showSlices();
      $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body input[type="radio"]')[3])[0].focus();
      this.trigger('ensure:scrollbar');
    },

    _handleSlicesShowMore: function (event) {
      switch (event.keyCode) {
        case 27:
          if (this.options.data.showOptionsDropDown) {
            this.hideSearchOptionsDropDown();
          }
          break;
        case 32: this.showMore();
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[3]).addClass('active');
          break;
        case 13: this.showMore();
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[3]).addClass('active');
          break;
        case 9: if (event.shiftKey) {
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
          $(this.searchSlicesListView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
        } else {
          if (this.searchFormsContainerView.$el.find('.csui-searchforms-popover-row').length) {
            this.searchFormsContainerView.$el.find('.csui-searchforms-popover-row')[0].focus();
          }
          else {
            this.searchFormsContainerView.$el.find('.csui-searchforms-show-more')[0].focus();
          }
        }
          break;
      }
      event.preventDefault();
    },

    openSearchForm: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
        if (this.$el.find('.csui-searchforms-popover-row').hasClass('binf-disabled')) {
          return;
        }
        this.$el.find('.csui-searchforms-popover-row').addClass('binf-disabled');
        this.hideSearchOptionsDropDown(event);
        var id = $(event.currentTarget).data("searchformid");
        if (id === "loadAllForms") {
          this.hideBackButton = false;
          this.searchForms.isKeyPress = event.keyCode === 13 || event.keyCode === 32;
          this.searchForms.openFormInSidepanel(this.searchboxModel.get('search_forms'));
        }
      } else if (event.keyCode === 9) {
        event.preventDefault();
        if (event.shiftKey) {
          if (this.$el.find('.csui-searchforms-popover-row').length) {
            var self = this;
            setTimeout(function () {
              self.$el.find('.csui-searchforms-popover-row')[0].focus();
            }, 0);
          } else if (!this.$el.find('.csui-slices-more').hasClass('binf-hidden')) {
            this.$el.find('.csui-slices-more').focus();
          } else if (this.$el.find('.csui-search-popover-row-body').length) {
            $(this.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
            $(this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0]).focus();
          } else if (this.ui.input) {
            this.ui.input.trigger('focus');
          }
        }
        else{
          this.hideSearchOptionsDropDown();
          if(this.$el.find('.csui-clearer').is(':visible'))
          {
            this.$el.find('.csui-clearer').focus();
          }else{
            this.$el.find('.csui-header-search-icon').focus();
          }
        }
      }
     else if(event.keyCode === 27 && this.options.data.showOptionsDropDown){
        this.hideSearchOptionsDropDown();
     }
    },

    _hideSearchPanel: function (event) {
      event.data = event.data || this;
      var _e              = event || window.event,
          ele             = $('.search-bar'),
          self            = event.data,
          searchContainer = self.$el.parent();
      $(document).find("." + event.data.options.data.customSearchIconNoHoverClass).removeClass(
          event.data.options.data.customSearchIconNoHoverClass);
      $(document).find('.csui-input').val('');
      searchContainer.removeClass('search-input-open');
      base.onTransitionEnd(searchContainer, function () {
        self.options.parentView && self.options.parentView.trigger("render:controls");
        if (this.isDestroyed) {
          return;
        }
        $(".binf-navbar-brand").addClass("binf-navbar-collapse");
        self.$el.removeClass('csui-searchbox-ready').removeClass('csui-search-expanded');
      }, this);

      $(document).find('.csui-search-box .csui-header-search-icon')[0].title = lang.searchIconTitle;
      $($(document).find('.csui-search-box .csui-header-search-icon')[0]).attr("aria-label",
          lang.searchIconTitle);
      $($(document).find('.csui-search-box .csui-header-search-icon')[0]).attr("aria-expanded",
          'false');
      event.data.slice = event.data.model.get('slice');
      event.data.ui.dropDown.addClass('binf-hidden');
      if ($(document.body).hasClass('binf-search-box-open')) {
        $(document.body).removeClass('binf-search-box-open');
        $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
        $(document.body).find('.search-box-widget-mask').remove();
        $(document).find('.csui-navbar.binf-navbar').off(' keydown.', this.handleKeydownNavbar);
      }
      $(document).find('.csui-search-box .csui-header-search-icon').removeClass(
          event.data.options.data.customSearchIconCloseClass).addClass(
          event.data.options.data.customSearchIconClass);

      $(document).off('click.' + this.cid + ' keydown.' + this.cid);

      var view = event.data;
      view.trigger("hide:searchbar");
      $('.csui-input').prop('tabindex', -1);
      self.$el.find('.active').removeClass('active');
      _.isObject(self.ui.searchIcon) && self.ui.searchIcon.trigger('focus');
    },
    _isDropdownVisible: function () {
      return this.ui.dropDown.is(':visible');
    },

    _hideSearchBar: function (event) {
      event.data = event.data || this;
      var _e = event || window.event,
        ele = $('.search-bar'),
        self = event.data,
        searchContainer = self.$el.parent(),
        value = self.ui.input.val().trim(),
        searchOptionsDropdown = ele.find('.csui-search-options-dropdown');
      if (searchContainer.hasClass('search-input-open') &&
        (value) &&
        !$(event.target).is('.csui-input') &&
        self._isDropdownVisible() &&
        searchOptionsDropdown.find(event.target).length === 0) {
        searchOptionsDropdown.addClass('binf-hidden');
        $(document).find('.csui-navbar.binf-navbar').removeClass('masked');
        $(document.body).find('.search-box-widget-mask').remove();
      } else {
        if (self.applicationScope.get('id') !== "search" && ele.is(':visible') || $(event.target).find('.search-input-open').length ||
            $(event.target).siblings().find('.search-input-open').length || $(event.target).hasClass('search-input-open')) {
          if ((_e.type === 'keydown' && (_e.keyCode === 27 || _e.which === 27) &&
            !$('.search-bar-content .binf-popover').is(":visible")) ||
            (!$(_e.target).closest(ele).length &&
              _e.type === 'click') && (!$(_e.target).closest('.csui-header-search-icon').length) &&
            !$(_e.target).closest('.esoc-activityfeed-invisiblebutton').length) {
              self._hideSearchPanel(event);
          }
        }
      }
    },

    _updateInput: function () {
      if (this._isRendered) {
        var value = this.model.get('where') || '';
        this._setInputValue(value);
      }
    },

    _setInputValue: function (value) {
      this.ui.input.val(value);
      this.ui.clearer.toggle(!!value.length);
      this.ui.innerSeparator.toggle(!!value.length);
      this.ui.formfieldSearch.toggle(!!value.length);
      if (this.options.data.showOptionsDropDown) {
        this.options.data.nodeName = this.searchboxModel.nodeName;
      }
    },

    searchIconToClose: function () {
      _.isObject(this.ui.searchIcon) && this.ui.searchIcon.hasClass(this.options.data.customSearchIconClass) && this.ui.searchIcon.removeClass(this.options.data.customSearchIconClass).addClass(
        this.options.data.customSearchIconCloseClass);
      this.ui.input.addClass("csui-input-focus");
      $(this.ui.searchIcon).attr("title", lang.closeSearch);
      $(this.ui.searchIcon).attr("aria-label", lang.closeSearch);
      $(this.ui.searchIcon).removeClass(this.options.data.customSearchIconNoHoverClass);
    }
  });

  return SearchBoxView;

});
