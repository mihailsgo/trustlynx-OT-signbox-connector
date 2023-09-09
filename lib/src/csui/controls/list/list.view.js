/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/base', 'csui/controls/list/emptylist.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior', 'i18n',
  'hbs!csui/controls/list/impl/list', 'i18n!csui/controls/list/impl/nls/lang',
  'css!csui/controls/list/impl/list', 'csui/lib/jquery.ui/js/jquery-ui'
], function (_, $, Marionette, base, EmptyListView,
    PerfectScrollingBehavior, i18n, listTemplate, lang) {

  var ListItemView = Marionette.ItemView.extend({

    constructor: function ListItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }

  });

  var ListView = Marionette.CompositeView.extend({

    direction: !!i18n.settings.rtl ? 'right' : 'left',

    constructor: function ListView(options) {
      options || (options = {});
      _.defaults(options, {
        filterValue: ''
      });
      if (!(this.behaviors && _.any(this.behaviors, function (behavior, key) {
            return behavior.behaviorClass === PerfectScrollingBehavior;
          }))) {
        this.behaviors = _.extend({
          PerfectScrolling: {
            behaviorClass: PerfectScrollingBehavior,
            contentParent: '> .tile-content',
            suppressScrollX: true,
            scrollYMarginOffset: 15
          }
        }, this.behaviors);
      }

      Marionette.CompositeView.prototype.constructor.call(this, options);
      var th = this.templateHelpers(),
          currentListTitle = !!th && !!th.title ? th.title.toLowerCase() :
                             !!options && !!options.data && !!options.data.title ? options.data.title : '',
          messages         = {
            'title': currentListTitle,
            'expandTitle': lang.expandView,
            'expandAria': _.str.sformat(lang.expandAria, currentListTitle),
            'searchTooltip': lang.searchView,
            'searchCloseTooltip': lang.collapseSearch,
            'searchAria': _.str.sformat(lang.searchAria, currentListTitle),
            'searchCloseAria': lang.collapseAria,
            'collapseSearchTooltip': lang.collapseSearch,
            'openPerspectiveAria': lang.openPerspective,
            'openPerspectiveTooltip': lang.openPerspectiveTooltip
          };
      this.templateHelpers = _.defaults(th, messages, lang);
      this.listenToOnce(this.collection, "sync",function() {
        this.$el.removeClass("initialLoading");
      });

      this.listenToOnce(this.collection, "error", _.bind(this.handleError, this));
      this.listenToOnce(this.completeCollection, "error", _.bind(this.handleError, this));
      this.listenTo(this, 'doc:preview:generic:actions', this._highlightRow);
    },

    handleError: function () {
      this.errorExists = true;
      this.$el.addClass('csui-list-view-error');
    },

    templateHelpers: function () {
    },

    setValidator: function () {
      this.validator = setInterval(_.bind(this.validateInput, this), 10);
    },

    unsetValidator: function () {
      clearInterval(this.validator);
    },

    className: 'cs-list tile content-tile initialLoading',
    template: listTemplate,

    childViewContainer: '.binf-list-group',
    childView: ListItemView,
    childViewOptions: function () {
      return {
        template: this.options.childViewTemplate
      };
    },

    emptyView: EmptyListView,

    ui: {
      placeholderSearchIcon: '.icon-search-placeholder',
      headerTitle: '.tile-title',
      tileIcon: '.tile-icons',
      searchIcon: '.cs-search-icon',
      searchButton: '.cs-search-button',
      searchCloseButton: '.cs-search-close-button',
      searchBox: '.search-box',
      searchInput: '.search',
      clearer: '.clearer',
      tileExpand: '.tile-expand',
      fadeout: '.fadeout',
      tileHeader: '.tile-header',
      openPerspectiveButton: '.cs-open-perspective-button',
      openPerspectiveIcon: '.icon-perspective-open',
      tileControls: '.tile-controls'
    },

    events: {
      'keydown': 'onKeyDown'
    },

    triggers: {
      'click .tile-header': 'before:click:header',
      'click @ui.openPerspectiveButton': 'click:open:perspective'
    },
      _highlightRow: function (targetNode, HIGHLIGHT_CLASS_NAME) {
        $('.' + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
        var rowIndex =  _.findIndex(this.collection.models, function (node) {
          return node.get('id') === targetNode.get("id");
        });
        if (rowIndex !== -1) {
          var child = this.$childViewContainer;
          var target = child && child.children();
          var targetRow = target && target.eq(rowIndex);
          targetRow && targetRow.addClass(HIGHLIGHT_CLASS_NAME);
        }
      },
    onKeyDown: function (event) {
    },

    onBeforeClickHeader: function () {
      if (this.errorExists) {
        return;
      }
      this.triggerMethod('click:header');
    },

    onRender: function () {
      this.ui.placeholderSearchIcon.hide();
      this.ui.searchInput.hide();
      this.ui.clearer.toggle(false);

      this.ui.placeholderSearchIcon.on('click', _.bind(this.placeholderSearchIconClicked, this));
      this.ui.searchButton.on('click', _.bind(this.searchClicked, this));
      this.ui.searchCloseButton.on('click', _.bind(this.closeSearchClicked, this));
      this.ui.searchBox.on('click', _.bind(this.searchBoxClicked, this));
      this.ui.clearer.on('click', _.bind(this.searchFieldClearerClicked, this));
      this.ui.searchInput.on('input', _.bind(this.searchInput, this));

      this.srOnly = this.$el.find('.tile-content .binf-sr-only');
      this.tileHeader = this.$el.find('.tile-header');

      this.titleId = _.uniqueId("dlgTitle");
      this.$(this.ui.headerTitle).find('.csui-heading').attr('id', this.titleId);
      this.$(this.tileHeader).parent().attr('role', 'region').attr('aria-labelledby', this.titleId);
      this.$el.find('.tile-content').attr('aria-labelledby', this.titleId);
      this.$el.on('focusin', _.bind(this.focusinAria, this));
      this.$el.on('focusout', _.bind(this.focusoutAria, this));

      base.isAppleMobile() === false && this._enableOpenPerspective && this._addActivationEventHandlers();
    },

    _addActivationEventHandlers: function () {
      var el = this.$el;
      el.addClass('cs-no-expanding');
      el.on('mouseover', function () {el.addClass('cs-hover')})
          .on('mouseleave', function () {el.removeClass('cs-hover cs-mousedown')})
          .on('mousedown', function () {el.addClass('cs-mousedown')})
          .on('mouseup', function () {el.removeClass('cs-mousedown')})
          .on('focusin', function () {el.addClass('cs-has-focus')})
          .on('focusout', function () {el.removeClass('cs-has-focus')});

      this.ui.tileHeader.on('mouseover', function () {el.addClass('cs-tile-header-hover')})
          .on('mouseleave', function () {el.removeClass('cs-tile-header-hover')});

    },

    focusOutHandle: undefined,

    focusinAria: function () {
      if (this.focusOutHandle) {
        clearTimeout(this.focusOutHandle.handle);
        this.focusOutHandle = undefined;
      } else {
        this.srOnly.attr('aria-live', 'polite');
        this.setElementsVisibleAria();
      }
    },

    focusoutAria: function () {
      var that = this;
      this.focusOutHandle = setTimeout(function() {
        that.srOnly.attr('aria-live', 'off');
        that.srOnly.html('');
        that.focusOutHandle = undefined;
      }, 25);
    },

    searchBoxClicked: function (event) {
      event.stopPropagation();
    },

    searchFieldClearerClicked: function () {
      this.ui.searchInput.val('');
      this.filterChanged();
      this.ui.searchInput.trigger('focus');
    },

    placeholderSearchIconClicked: function () {
      this.ui.searchInput.trigger('focus');
    },

    isSearchOpen: function () {
      return this.ui.searchInput.is && this.ui.searchInput.is(":visible");
    },

    searchClicked: function (event) {
      this.ui.searchInput.val('');
      this.ui.clearer.toggle(false);

          this.ui.headerTitle.hide();
          this.ui.searchInput.show('blind', {direction: this.direction}, 200,_.bind(function(){
            this.ui.searchInput.prop('tabindex', '0');
            this.ui.searchInput.trigger('focus');
          },this));
          this.setValidator();
          this.ui.placeholderSearchIcon.show('fast');
          this.$(this.ui.searchIcon).addClass('icon-search-hide');
          this.$(this.ui.searchCloseButton).addClass('icon-search-hide');
          this.ui.tileIcon.fadeOut();
          this.ui.tileControls.addClass('search-enabled');
          this.ui.searchCloseButton.fadeIn();
          this.ui.searchCloseButton.prop('tabindex', '0');
          this.ui.fadeout.show(250,_.bind(function(){
            this._resetFilter();
          },this));

      event && event.stopPropagation();
    },

    closeSearchClicked: function (event) {
        this.ui.searchInput.val('');
        this.ui.clearer.toggle(false);
        this.ui.fadeout.hide();
        this.ui.placeholderSearchIcon.hide();
        this.ui.searchCloseButton.fadeOut(_.bind(function(){
          this.ui.tileIcon.fadeIn();
          this.ui.headerTitle.show('fade',_.bind(function(){
            this.ui.searchButton.prop('tabindex', '0');
            this.ui.searchButton.trigger('focus');
            this._resetFilter();
          },this));
        },this));
        this.ui.tileControls.removeClass('search-enabled');
        this.unsetValidator();
        this.$(this.ui.searchIcon).removeClass('icon-search-hide');
        this.$(this.ui.searchCloseButton).removeClass('icon-search-hide');
        this.ui.searchInput.hide('blind', {direction: this.direction}, 200);
      event && event.stopPropagation();
    },

    validateInput: function () {
      if (!this.ui.searchInput.val) {
        return;
      }
      var bIsFilled = this.ui.searchInput.val && !!this.ui.searchInput.val().length;
      this.ui.clearer.toggle(bIsFilled);
      this.ui.clearer.prop('tabindex', bIsFilled ? '0' : '-1');
    },

    searchInput: function (event) {
      if (this.keyInputTimer) {
        clearTimeout(this.keyInputTimer);
      }
      this.keyInputTimer = setTimeout(_.bind(function () {
        this.keyInputTimer = undefined;
        this.filterChanged();
      }, this), 300);
    },

    filterChanged: function () {
      this.options.filterValue = this.ui.searchInput.val();
      this.trigger('change:filterValue');
      this.setElementsVisibleAria();
    },

    setElementsVisibleAria: function () {
      var numElements = this.collection ? this.collection.size() : '0';
      this.srOnly.text(_.str.sformat(lang.elementsVisibleAria, numElements, this.templateHelpers.title));
    },

    _resetFilter: function () {
      this.ui.searchInput.val('');
      this.filterChanged();
    },
    getElementByIndex: function (index) {
      if (isNaN(index) || (index < 0)) {
        return null;
      }
      var targetEle   = this.showInlineActionBar ? 'div.csui-item-standard:nth-child({0})' :
                        'div a:nth-child({0})',
          nthChildSel = _.str.sformat(targetEle, index + 1),
          $item       = this.$(nthChildSel);
      if ($item.length === 0) {
        $item = this._lookForElementToTabTo(index, ['[role="option"] > div:not(.binf-hidden)', '[role="option"]']);
      }
      if ($item) {
        return $($item[0]);
      }
    },

    _lookForElementToTabTo: function (index, selectors) {
      var $item, listElement = this.el;
      selectors && selectors.some(function (selector) {
        var elements = listElement.querySelectorAll(selector);
        if (elements && elements.length > index) {
          return ($item = $(elements[index]));
        }
      });
      return $item;
    }

  });

  return ListView;

});
