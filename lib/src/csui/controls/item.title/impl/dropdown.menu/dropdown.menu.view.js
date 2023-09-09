/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/toolbar/toolitem.view',
  'csui/models/nodes', 'csui/controls/toolbar/toolitems.filtered.model',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/dropdown.menu/dropdown.menu.behavior',
  'csui/controls/toolbar/flyout.toolitem.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/utils/commands', 'csui/utils/commandhelper', 'csui/utils/log', 'i18n',
  'hbs!csui/controls/item.title/impl/dropdown.menu/dropdown.menu',
  'i18n!csui/controls/item.title/impl/nls/localized.strings',
  'css!csui/controls/item.title/impl/dropdown.menu/dropdown.menu'

], function (module, $, _, Backbone, Marionette, ToolItemView, NodeCollection,
    FilteredToolItemsCollection, TabableRegionBehavior, DropdownMenuBehavior,
    FlyoutToolItemView,
    PerfectScrollingBehavior, commands, CommandHelper,
    log, i18n, template, lang) {
  'use strict';

  log = log(module.id);

  var DropdownMenuView = Marionette.CompositeView.extend({
    className: "csui-item-title-dropdown-menu",

    template: template,
    templateHelpers: function () {
      return {
        btnId: _.uniqueId('dropdownMenuButton'),
        showMoreTooltip: lang.showMore,
        showMoreAria: _.str.sformat(lang.showMoreAria, this.model.get('name'))
      };
    },

    getChildView:  function (item) {
      return item.get('flyout') ? FlyoutToolItemView : ToolItemView;
    },
    childViewContainer: "ul.binf-dropdown-menu",
    childViewOptions: function (model) {
      return {
        command: this.collection.commands &&
          this.collection.commands.findWhere({signature: model.get('signature')}),
        noMenuRoles: undefined
      };
    },

    ui: {
      dropdownToggle: '.binf-dropdown-toggle'
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      DropdownMenuBehavior: {
        behaviorClass: DropdownMenuBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.binf-dropdown-menu',
        suppressScrollX: true,
        includePadding: true
      }
    },

    constructor: function DropdownMenuView(options) {
      options.collection = new FilteredToolItemsCollection(
          options.toolItems, {
            status: this._createCommandStatus(options),
            commands: this.commands,
            mask: options.toolItemsMask
          });

      options.reorderOnSort = true;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      _.defaults(this.options, options.toolItems.options);  // set options from ToolItemFactory

      this.commands = options.commands || commands;
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }

      this.listenTo(this, "childview:toolitem:action", this._triggerMenuItemAction)
          .listenTo(this.model, "sync", this.render)
          .listenTo(this, 'close:menu', this._closeToggle)
          .listenTo(Backbone, 'closeToggleAction', this._closeToggle)
          .listenTo(this.model, "change", this.render)
          .listenTo(this.options.collection, 'add remove reset', this._setCaretVisibility);
      if (this.model.delayedActions) {
        this.listenTo(this.model.delayedActions, 'request', this._hide)
            .listenTo(this.model.delayedActions, 'sync error', this._show);
      }
      if (this.model.actions) {
        this.listenTo(this.model.actions, 'update', this.render);
      }
    },

    _createCommandStatus: function (options) {
      return {
        nodes: new NodeCollection([options.model]),
        container: options.model,
        context: options.context
      };
    },

    _updateCollectionStatus: function () {
      var status = this._createCommandStatus(this.options);
      this.options.collection.setStatus(status);
    },

    _setCaretVisibility: function () {
      if (this.options.collection.length === 0) {
        this.$el.addClass('binf-hidden');
      } else {
        this.$el.removeClass('binf-hidden');
      }
    },

    onBeforeRender: function () {
      this._updateCollectionStatus();
      this._setCaretVisibility();
    },

    onRender: function () {
      if (this.model.delayedActions && this.model.delayedActions.fetching) {
        this._hide();
      }
      this.ui.dropdownToggle.binf_dropdown();
      var that = this;
      this.ui.dropdownToggle.on('binf.dropdown.after.show', function () {
        that.adjustDropdown();
        that.trigger("update:scrollbar");
      });
      $(window).on('resize.item.title.dropdown.menu', _.bind(this.adjustDropdown, this));
      this.delegateEvents();
    },

    adjustDropdown: function () {
      var containerEle = (this.options.originatingView && this.options.originatingView.$el) ||
                        (this.options.containerClass && this.$el.closest(this.options.containerClass)),
          isRtl = i18n && i18n.settings.rtl;
      if(!!containerEle) {
        var containerEleHeight = containerEle.height(),
            dropdownEle = this.$el.find('ul.binf-dropdown-menu'),
            offset = this.options.offset || 52, // default for nodestable offset height.
            dropdownEleHeight = containerEleHeight - offset;

        dropdownEle.css('max-height', dropdownEleHeight + "px");
        var availableHeaderWidth = $(".csui-toolbar-caption").width() -
                                $(".csui-item-title").width() ;
        availableHeaderWidth = $(".csui-rightToolbar").width() +
                            (availableHeaderWidth / 2) + 24;
        if (availableHeaderWidth < dropdownEle.width()) {
          if (isRtl) {
            dropdownEle.css({
              "left": 0,
              "right": "auto"
            });
          } else {
            dropdownEle.css({
              "left": "auto",
              "right": 0
            });
          }
        }
      }

    },

    currentlyFocusedElement: function () {
      return $(this.ui.dropdownToggle);
    },

    _hide: function () {
      this.$el.addClass('binf-invisible');
    },

    _show: function () {
      this.$el.removeClass('binf-invisible');
    },

    _closeToggle: function () {
      if (this.isRendered) {
        if (this.ui.dropdownToggle.parent().hasClass('binf-open')) {
          this.ui.dropdownToggle.binf_dropdown('toggle');
        }
        this.ui.dropdownToggle.attr('aria-expanded', 'false');
      }
    },

    _triggerMenuItemAction: function (toolItemView, args) {
      this.ui.dropdownToggle.binf_dropdown('toggle');  // close the dropdown menu before triggering the event

      var toolItem = args.toolItem;
      var signature = toolItem.get("signature");
      var command = this.commands.get(signature);
      var status = {
          context: this.options.context,
          nodes: new NodeCollection([this.model]),
          container: this.model,
          originatingView: this.options.originatingView
        };
      try {
        if (!command) {
            throw new Error('Command "' + signature + '" not found.');
        }else if(_.isFunction(command.execute)){
          var promise = command.execute(status);
          CommandHelper.handleExecutionResults(
              promise, {
                command: command,
                suppressSuccessMessage: status.suppressSuccessMessage,
                suppressFailMessage: status.suppressFailMessage
              });
        }else{
            this.trigger(signature.toLowerCase(), this);
        }
      } catch (error) {
         log.warn('Executing the command "{0}" failed.\n{1}',
         command.get('signature'), error.message) && console.warn(log.last);
      }
      }
  });

  return DropdownMenuView;
});
