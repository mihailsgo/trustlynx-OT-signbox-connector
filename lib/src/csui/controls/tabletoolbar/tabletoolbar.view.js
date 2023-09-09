/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/marionette', 'csui/models/node/node.model',
  'csui/models/nodes', 'csui/controls/toolbar/toolitem.model',
  'csui/controls/toolbar/toolitems.filtered.model',
  'csui/controls/toolbar/toolbar.view',
  'csui/controls/item.title/item.title.view',
  'csui/controls/toolbar/delayed.toolbar.view', 'csui/utils/commands/add',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/table/inlineforms/inlineform.factory',
  'hbs!csui/controls/tabletoolbar/impl/tabletoolbar',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/utils/commands', 'csui/utils/accessibility', 'csui/utils/nodesprites',
  'csui-ext!csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/lib/jquery.when.all',
  'css!csui/controls/tabletoolbar/impl/tabletoolbar'
], function ($, _, Marionette, NodeModel,
    NodeCollection, ToolItemModel, FilteredToolItemsCollection,
    ToolbarView, ItemTitleView, DelayedToolbarView, AddCommand,
    tableToolbarLang, inlineFormViewFactory, template,
    LayoutViewEventsPropagationMixin, TabableRegionBehavior,
    ToolbarCommandController, commands, accessibility,
    nodeSprites, toolbarExtensions) {
  'use strict';

  var TableToolbarView = Marionette.LayoutView.extend({
    template: template,

    templateHelpers: function()  {
      return { toolbarAria: tableToolbarLang.ToolbarAria };
    },

    regions: {
      navigationToolbarRegion: '.csui-navigationToolbar', //extreme Left toolbar
      filterToolbarRegion: '.csui-filterToolbar', // filter toolbar
      addToolbarRegion: '.csui-addToolbar', // add toolbar
      leftToolbarRegion: '.csui-leftToolbar', // left toolbar
      otherToolbarRegion: '.csui-otherToolbar', // other toolbar
      toolbarCaptionRegion: '.csui-toolbar-caption', // caption
      rightToolbarRegion: '.csui-rightToolbar' // right toolbar
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    toolbarItemSelector: 'a.' + TabableRegionBehavior.accessibilityFocusableClass + ':visible,' +
                         'button.' + TabableRegionBehavior.accessibilityFocusableClass + ':visible,' +
                         'div.' + TabableRegionBehavior.accessibilityFocusableClass + ':visible',

    events: {"keydown": "onKeyInView"},

    currentlyFocusedElement: function () {

      var toolbarElements = this.$(this.toolbarItemSelector);
      var elementOfFocus = toolbarElements.length ?
                           $(toolbarElements[this.accNthToolbarItemFocused]) : null;
      return elementOfFocus;
    },

    constructor: function TableToolbarView(options) {
      options || (options = {});

      this.context = options.context;
      this.commandController = options.toolbarCommandController ||
                               new ToolbarCommandController({
                                 commands: options.commands || commands
                               });
      this.addableTypes = options.addableTypes;
      this.originatingView = options.originatingView || this;
      this.blockingParentView = options.blockingParentView;
      this.selectedNodes = new NodeCollection();
      this.accNthToolbarItemFocused = 0;
      this.toolbarNames = ['navigation', 'filter', 'add', 'left', 'other', 'right'];

      Marionette.LayoutView.prototype.constructor.apply(this, arguments); // sets this.options

      this.listenTo(this, 'before:regions:reinitialize', this.initialize);
    },

    initialize: function (options) {
      this.container = options.container ||
                       this.collection && this.collection.node;

      var status = {
        context: this.context,
        nodes: this.selectedNodes,
        container: options.removeContainer ? undefined : this.container,
        collection: this.collection,
        originatingView: this.originatingView,
        data: {
          addableTypes: this.addableTypes,
        }
      };

      _.each(this.toolbarNames, function (toolbarName) {
        var fullToolbarName = toolbarName + 'Toolbar',
            toolItemFactory = this.options.toolbarItems[fullToolbarName];
        if (toolItemFactory) {
          var toolbarItemsMask = this.options.toolbarItemsMasks &&
                                 this.options.toolbarItemsMasks.toolbars[fullToolbarName];
          var delayedActions = this.collection && this.collection.delayedActions;
          var filteredCollection = new FilteredToolItemsCollection(
              toolItemFactory, {
                status: status,
                commands: this.commandController.commands,  // todo: move filteredCollection to
                delayedActions: delayedActions,
                mask: toolbarItemsMask
              });
          if (this.container) {
            this.listenTo(this.container.actions, 'reset update', function () {
              filteredCollection.refilter();
            });
          }
          var toolbarClass = ToolbarView,
              toolbarView  = new toolbarClass(_.extend({
                collection: filteredCollection,
                toolbarName: toolbarName,
                toolbarCommandController: this.commandController,
                toolbarItemsMask: toolbarItemsMask,
                originatingView: this.originatingView,
                blockingParentView: this.blockingParentView,
                noMenuRoles: true
              }, toolItemFactory.options));
          this[toolbarName + 'ToolbarView'] = toolbarView;
          if (toolbarView.closeDropdown) {
            toolbarView.listenTo(this, 'changed:focus close:dropdown', toolbarView.closeDropdown);
          }
          this
              .listenTo(toolbarView, 'childview:toolitem:action',
                  this._toolbarItemClicked)
              .listenTo(toolbarView, 'dom:refresh', function () {
                this.triggerMethod('refresh:tabindexes');
              }).listenTo(this.commandController, 'after:execute:command', function (eventArgs) {
            if (eventArgs && eventArgs.cancelled) {
              var targetToolItem  = this.$el.find('[data-csui-command=' +
                                                  eventArgs.commandSignature.toLowerCase() +
                                                  '] a'),
                  isUnderDropDown = targetToolItem.length ?
                                    targetToolItem.closest('ul.csui-more-dropdown-menu') : {};
              if (isUnderDropDown.length) {
                isUnderDropDown.siblings('a.binf-dropdown-toggle').trigger('focus');
              } else {
                targetToolItem.trigger('focus');
              }
            }
          });
          if (toolbarView instanceof DelayedToolbarView) {
            this.listenTo(this.selectedNodes, 'reset', function () {
              toolbarView.actionState.set('showMessage', !!this.selectedNodes.length);
            });
          }
        }
      }, this);

      if (this.options.toolbarItems.addToolbar && this.addableTypes) {
        this._updateAddToolbar();
        this.listenTo(this.addableTypes, 'reset', this._updateAddToolbar, this);
      }

      if (this.options.headermenuItems &&
          this.options.headermenuItems.headerMenuToolbar && this.container) {
        this.captionView = new ItemTitleView({
          model: this.container,
          toolItems: this.options.headermenuItems.headerMenuToolbar,
          toolItemsMask: this.options.headermenuItemsMask,
          context: this.context,
          commands: this.commandController.commands,
          originatingView: this.originatingView,
          nameSchema: this.options.nameSchema
        });
        this.captionView.listenTo(this, 'changed:focus', this.captionView.closeMenu);
      }

      this.propagateEventsToRegions();

      var self = this;
      if (toolbarExtensions) {
        toolbarExtensions.forEach(function (entryPoint) {
          entryPoint(self);
        });
      }
    },

    _moveTo: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger('changed:focus', this);
      this.currentlyFocusedElement().trigger('focus');
    },

    onKeyInView: function (event) {

      var toolbarElements;
      if ($(event.target).is(':input') &&
          !$(event.target).hasClass(TabableRegionBehavior.accessibilityFocusableClass)) {
        return; // if keyboard event was from input element, ignore it
      }
      switch (event.keyCode) {
      case 9:
        this.trigger('close:dropdown');
        break;
      case 37:
        toolbarElements = this.$(this.toolbarItemSelector);
        if (this.accNthToolbarItemFocused > 0) {
          this.accNthToolbarItemFocused--;
        }
        this._moveTo(event);
        break;
      case 39:
        toolbarElements = this.$(this.toolbarItemSelector);
        if (this.accNthToolbarItemFocused < toolbarElements.length - 1) {
          this.accNthToolbarItemFocused++;
        }
        this._moveTo(event);
        break;
      case 35:
        if (!$(event.target).closest('ul').hasClass('binf-dropdown-menu')) {
          toolbarElements = this.$(this.toolbarItemSelector);
          this.accNthToolbarItemFocused = toolbarElements.length - 1;
          this._moveTo(event);
        }
        break;
      case 36:
        if (!$(event.target).closest('ul').hasClass('binf-dropdown-menu')) {
          this.accNthToolbarItemFocused = 0;
          this._moveTo(event);
        }
        break;
      }
    },

    _updateAddToolbar: function () {
      var toolbarItems = [];
      this.addableTypes.each(function (addableType) {
        var addType = addableType.get('type');
        var isAddableWithoutInlineForm = AddCommand.isAddableTypeWithoutInlineForm(addType);
        var inlineFormView;
        if (!isAddableWithoutInlineForm) {
          inlineFormView = inlineFormViewFactory.getInlineFormView(addType);
        }
        if (isAddableWithoutInlineForm || inlineFormView) {
          var signature = 'Add',
              groupName = 'add',
              addableCommandInfo = inlineFormView &&
                                   Object.getPrototypeOf(inlineFormView).addableCommandInfo;

          if (inlineFormView && _.isObject(addableCommandInfo)) {
            var cmdInfo = addableCommandInfo;
            signature = cmdInfo.signature || signature;
            groupName = cmdInfo.group || groupName;
          } else if (inlineFormView &&
                     _.isFunction(inlineFormView.prototype.getAddableCommandInfo)) {
            var commandInfo = inlineFormView.prototype.getAddableCommandInfo();
            signature = commandInfo.signature || signature;
            groupName = commandInfo.group || groupName;
          }

          var typeName = addableType.get('type_name');
          typeName = nodeSprites.findTypeByNode(new NodeModel(
            { type: addType, type_name: typeName })) || typeName;

          var toolItem = new ToolItemModel({
            signature: signature,
            name: typeName,
            title: _.str.sformat(tableToolbarLang.AddToolbarItemsTitle, typeName),
            type: addType,
            group: groupName,
            commandData: {
              type: addType,
              addableTypes: this.addableTypes
            }
          });
          _.isFunction(this.options.updateAddToolItem) && this.options.updateAddToolItem(toolItem);
          toolbarItems.push(toolItem);
        }
      }, this);
      var self = this;
      if (!toolbarItems.length) {
        this._requestAddToolbar(toolbarItems).always(function () {
          self._resetAddToolbar(toolbarItems);
        });
      } else {
        this.stopListening(this.addToolbarView, 'toolbar.show').listenTo(this.addToolbarView,
          'toolbar.show', function () {
            this.addToolbarView.startLazyLoading();
            this._requestAddToolbar(toolbarItems).always(function () {
              self.addToolbarView.collection.silentFetch = true;
              self._resetAddToolbar(toolbarItems);
              self.addToolbarView.stopLazyLoading();
              self.stopListening(self.addToolbarView, 'toolbar.show');
              self.addToolbarView.appendLazyActions();
            });
          });
        this._resetAddToolbar(toolbarItems);
      }
    },

    _requestAddToolbar: function (toolbarItems) {
      var deferreds = [];
      this.triggerMethod('before:updateAddToolbar', {
        context: this.context,
        container: this.container,
        addableTypes: this.addableTypes,
        toolbarItems: toolbarItems,
        async: function () {
          var deferred = $.Deferred();
          deferreds.push(deferred);
          return function () {
            deferred.resolve();
          };
        }
      });
      return $.whenAll.apply($, deferreds);
    },

    _resetAddToolbar: function (toolbarItems) {
      if (this.options.creationToolItemsMask) {
        toolbarItems = this.options.creationToolItemsMask.maskItems(toolbarItems);
      }
      this.options.toolbarItems.addToolbar.reset(toolbarItems);
    },
    _toolbarItemClicked: function (toolItemView, args) {
      var executionContext = {
        context: this.context,
        nodes: this.selectedNodes.clone(),
        container: this.container,
        collection: this.collection,
        originatingView: this.originatingView,
        toolItemView: toolItemView
      };

      this.commandController.toolitemClicked(args.toolItem, executionContext);
    },
    updateForSelectedChildren: function (selectedNodes) {
      this.selectedNodes.reset(selectedNodes);
    },

    onRender: function () {
      if (accessibility.isAccessibleMode()) {
        this.el.firstElementChild.classList.add('csui-wrap-text');
      }
      if (this.options.height) {
        this.$el.height(this.options.height);
      }
      _.each(this.toolbarNames, function (toolbarName) {
        var view = this[toolbarName + 'ToolbarView'];
        if (view) {
          view.collection.refilter();
          this[toolbarName + 'ToolbarRegion'].show(view);
        }
      }, this);
      if (this.captionView) {
        this.toolbarCaptionRegion.show(this.captionView);
      }
    }

  });

  _.extend(TableToolbarView.prototype, LayoutViewEventsPropagationMixin);

  return TableToolbarView;
});
