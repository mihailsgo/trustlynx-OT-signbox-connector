/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/shortcuts/impl/shortcut/shortcut.view',
  'csui/widgets/shortcuts/impl/shortcut/editable.shortcut.view',
  'csui/utils/contexts/factories/node',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/utils/perspective/perspective.util',
  'smart/controls/progressblocker/blocker',
  'i18n!csui/widgets/shortcuts/impl/nls/lang',
  "css!csui/widgets/shortcuts/impl/shortcuts"
], function (_,
    $,
    Backbone,
    Marionette,
    base,
    TabableRegionBehavior,
    MiniShortcutView,
    EditableShortcutView,
    NodeModelFactory,
    ViewEventsPropagationMixin,
    PerspectiveUtil,
    BlockingView,
    lang) {

  'use strict';

  var THEME_SUFFIX = ["shade1", "shade2", "shade3", "shade4"];

  var ShortcutModel = Backbone.Model.extend({
    idAttribute: 'shortcutItemId',

    isAddShortcut: function () {
      return this.get('isAddNew') === true;
    }
  });

  var ShortcutsCollection = Backbone.Collection.extend({

    constructor: function (models, options) {
      options || (options = {});
      _.defaults(options, {
        model: ShortcutModel,
        comparator: function (a, b) {
          if (b.get('isAddNew')) {
            return -1;
          }
          return 0;
        }
      });
      this.options = options;
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    getShortcuts: function () {
      return this.filter(function (model) {
        return !model.isAddShortcut();
      });
    },

    evaluateAddNewExistence: function () {
      var widgetId = this.options[PerspectiveUtil.KEY_WIDGET_ID];
      if (this.options.perspectiveMode === PerspectiveUtil.MODE_PERSONALIZE &&
          (widgetId && !PerspectiveUtil.isPersonalWidgetId(widgetId))) {
        return;
      }
      var newItem = this.where(function (model) {
        return model.isAddShortcut();
      });
      if (this.length < 4 && newItem.length === 0) {
        this.add({
          id: '',
          isAddNew: true,
          icon: 'icon-new',
          displayName: ''
        });
        return true;
      } else if (this.length > 4 && newItem.length > 0) {
        this.remove(newItem);
        return true;
      }
      return false;
    }
  });
  var ShortcutsView = Marionette.CollectionView.extend({

    constructor: function ShortcutsView(options) {
      options || (options = {});
      options.data || (options.data = {});
      options = _.defaults(options, {
        reorderOnSort: true,
        widgetContainer: this
      });
      options.data = this._normalizeData(options.data);

      options.collection = options.collection || new ShortcutsCollection([],
          _.pick(options, 'perspectiveMode', PerspectiveUtil.KEY_WIDGET_ID));
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },

    tagName: 'div',

    className: "csui-shortcut-container tile initialLoading csui-shortcut-group-container" +
               " csui-widget-focusable",

    attributes: function () {
      var attrs = {};
      if (!this._isInlineEditMode()) {
        attrs = _.extend({
          role: 'navigation',
          "aria-label": lang.groupAria
        }, attrs);
      }
      return attrs;
    },

    regions: {
      "shortcut0": ".shortcut-region-0",
      "shortcut1": ".shortcut-region-1",
      "shortcut2": ".shortcut-region-2",
      "shortcut3": ".shortcut-region-3"
    },

    behaviors: function () {
      if (!this._isInlineEditMode()) {
        return {
          TabableRegion: {
            behaviorClass: TabableRegionBehavior
          }
        };
      }
    },

    events: function () {
      var evts = {};

      if (this._isInlineEditMode()) {
        evts = _.extend(evts, {
          "drop": "onDrop",
          "dragover": "onDragOver",
          "dragenter": "onDragEnter",
          "keydown": "_onEditKeyDown"
        });
      } else {
        evts = _.extend(evts, {
          "keydown": "onKeyInView"
        });
      }

      return evts;
    },

    childView: MiniShortcutView,
    childEvents: {
      'change:shortcutTheme': '_onChangeTheme',
      'add:shortcut': '_onAddShortcut',
      'delete:widget': '_onRemoveShortcut',
      'update:widget:options': '_updateShortcutOptions'
    },
    childViewOptions: function (model, index) {
      return {
        context: this.options.context,
        collection: this.options.collection,
        container: this,
        perspectiveMode: this.options.perspectiveMode
      };
    },

    buildChildView: function (child, ChildViewClass, childViewOptions) {
      if (this._isInlineEditMode()) {
        ChildViewClass = EditableShortcutView;
      } else {
        ChildViewClass = MiniShortcutView;
      }
      return Marionette.CollectionView.prototype.buildChildView.call(this, child, ChildViewClass,
          childViewOptions);
    },

    _normalizeData: function (data) {
      data || (data = {shortcutItems: []});
      data.shortcutTheme || (data.shortcutTheme = '');
      return data;
    },

    initialize: function () {
      this.loadingText = lang.loadingText;
      this.darkBackground = true;
      BlockingView.imbue(this);

      this.listenTo(this.collection, 'add', this._onCollectionChange)
          .listenTo(this.collection, 'remove', this._onCollectionChange)
          .listenTo(this.collection, 'reset', this._onCollectionChange);

      if (this._isInlineEditMode()) {
        this.listenTo(this.collection, 'add', this._onCollectionInlineAdd)
            .listenTo(this.collection, 'remove', this._onCollectionInlineRemove);
      }

      var shortcutItems = _.map(_.first(this.options.data.shortcutItems || [], 4), _.clone);
      this._fetchModels(shortcutItems).always(_.bind(function () {
        this._setupCollection(shortcutItems);
      }, this));
      this._currentShortcutIndex = 0;
      this.listenTo(this, 'add:child', this.propagateEventsToViews);
    },

    _fetchModels: function (shortcutItems) {
      this.blockActions();

      var self = this;
      var models = _.map(shortcutItems, function (item) {
        item.id = item.id || item.launchButtonID;
        var model = self.options.context.getModel(NodeModelFactory, {
          attributes: {
            id: (item.id || item.launchButtonID) || 'volume',
            type: item.type
          }
        });
        MiniShortcutView.prepareModelToFetch(model);
        return model;
      });

      var modelPromises = _.map(models, function (model) {
        return model.fetch({suppressError: true});
      });

      var result = $.whenAll.apply($, modelPromises);
      result.always(function () {
        _.each(shortcutItems, function (item, index) {
          item.node = models[index];
        });
        self.unblockActions();
      });
      return result;
    },

    _setupCollection: function (shortcutItems) {
      if (!this._isInlineEditMode()) {
        var validShortcuts = _.filter(shortcutItems, function (item) {
          return !item.node.error;
        });
        if (validShortcuts.length > 0) {
          shortcutItems = validShortcuts;
        } else {
          shortcutItems = _.first(shortcutItems, 1);
        }
      }
      shortcutItems = shortcutItems || [];
      this.collection.reset(shortcutItems);
    },

    _isInlineEditMode: function () {
      return !!this.options.perspectiveMode;
    },

    _onCollectionChange: function () {
      if (this._isInlineEditMode()) {
        this.collection.evaluateAddNewExistence();
      }
      this._updateShortcutStyles();
    },

    _onCollectionInlineAdd: function () {
      this.collection.each(function (model) {
        model.trigger('refresh:mask');
      });
    },

    _onCollectionInlineRemove: function () {
      this.collection.each(function (model) {
        model.trigger('refresh:mask');
      });
    },

    _getLayout: function (size) {
      var layout = "small";
      if (size === 1) {
        layout = "large";
      } else if (size === 2) {
        layout = "medium";
      }
      return layout;
    },

    _getShortcutTheme: function (itemIndex, numberOfItems) {
      var theme = this.options.data.shortcutTheme ? this.options.data.shortcutTheme :
                  "csui-shortcut-theme-grey";
      if (numberOfItems > 1) {
        itemIndex += (4 - numberOfItems);
        theme += "-" + THEME_SUFFIX[itemIndex];
      }

      return theme;
    },

    _updateShortcutOptions: function (shortcutItemView, args) {
      var itemModel = shortcutItemView.model,
          updatedOptions = args.options;
      if (itemModel.get('isAddNew')) {
        if (args.softUpdate) {
          return;
        }
        if (!args.isValid || !shortcutItemView.isOptionsValid(updatedOptions)) {
          if (this.options.perspectiveMode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
            this._notifyOptionsChange(!shortcutItemView.isShortcutValid(updatedOptions));
          }
          return;
        }
        itemModel.set({'isAddNew': undefined, displayName: undefined, icon: undefined},
            {silent: true, unset: true});
      }
      shortcutItemView.isUpdating = true;
      this._setDefaultOptions(updatedOptions);
      itemModel.set(updatedOptions);
      this._notifyOptionsChange();
      var isCollChanged = this.collection.evaluateAddNewExistence();
      delete shortcutItemView.isUpdating;
      if (!isCollChanged) {
        this._updateShortcutStyles();
        shortcutItemView.model.trigger('refresh:mask');
      }
      this.triggerMethod('dom:refresh');
    },
    _setDefaultOptions: function (updatedOptions) {
      updatedOptions.type = updatedOptions.type || 141;
    },

    _onRemoveShortcut: function (shortcutItemView) {
      var getNextItemToFocus = this.collection.indexOf(shortcutItemView.model);
      this.collection.remove(shortcutItemView.model);
      var shortcutItems = this.collection.getShortcuts();
      if (shortcutItems.length === 0) {
        this.options.widgetContainer.trigger('remove:widget');
      } else {
        this._notifyOptionsChange();
        this.children.findByIndex(getNextItemToFocus).focus();
      }
    },

    _notifyOptionsChange: function (isInvalid) {
      var shortcutItems = this.collection.getShortcuts().map(function (model) {
        return {
          id: model.get('id'),
          type: model.get('type'),
          displayName: model.get('displayName'),
          icon: model.has('icon') ? model.get('icon') : ''
        };
      });
      this.options.widgetContainer.trigger('update:widget:options', {
        shortcutTheme: this.collection.first().get('shortcutTheme'),
        shortcutItems: shortcutItems,
        isValid: !isInvalid
      });
    },

    _onChangeTheme: function (childView) {
      this.options.data.shortcutTheme = childView.model.get('shortcutTheme');
      this._updateShortcutStyles();
    },

    _onAddShortcut: function (childView, model) {
      this.collection.add({
        id: '',
        icon: '',
        displayName: '',
        type: 141,
        shortcutTheme: this.options.data.shortcutTheme
      }, {at: this.collection.length - 1});
      this.collection.sort();
      this._notifyOptionsChange();
    },

    _updateShortcutStyles: function () {
      var shortcutTheme = this.options.data.shortcutTheme,
          layout = this._getLayout(this.collection.length);
      this.collection.each(function (model, index) {
        var totalShortcuts = !this._isInlineEditMode() ? this.collection.length :
                             this.collection.getShortcuts().length,
            theme = this._getShortcutTheme(index, totalShortcuts);
        model.set({
          layout: layout,
          theme: theme,
          shortcutTheme: shortcutTheme
        });
      }, this);
    },

    onDrop: function (event) {
      this.options.widgetContainer.trigger('replace:widget', event);
    },

    onDragOver: function (event) {
      event.preventDefault();
    },

    onDragEnter: function (event) {
      event.preventDefault();
    },

    onRender: function () {
      this._clearShortcutTabIndexes();
    },

    onDomRefresh: function () {
      if (this._isInlineEditMode()) {
        var btnRequired = true,
            shortcutGroup = lang.groupAria,
            shortcutCount = this.collection.getShortcuts().length,
            shortcutAriaLabel = '',
            wrapperEle = this.$el.parent().find('.shortcut-group-wrapper');
        if (wrapperEle.length > 0) {
          btnRequired = false;
        }
        btnRequired && this.$el.before(
            "<div class='shortcut-group-button-wrapper'><button class='shortcut-group-wrapper binf-btn' tabindex='0'></button></div>");
        this.$el.parent().off('click', '.shortcut-group-wrapper', this._onEditEnterPress).on(
            'click', '.shortcut-group-wrapper', this._onEditEnterPress.bind(this));
        this.$el.parent().off('keydown', '.shortcut-group-wrapper',
            this._onKeyInEmptyPlaceHolder).on(
            'keydown', '.shortcut-group-wrapper', _.bind(this._onKeyInEmptyPlaceHolder, this));

        switch (shortcutCount) {
        case 0:
          shortcutAriaLabel = lang.emptyGroup;
          break;
        case 1:
          shortcutAriaLabel = _.str.sformat(lang.shortcutGroupWithOneItem, shortcutCount,
              4 - shortcutCount);
          break;
        case 4:
          shortcutAriaLabel = lang.maxItemsGroup;
          break;
        default:
          shortcutAriaLabel = _.str.sformat(lang.shortcutGroupWithMixedItems, shortcutCount,
              4 - shortcutCount);
        }
        this.$el.parent().find('.shortcut-group-wrapper').attr('aria-label', shortcutAriaLabel);
      }
    },

    _clearShortcutTabIndexes: function () {
      if (!this.$el.find('.binf-popover').length) {
        base.clearFocusables(this.$el);
      }
    },
    currentlyFocusedElement: function () {
      var currentItem = this._currentlyFocusedShortcut();
      return currentItem && currentItem.$el;
    },

    _currentlyFocusedShortcut: function () {
      return this.children.findByIndex(this._currentShortcutIndex);
    },

    _onEditEnterPress: function (event) {
      var $target = $(event.target);
      if (this.collection.getShortcuts().length === 0 && this.$el.has($target).length === 0) {
        this.$el.find('.csui-pman-widget-masking').trigger('click');
        return false;
      } else if ($target.is(this.$el.parent().find('.shortcut-group-wrapper'))) {
        this._enterConfiguration();
        return false;
      }
      return true;
    },

    _onEditKeyDown: function (event) {
      var continueEvent = true,
        $target = $(event.target);
      switch (event.keyCode) {
        case 13: // ENTER
        case 32: // SPACE
          continueEvent = this._onEditEnterPress(event);
          break;
        case 27: // ESCAPE
          if (this.collection.getShortcuts().length > 0) {
            if ($target.is(this.$el.find('.wrapper-button'))) {
              this.$el.parent().find('.shortcut-group-wrapper').trigger(
                'focus');
            } else {
              this.$el.find('.csui-pman-shortcut-new .wrapper-button').trigger(
                'focus');
            }
            continueEvent = false;
          } else if (this.collection.getShortcuts().length === 0) {
            this._exitConfiguration();
            continueEvent = false;
          }
          break;
        case 38: // UP
          this._selectPreviousShortcut();
          break;
        case 40: // DOWN
          this._selectNextShortcut();
          break;
      }
      return continueEvent;
    },

    _enterConfiguration: function () {
      this._currentShortcutIndex = -1;
      this._selectShortcut(0);
    },

    _exitConfiguration: function () {
      this.$el.parent().find('.shortcut-group-wrapper').trigger('focus');
      this._clearShortcutTabIndexes(this.$el);
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 13: // ENTER
      case 32:
        this.currentlyFocusedElement().trigger('click');
        break;
      case 38:
        this._selectPreviousShortcut();
        break;
      case 40:
        this._selectNextShortcut();
        break;
      }
    },

    _onKeyInEmptyPlaceHolder: function (event) {
      switch (event.keyCode) {
      case 9:
        if (event.shiftKey && $(event.target).is($('.shortcut-group-wrapper'))) {
          var index = $(document.activeElement).closest(
              '.csui-draggable-item.csui-pman-editable-widget').index(),
              widgetEle = $('.csui-dnd-container>.csui-pman-editable-widget'),
              prevWidgetEleTop = widgetEle.eq(index - 1).offset().top,
              isWidgetInSameRow = widgetEle.eq(index).offset().top === prevWidgetEleTop;
          if (!isWidgetInSameRow) {
            var scrollPosition = index < 0 ? 0 : prevWidgetEleTop - $('.pman-header').height();
            $("html, body").animate({
              scrollTop: scrollPosition
            }, 0);
          }
        }
        break;
      }
    },

    _selectNextShortcut: function () {
      var index = Math.min(this._currentShortcutIndex + 1, this.collection.length - 1);
      this._selectShortcut(index);
    },

    _selectPreviousShortcut: function () {
      var index = Math.max(this._currentShortcutIndex - 1, 0);
      this._selectShortcut(index);
    },

    _selectShortcut: function (index) {
      if (index !== this._currentShortcutIndex) {
        this._currentShortcutIndex = index;
        this.trigger('changed:focus', this);
        this._currentlyFocusedShortcut().focus();
      }
    }
  }, {
    migrateSingleShortcut: function (options) {
      var shortcutTheme;
      switch (options.background) {
      case 'cs-tile-background1':
        shortcutTheme = 'csui-shortcut-theme-stone1';
        break;
      case 'cs-tile-background2':
        shortcutTheme = 'csui-shortcut-theme-teal2';
        break;
      case 'cs-tile-background3':
        shortcutTheme = 'csui-shortcut-theme-pink1';
        break;
      }
      return {shortcutItems: [options], shortcutTheme: shortcutTheme};
    },

    migrateData: function (widgetType, options) {
      switch (widgetType) {
      case 'shortcut':
      case 'csui/widgets/shortcut':
        return ShortcutsView.migrateSingleShortcut(options);
      default:
        return options;
      }
    }
  });

  _.extend(ShortcutsView.prototype, ViewEventsPropagationMixin);

  return ShortcutsView;

});
