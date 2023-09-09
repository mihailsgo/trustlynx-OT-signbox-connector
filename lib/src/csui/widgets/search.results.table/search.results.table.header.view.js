/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/url',
  'csui/utils/contexts/factories/user',
  'csui/controls/perspective.header/perspective.header.view',
  'csui/widgets/search.results/controls/sorting/sort.menu.view',
  'hbs!csui/widgets/search.results.table/search.results.table.header',
  'i18n!csui/widgets/search.results.table/impl/nls/lang',
  'csui/controls/icon/icon.view',
  'csui/utils/high.contrast/detector!',
  'css!csui/controls/perspective.header/impl/perspective.header',
  'css!csui/widgets/search.results/impl/search.results'
], function (_, $, Marionette, Url, UserModelFactory, PerspectiveHeaderView, SortingView, headerTemplate, lang, IconView, highContrast) {
  "use strict";
  var SearchResultsTableHeaderView = PerspectiveHeaderView.extend({

    className: "csui-perspective-toolbar-container csui-search-results-header-view",

    template: headerTemplate,

    templateHelpers: function () {
      return {
        icon: this.options.icon,
        title: this.options.title,
        backTitle: lang.backTitle,
        settingsLabel: lang.searchSettings,
        showSettings: !!this.options.enableSearchSettings,
        descriptionTitle: lang.showDescription,
        iconTheme: this._useIconsForDarkBackground ? 'dark' : ''
      };
    },

    constructor: function SearchResultsTableHeaderView(options) {
      this.ui = _.extend({
        settingsMenu: '.csui-setting-icon',
        settingsDropdown: '.csui-settings-dropdown',
        toggleDescription: '.csui-description-toggle',
        sortRegion: '.csui-search-sorting'
      }, this.ui);
      this.events = _.extend({
        'click @ui.settingsMenu': '_createSettingsDropdown',
        'keydown @ui.settingsMenu': 'showSettingsDropdown',
        'click @ui.toggleDescription': 'onToggleDescriptionClick',
        'keypress @ui.toggleDescription': 'onToggleDescriptionClick'
      }, this.events);
      this.settingsRegion = new Marionette.Region({ el: this.ui.settingsDropdown });
      this.localStorage = options && options.localStorage;
      PerspectiveHeaderView.prototype.constructor.call(this, options);
      this._useIconsForDarkBackground = (options.useIconsForDarkBackground && highContrast !== 2) || highContrast === 1;
      this.listenTo(this.options.originatingView, 'show:description:Icon', function () {
        this.selectedSettings = this.options.originatingView.settings.get(
          'display') && this.options.originatingView.settings.get(
            'display').summary_description.selected;
        this.toggleDescriptionIconView = new IconView(
          { iconName: 'csui_action_reveal_description32', states: true, on: this.showDescription, theme: this._useIconsForDarkBackground ? 'dark' : '' });
        this.toggleDescriptionIconRegion = new Marionette.Region({ el: this.ui.toggleDescription });
        this.toggleDescriptionIconRegion.show(this.toggleDescriptionIconView);
        this.setSortingView();
        this.sortOptionsRegion = new Marionette.Region({ el: this.ui.sortRegion });
        this.sortOptionsRegion.show(this.sortingView);
        this.updateToggleDescription();
        this.updateToggleDescriptionIcon();
      });
    },

    onRender: function () {
      if (this.localStorage.storage && this.localStorage.storage.getItem('PrevSearchDisplayStyle')) {
        this.showDescription = this.localStorage.get(
          this._createSearchDisplayStyleKey() + '_showDescription');
      }
    },

    setSortingView: function () {
      this.sortingView = new SortingView({
        collection: this.collection,
        enableSorting: true
      });
      return true;
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
      this.options.originatingView.trigger('create:SettingsDropdown', event);
    },

    onToggleDescriptionClick: function (e) {
      if ((e.type === 'keypress' && (e.keyCode === 13 || e.keyCode === 32)) ||
        (e.type === 'click')) {
        e.preventDefault();
        var originatingView = this.options.originatingView,
          options = this.localStorage.get(this.query_id),
          widgetOptions;
        if (!this.showDescription) {
          this.localStorage.set(this._createSearchDisplayStyleKey() + '_showDescription', true);
          originatingView.tableView.options.descriptionRowViewOptions.showDescriptions = true;
          this.$el.find('.csui-description-toggle').attr("title", lang.hideDescription);
          this.$el.find('.csui-description-toggle').attr("aria-label", lang.hideDescription);
          this._setShowDescriptions(true);
        } else {
          this.localStorage.set(this._createSearchDisplayStyleKey() + '_showDescription', false);
          originatingView.tableView.options.descriptionRowViewOptions.showDescriptions = false;
          this.$el.find('.csui-description-toggle').attr("title", lang.showDescription);
          this.$el.find('.csui-description-toggle').attr("aria-label", lang.showDescription);
          originatingView.$el.find('.cs-description').addClass('csui-description-collapsed');
          this._setShowDescriptions(false);
        }
        this.$el.find('.csui-description-toggle').trigger('focus');
      }
    },

    _setShowDescriptions: function (show) {
      this.showDescription = show;
      this.toggleDescriptionIconView && this.toggleDescriptionIconView.setIconStateIsOn(show);
      this.options.originatingView.trigger('toggle:description', { showDescriptions: show });
    },

    updateToggleDescriptionIcon: function () {
      var toggleDescription = $(this.ui.toggleDescription);
      if (this.showDescription) {
        toggleDescription.attr("title", lang.hideDescription);
        toggleDescription.attr("aria-label", lang.hideDescription);
      } else {
        toggleDescription.attr("title", lang.showDescription);
        toggleDescription.attr("aria-label", lang.showDescription);
      }
    },

    updateToggleDescription: function () {
      this.$el.find('.csui-description-toggle').removeClass('search-settings-none');
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
            this.options.originatingView &&
              this.options.originatingView.$el.find('.cs-description').addClass(
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
            this.options.originatingView &&
              this.options.originatingView.$el.find('.cs-description').addClass(
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
            this.options.originatingView &&
              this.options.originatingView.$el.find('.cs-description').addClass(
                'csui-description-collapsed');
          }
          break;
        }
        case 'NONE': {
          this.$el.find('.csui-description-toggle').addClass('search-settings-none');
          this.options.originatingView &&
            this.options.originatingView.$el.find('.cs-description').addClass(
              'csui-description-collapsed');
          this._setShowDescriptions(false);
          break;
        }
      }
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
  return SearchResultsTableHeaderView;
});
