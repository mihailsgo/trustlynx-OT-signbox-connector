csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'conws/widgets/team/impl/controls/filter/impl/filter.model',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/controls/filter/impl/filter',
  'hbs!conws/widgets/team/impl/controls/filter/impl/filter.search',
  'hbs!conws/widgets/team/impl/controls/filter/impl/filter.clear',
  'hbs!conws/widgets/team/impl/controls/filter/impl/filter.searchicon',
  'css!conws/widgets/team/impl/controls/filter/impl/filter'
], function (_, $, Marionette, TabableRegionBehavior, LayoutViewEventsPropagationMixin, FilterModel,
    lang, tplView, tplSearch, tplClear, tplIcon) {

  var FilterSearch = Marionette.ItemView.extend({

    template: tplSearch,

    templateHelpers: function () {
      return {
        caption: this.model.get('caption'),
        filter: this.model.get('filter'),
        tooltip: _.str.sformat(lang.searchPlaceholder, this.model.get('tooltip').toLowerCase())
      };
    },

    ui: {
      search: '.search'
    },

    events: {
      'keyup @ui.search': 'onSearchKeyUp'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function FilterSearch(options) {

      // initialize filter model
      if (!options.model) {
        options.model = new FilterModel();
      }

      // apply marionette item view
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      // listen to change of 'showSearch'
      this.listenTo(this.model, 'change:showSearch', this.toggleSearch);
      this.listenTo(this.model, 'change:filter', this.changeFilter);
    },

    onSearchKeyUp: function (e) {
      e.stopPropagation();
      if (e.keyCode === 27) {
        // close filter
        this.model.set('showSearch', !this.model.get('showSearch'));
        this.triggerMethod('close');
      } else {
        // update filter
        this.model.set('filter', this.ui.search.val());
      }
    },

    toggleSearch: function () {
      var self = this;

      var show = self.model.get('showSearch');
      if (show) {
        // open and focus searchbox
        self.ui.search.toggle('slide', {direction: 'right'}, 200, function () {
          self.ui.search.prop('tabindex','0');
          self.trigger('changed:focus', self);
          self.ui.search.trigger('focus');
        });
      } else {
        // clear filter and close searchbox
        self.model.set('filter', '');
        self.ui.search.prop('tabindex','-1');
        self.ui.search.toggle('slide', {direction: 'right'}, 200);
        this.triggerMethod('close');
      }
    },

    changeFilter: function () {
      // update the filter text
      this.ui.search.val(this.model.get('filter'));
    },

    isTabable: function () {
      return this.ui.search.is(':not(:disabled)') && this.ui.search.is(':not(:hidden)') &&
             this.ui.search.is(':visible');
    },

    currentlyFocusedElement: function () {
      return this.ui.search;
    }
  });

  var FilterClear = Marionette.ItemView.extend({

    template: tplClear,

    templateHelpers: function () {
      return {
        tooltip: lang.searchClearIconTooltip
      };
    },

    ui: {
      clear: '.sbclearer'
    },

    events: {
      'click @ui.clear': 'onClearClick',
      'keyup @ui.clear': 'onClearKeyUp'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function FilterClear(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      // listen to change of 'filter'
      this.listenTo(this.model, 'change:filter', this.toggleClear);
    },

    toggleClear: function () {
      var filter = this.model.get('filter');
      if (_.isString(filter) && filter.length !== 0) {
        // show the clear button
        this.ui.clear.prop('tabindex','0');
        this.ui.clear.show();

      } else {
        // hide the clear button
        this.ui.clear.prop('tabindex','-1');
        this.ui.clear.hide();
      }
    },

    onClearClick: function (e) {
      this.model.set('filter', '');
      this.triggerMethod('clear');
    },

    onClearKeyUp: function (e) {
      if (e.keyCode === 13 || e.keyCode === 32) {
        this.model.set('filter', '');
        this.triggerMethod('clear');
      }
    },

    isTabable: function () {
      return this.ui.clear.is(':not(:disabled)') && this.ui.clear.is(':not(:hidden)') &&
             this.ui.clear.is(':visible');
    },

    currentlyFocusedElement: function () {
      return this.ui.clear;
    }
  });

  var FilterIcon = Marionette.ItemView.extend({

    template: tplIcon,

    templateHelpers: function () {
      return {
        tooltip: _.str.sformat(lang.searchIconTooltip, this.model.get('tooltip'))
      }
    },

    ui: {
      icon: '.icon-search'
    },

    events: {
      'click @ui.icon': 'onSearchIconClick',
      'keydown @ui.icon': 'onSearchIconKeyDown'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function FilterIcon(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    onSearchIconClick: function (e) {
      this.model.set('showSearch', !this.model.get('showSearch'));
    },

    onSearchIconKeyDown: function (e) {
      if (e.keyCode === 13 || e.keyCode === 32) {
        this.model.set('showSearch', !this.model.get('showSearch'));
      }
    },

    currentlyFocusedElement: function () {
      return this.ui.icon;
    }
  });

  var FilterView = Marionette.LayoutView.extend({

    template: tplView,

    templateHelpers: function () {
      return {
        caption: this.model.get('caption'),
        active: this.model.get('active')
      };
    },

    ui: {
      label: '.searchtext',
      search: '.filter-search',
      clear: '.filter-clear',
      icon: '.filter-icon'
    },

    regions: {
      searchRegion: '@ui.search',
      clearRegion: '@ui.clear',
      iconRegion: '@ui.icon'
    },

    constructor: function FilterView(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      // propagate events to regions
      this.propagateEventsToRegions();

      // listen to change of 'active' and 'showSearch'
      this.listenTo(this.model, 'change:active', this.render);
      this.listenTo(this.model, 'change:showSearch', this.toggleLabel);
      this.listenTo(this, 'updateFocus', this.updateFocus);
    },

    onRender: function () {
      // render the filter elements if active
      var active = this.model.get('active');
      if (active) {
        // search box
        this.searchView = new FilterSearch({model: this.model});
        this.searchRegion.show(this.searchView);
        this.listenTo(this.searchView, 'close', this.focusIcon);
        // clear button
        this.clearView = new FilterClear({model: this.model});
        this.clearRegion.show(this.clearView);
        this.listenTo(this.clearView, 'clear', this.focusSearch);
        // seach button
        this.iconView = new FilterIcon({
          model: this.model,
          initialActivationWeight: this.options.initialActivationWeight
        });
        this.iconRegion.show(this.iconView);
      }
    },

    toggleLabel: function () {
      var show = this.model.get('showSearch');
      if (show) {
        // hide the label
        this.ui.label.hide();
      } else {
        // show the label
        this.ui.label.show();
      }
    },

    updateFocus: function () {
      var show = this.model.get('showSearch');
      if (show) {
        this.searchView.trigger('changed:focus', this.searchView);
        this.focusSearch();
      } else {
        this.focusIcon();
      }
    },

    focusSearch: function () {
      // focus search
      this.searchView.currentlyFocusedElement().trigger('focus');
    },

    focusIcon: function(){
      // focus icon
      this.iconView.currentlyFocusedElement().trigger('focus');
    }
  });

  // add event propagation mixin
  _.extend(FilterView.prototype, LayoutViewEventsPropagationMixin);

  // return
  return FilterView;
});
