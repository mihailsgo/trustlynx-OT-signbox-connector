/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', "csui/lib/jquery", "csui/lib/underscore",
  'csui/utils/log', "csui/lib/backbone", "csui/lib/marionette",
  'csui/utils/commands', 'csui/utils/commandhelper', 'csui/controls/toolbar/toolitem.view',
  'csui/controls/toolbar/flyout.toolitem.view',
  'csui/models/nodes', 'csui/controls/toolbar/toolitems.filtered.model',
  'hbs!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/dropdown.menu/dropdown.menu.behavior',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'hbs!csui/widgets/metadata/impl/header/dropdown.menu/lazy.loading.template',
  'csui/utils/base',
  'csui/controls/globalmessage/globalmessage',
  'css!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu',
  'csui/lib/binf/js/binf'
], function (module, $, _, log, Backbone, Marionette, commands, CommandHelper, ToolItemView,
  FlyoutToolItemView, NodeCollection, FilteredToolItemsCollection, template, TabableRegionBehavior,
    DropdownMenuBehavior, PerfectScrollingBehavior, lang, lazyloadingTemplate, base,
    GlobalMessage) {
  'use strict';

  log = log(module.id);

  var DropdownMenuView = Marionette.CompositeView.extend({
    className: "cs-dropdown-menu",
    template: template,

    getChildView:  function (item) {
      return item.get('flyout') ? FlyoutToolItemView : ToolItemView;
    },
    childViewContainer: "ul.binf-dropdown-menu",
    childViewOptions: function (model) {
      return {
        role: 'none',
        command: this.collection.commands &&
                 this.collection.commands.findWhere({signature: model.get('signature')})
      };
    },

    templateHelpers: function () {
      return {
        hasCommands: !!this.collection.length,
        btnId: _.uniqueId('dropdownMenuButton'),
        showMoreTooltip: lang.showMore,
        showMoreAria: _.str.sformat(lang.showMoreAria, this.model.get('name'))
      };
    },

    ui: {
      dropdownToggle: '.binf-dropdown-toggle',
      dropdownMenu: '.binf-dropdown-menu',
      loadingIconsDiv: '.csui-loading-parent-wrapper'
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
      var status = {
        nodes: new NodeCollection([options.model]),
        container: options.container,
        containerCollection: options.containerCollection,
        context: options.context
      };
      options.status = status;
      this.commands = options.commands || commands;
      options.collection = new FilteredToolItemsCollection(
          options.toolItems, {
            status: status,
            commands: this.commands,
            delayedActions: options.containerCollection &&
                            options.containerCollection.delayedActions,
            mask: options.toolItemsMask
          });

      options.reorderOnSort = true;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      _.defaults(this.options, options.toolItems.options);  // set options from ToolItemFactory

      this.originatingView = options.originatingView;
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }

      this.listenTo(this, "childview:toolitem:action", this._triggerMenuItemAction)
          .listenTo(this.model, "sync", this.render)
          .listenTo(Backbone, 'closeToggleAction', this._closeToggle)
          .listenTo(this.model, "change", this.render);
      if (this.model.delayedActions) {
        this.listenTo(this.model.delayedActions, 'request', this._hide)
            .listenTo(this.model.delayedActions, 'sync error', this._show);
      }
    },

    _updateMenuItems: function () {
      this.collection.silentFetch = true;
      this.fetchingNonPromotedActions = false;
      this.collection.refilter();
      this.render();
    },

    onRender: function () {
      if (this.model.delayedActions && this.model.delayedActions.fetching) {
        this._hide();
      }
      if (!this.collection.length) {
        var node                 = this.options.model ? this.options.model : this.model,
            lazyActionsRetrieved = !!node && !!node.get('csuiLazyActionsRetrieved'),
            isLocallyCreatedNode = !!node && !!node.isLocallyCreated;
        if (!!node && !lazyActionsRetrieved && node.nonPromotedActionCommands &&
            node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
          this.$el.find('.binf-dropdown').addClass('binf-hidden');
          this.ui.loadingIconsDiv.removeClass('binf-hidden');
          this.fetchingNonPromotedActions = true;
          node.setEnabledLazyActionCommands(
              true).done(_.bind(function () {
            this.fetchingNonPromotedActions = false;
            var blockingElement = this.$el.find('.csui-loading-parent-wrapper');
            blockingElement.animate("width: 0", 300, _.bind(function () {
              blockingElement.addClass('binf-hidden');
              this.$el.find('.binf-dropdown').removeClass('binf-hidden');
              this._updateMenuItems();
            }, this));
          }, this));
        }
      } else {
        this.fetchingNonPromotedActions = false;
        this.ui.dropdownToggle.binf_dropdown();
        this.ui.dropdownMenu.find("> li > a.binf-hidden").removeClass('binf-hidden');
        var adjustDropdown = _.bind(function () {
          this.trigger("update:scrollbar");
          this.ui.dropdownMenu.removeClass('adjust-dropdown-menu');
          var dropdownLeftOffset        = this.ui.dropdownMenu.offset().left,
              originatingViewLeftOffest = this.options.originatingView.$el.offset().left,
              dropdownWidth             = this.ui.dropdownMenu.outerWidth(),
              originatingViewWidth      = this.options.originatingView.$el.width(),
              margin                    = (window.innerWidth - originatingViewWidth) / 2,
              rightOffset               = originatingViewWidth -
                                          (dropdownLeftOffset + dropdownWidth - margin);
          if (dropdownLeftOffset + dropdownWidth > originatingViewLeftOffest +
              originatingViewWidth ||
              (rightOffset + dropdownWidth > originatingViewWidth)) {
            this.ui.dropdownMenu.addClass('adjust-dropdown-menu');
          }
        }, this);
        var renderLazyActions = _.bind(function () {
          var self = this;
          var node                 = this.options.model ? this.options.model : this.model,
              lazyActionsRetrieved = !!node && !!node.get('csuiLazyActionsRetrieved'),
              isLocallyCreatedNode = !!node && !!node.isLocallyCreated,
              promise;
          if (!!node && !lazyActionsRetrieved && node.nonPromotedActionCommands &&
              node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
            this.fetchingNonPromotedActions = true;
            this.ui.dropdownMenu.append(lazyloadingTemplate);

            if (node.delayedActions.fetching) {
              promise = node.delayedActions.fetching;
            } else {
              promise = node.setEnabledLazyActionCommands(true);
            }
            promise.done(function (node) {
              self.fetchingNonPromotedActions = false;
              var newCollection = new FilteredToolItemsCollection(
                  self.options.toolItems, {
                    status: self.options.status,
                    commands: self.commands,
                    delayedActions: self.options.containerCollection &&
                                    self.options.containerCollection.lazyActions,
                    lazyActions: self.options.containerCollection &&
                                 self.options.containerCollection.lazyActions,
                    mask: self.options.toolItemsMask
                  });

              var blockingEle = self.ui.dropdownMenu.find('.csui-loading-parent-wrapper');
              blockingEle.animate("width: 0", 300, function () {
                blockingEle.remove();
                _.filter(newCollection.models, function (model) {
                  if (self.isDestroyed === true || self._isDestroyed) {
                    self.children = undefined;
                  } else {
                    var signature = model.get("signature");
                    if (!self.collection.find({signature: signature})) {
                      self.collection.models.push(model);
                      var lazyToolItemView = self.addChild(model, ToolItemView);
                      lazyToolItemView.renderTextOnly();
                    } else {  //re-render flyout toolitem view, if existing model's flyout toolitems count is different
                      var currModel = self.collection.find({signature : signature});
                      if(model.get('flyout') && currModel.toolItems.length !== model.toolItems.length) {
                        currModel.toolItems.reset(model.toolItems.models);
                      }
                    }
                  }
                });
              });

            }).fail(function (request) {
              self.fetchingNonPromotedActions = false;
              var blockingEle = self.ui.dropdownMenu.find('.csui-loading-parent-wrapper'),
                  error       = new base.Error(request);
              blockingEle.length && blockingEle.remove();
              GlobalMessage.showMessage('error', error.message);
            });
          }
        }, this);
        this.ui.dropdownToggle.on('binf.dropdown.after.show', adjustDropdown);
        this.ui.dropdownToggle.on('binf.dropdown.before.show', renderLazyActions);
        $(window).on('resize.metadata.header.dropdown.menu', _.debounce(adjustDropdown, 100));
        this.delegateEvents();
      }
    },

    onRenderCollection: function () {
      if (this.collection.length && this.fetchingNonPromotedActions) {
        var loadingIconsDiv = this.ui.dropdownMenu.find('.csui-loading-parent-wrapper');
        loadingIconsDiv.length && loadingIconsDiv.remove();
        this.ui.dropdownMenu.append(lazyloadingTemplate);
      }
    },

    onDestroy: function () {
      this.undelegateEvents();
      $(window).off("resize.metadata.header.dropdown.menu");
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
      var dropdownToggleEl = this.$el.find('.binf-dropdown-toggle');
      if (dropdownToggleEl.parent().hasClass('binf-open')) {
        dropdownToggleEl.binf_dropdown('toggle');
      }
    },

    _triggerMenuItemAction: function (toolItemView, args) {
      this._closeToggle();

      var toolItem = args.toolItem;
      var signature = toolItem.get("signature");
      var command = this.commands.get(signature);
      var status = {
        context: this.options.context,
        nodes: new NodeCollection([this.model]),
        container: this.options.container,
        collection: this.options.containerCollection,
        originatingView: this.options.targetView ? this.options.targetView : this.originatingView,
        showPermissionView: !!this.options.showPermissionView,
        noMetadataNavigation: this.options.noMetadataNavigation,
        toolItem: toolItem,
        data: toolItem.get('commandData') || {}
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
