csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'conws/widgets/team/impl/controls/rolepicker/impl/role.view',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/controls/rolepicker/impl/rolepicker',
  'hbs!conws/widgets/team/impl/controls/rolepicker/impl/rolepicker.clear',
  'hbs!conws/widgets/team/impl/controls/rolepicker/impl/rolepicker.input',
  'css!conws/widgets/team/impl/controls/rolepicker/impl/rolepicker',
  'csui/lib/bootstrap3-typeahead'
], function (_, $, Marionette, base, TabableRegionBehavior, LayoutViewEventsPropagationMixin,
    RoleView, lang, tplRolePicker, tplClear, tplInput) {

  var RolePickerSearch = Marionette.ItemView.extend({

    template: tplInput,

    templateHelpers: function () {
      return {
        placeholder: this.options.placeholder
      };
    },

    ui: {
      searchbox: '.typeahead.cs-search'
    },

    events: {
      'keydown @ui.searchbox': 'onKeyDown',
      'keyup @ui.searchbox': 'onKeyUp',
      'dragstart .typeahead.binf-dropdown-menu li > a': 'onDragRole'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    triggers: {
      'click @ui.searchbox': 'click',
      'focus @ui.searchbox': 'focus'
    },

    constructor: function RolePickerSearch(options) {
      options || (options = {});

      // initialize options
      options.delay || (options.delay = 200);
      options.minLength || (options.minLength = 0);
      options.placeholder || (options.placeholder = lang.addParticipantsRolePickerPlaceholder);
      options.roles || (options.roles = []);
      options.prettyScrolling || (options.prettyScrolling = false);
      if (options.showInherited === undefined) {
        options.showInherited = true;
      }
      // sort roles
      options.roles.comparator = function (left, right) {
        return base.localeCompareString(left.get('name'), right.get('name'));
      };
      options.roles.sort();

      this.rolePicked = true;
      // apply marionette item view
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      // listen to change of 'clearInput'
      this.listenTo(options.view, 'clearInput', this.clear);
    },

    onRender: function () {
      // initialize typeahead control
      this.$('input.typeahead').typeahead({
        items: 'all',
        afterSelect: _.bind(this._afterSelect, this),
        highlighter: _.bind(this._renderHighlighter, this),
        delay: this.options.delay,
        displayText: this._retrieveDisplayText,
        matcher: this._matcher,
        afterHide: _.bind(this._afterHide, this),
        nextHighlighter: _.bind(this._nextHighlighter, this),
        accessbility: _.bind(this._accessbility, this),
        currentHighlighter: _.bind(this._currentHighlighter, this),
        sorter: this._sorter,
        minLength: this.options.minLength,
        source: _.bind(this._source, this),
        prettyScrolling: this.options.prettyScrolling,
        appendTo: this.$el,
        afterShow: _.bind(this._positionContainer, this)
      });
      this.ui.searchbox.append(this.options.$el);
    },

    onClick: function (e) {
      // show roles
      this.ui.searchbox.trigger('focus');
      this.ui.searchbox.typeahead('lookup', this.ui.searchbox.val());
    },

    onKeyUp: function (e) {
      var fldVal = this.ui.searchbox.val();
      if (fldVal.length === 0 && (e.keyCode === 13 || e.keyCode === 32 || e.keyCode === 46)) {
        this.rolePicked = false;
      } else {
        this.rolePicked = true;
        // update styles
        this.options.view.filterLength = this.ui.searchbox.val().length;
        this.options.view.trigger('updateStyles');
      }
    },

    onKeyDown: function (e) {
      if (e.keyCode === 9) {
        // update styles
        this.options.view.filterLength = this.ui.searchbox.val().length;
        this.options.view.trigger('updateStyles');
        // suppress afterselect handler by hiding the typeahead dropdown
        this.ui.searchbox.typeahead('hide');
      }
    },

    // disable role dragging
    onDragRole: function (e) {
      return false;
    },

    isTabable: function () {
      // in case of error, this is called during destroy and searchbox is a selector string, not a jquery element.
      return $(this.ui.searchbox).is(':not(:disabled)') && $(this.ui.searchbox).is(':not(:hidden)') &&
             $(this.ui.searchbox).is(':visible');
    },

    clear: function () {
      this.ui.searchbox.val('');
      this.ui.searchbox.trigger('focus');
      this.ui.searchbox.typeahead('lookup', this.ui.searchbox.val());
    },

    currentlyFocusedElement: function () {
      return this.ui.searchbox;
    },

    _source: function (query) {
      // prepare collection
      var ret = [];
      if (this.rolePicked  && this.options.roles !== undefined) {
        if (this.options.showInherited) {
          ret = this.options.roles.models;
        } else {
          ret = this.options.roles.filter(function (role) {
            return !role.get('inherited_from_id');
          });
        }
      }
      return ret;
    },

    _matcher: function (item) {
      var it = item.get('name');
      return ~it.toLowerCase().indexOf(this.query.toLowerCase());
    },

    _sorter: function (items) {
      return items;
    },

    _retrieveDisplayText: function (item) {
      return item.get('name');
    },

    _afterSelect: function (item) {
      // update text and trigger change
      this.ui.searchbox.val('');
      // update styles
      this.options.view.filterLength = this.ui.searchbox.val().length;
      this.options.view.trigger('updateStyles');
      // trigger change
      this.options.view.trigger('item:change', {
        item: item
      });
    },

    _renderHighlighter: function (item) {
      var model = this.options.roles.findWhere({name: item});
      // create view ...
      var view = new RoleView({
        model: model,
        connector: this.options.roles.connector
      });
      // ... and render
      return view.render().el;
    },

    _positionContainer: function (context) {
      var addParticipantsContainer = context.$element.closest(".conws-addparticipants-members"),
        scrollableDropdownContainer = context.$scrollContainer;

      if (addParticipantsContainer.length && !!scrollableDropdownContainer) {
        var elemBoundingRect = context.$element[0].getBoundingClientRect(),
          targetEleTopHeight = elemBoundingRect.top - addParticipantsContainer.offset().top,
          targetEleBottomHeight = addParticipantsContainer.height() - (targetEleTopHeight + elemBoundingRect.height),
          scrollContainerHeight = context.$menu[0].offsetHeight,
          isDropdownShownOnTop = targetEleTopHeight > targetEleBottomHeight;

        if (isDropdownShownOnTop) {
          var spaceOnTop = scrollContainerHeight > targetEleTopHeight ? Math.abs(targetEleTopHeight * 0.9) : scrollContainerHeight;
          scrollableDropdownContainer.css({
            'max-height': spaceOnTop + 'px',
            'top': (-spaceOnTop) + 'px'
          });
        } else {
          var spaceOnBottom = Math.abs(targetEleBottomHeight * 0.9) + 'px';
          scrollableDropdownContainer.css({
            'max-height': spaceOnBottom,
            'top': elemBoundingRect.height + 'px'
          });
        }
      }
    },

    _afterHide: function() {
      return;
    },

    _currentHighlighter: function (item) {
      return;
    },

    _nextHighlighter: function (item) {
      return;
    },

    _accessbility: function(item) {
      return;
    }
  });

  var RolePickerClear = Marionette.ItemView.extend({

    template: tplClear,

    templateHelpers: function () {
      return {
        clearValue: lang.addParticipantsRolePickerClear
      };
    },

    ui: {
      searchclear: '.typeahead.cs-search-clear'
    },

    events: {
      'click @ui.searchclear': 'onClickClear',
      'keyup @ui.searchclear': 'onClearKeyUp'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function RolePickerClear(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      // listen to change of 'updateStyles'
      this.listenTo(options.view, 'updateStyles', this.updateStyles);
    },

    onClickClear: function (e) {
      // clear the search, update styles ...
      this.updateStyles();
      // and open unfiltered
      this.options.view.trigger('clearInput');
    },

    onClearKeyUp: function (e) {
      if (e.keyCode === 13 || e.keyCode === 32) {
        // clear the search, update styles ...
        this.updateStyles();
        // and open unfiltered
        this.options.view.trigger('clearInput');
      }
    },
    // switch the clear button depending on the text value.
    updateStyles: function () {
      var clear = this.options.view.filterLength > 0;
      this.ui.searchclear.css({
        'display': clear ? '' : 'none'
      }).attr('tabindex', 0)
    },

    isTabable: function () {
      // in case of error, this is called during destroy and searchclear is a selector string, not a jquery element.
      return $(this.ui.searchclear).is(':not(:disabled)') && $(this.ui.searchclear).is(':not(:hidden)') &&
             $(this.ui.searchclear).is(':visible');
    },

    currentlyFocusedElement: function () {
      return this.ui.searchclear;
    }
  });

  var RolePickerView = Marionette.LayoutView.extend({

    tagName: 'div',

    className: 'conws-control-rolepicker',

    template: tplRolePicker,

    templateHelpers: function () {
      return {
        showValues: lang.addParticipantsRolePickerShow
      };
    },

    ui: {
      rolepicker: 'div.conws-control-rolepicker',
      searchicon: '.typeahead.cs-search-icon',
      searchbox: '.search-input',
      searchclear: '.search-clear'
    },

    regions: {
      searchRegion: '@ui.searchbox',
      clearRegion: '@ui.searchclear'
    },

    triggers: {
      'click @ui.searchicon': 'click'
    },

    constructor: function RolePickerView(options) {
      options || (options = {});

      this.filterLength = 0;
      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      // listen to change the focus
      this.listenTo(this, 'updateFocus', this.updateFocus);
      // propagate events to regions
      this.propagateEventsToRegions();
    },

    onRender: function () {
      // render the filter elements if active
      var searchView = this.searchView;
      if (searchView) {
        this.searchRegion.show(searchView);
      } else {
        searchView = this.searchView = new RolePickerSearch(
            $.extend({}, this.options, {
              view: this
            }));
        this.searchRegion.show(searchView);
      }
      // clear button
      this.clearView = new RolePickerClear(
          $.extend({}, this.options, {
            view: this
          }));
      this.clearRegion.show(this.clearView);
      // update styles
      this.clearView.updateStyles();
    },

    onClick: function (e) {
      // show roles
      this.updateFocus();
      this.searchView.$('input.typeahead').typeahead('lookup', this.ui.searchbox.val());
    },

    updateFocus: function(){
      // show roles
      this.searchView.currentlyFocusedElement().trigger('focus');
    }

  });
  // add event propagation mixin
  _.extend(RolePickerView.prototype, LayoutViewEventsPropagationMixin);
  
  return RolePickerView;
});
