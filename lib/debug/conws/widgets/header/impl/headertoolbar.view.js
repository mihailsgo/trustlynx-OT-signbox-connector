csui.define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'hbs!conws/widgets/header/impl/headertoolbar',
  'conws/controls/lazyactions/lazyToolbar.view',
  'csui/controls/toolbar/toolbar.view',
  'csui/controls/toolbar/toolitems.filtered.model',
  'csui/utils/commands',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/models/nodes',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'conws/widgets/header/impl/collapse/collapse.page.overlay',
  'css!conws/widgets/header/impl/headertoolbar'
], function ($, _, Backbone, Marionette, template, LazyToolbarView, ToolbarView,
    FilteredToolItemsCollection, commands, ToolbarCommandController, NodeCollection,
    LayoutViewEventsPropagationMixin, CollapseView) {
  'use strict';

  var HeaderToolbarView = Marionette.LayoutView.extend({

    template: template,

    regions: {
      statusIndicatorsRegion: '.conws-header-status-indicators',
      dividerRegion: '.conws-header-status-toolbar-divider',
      toolbarRegion: '.conws-rightToolbar',
      delayedActionsToolbarRegion: '.conws-delayedActionsToolbar',
      collapseRegion: '.conws-header-collapse'
    },

    ui: {
      toolbarRegion: '.conws-rightToolbar',
      delayedActionsToolbarRegion: '.conws-delayedActionsToolbar',
      statusIndicatorsRegion: '.conws-header-status-indicators',
      dividerRegion: '.conws-header-status-toolbar-divider',
      collapseRegion: '.conws-header-collapse'
    },

    templateHelpers: function () {
      var obj = {
        hasToolbarView: !this.options.hideToolbar
      };
      return obj;
    },

    constructor: function HeaderToolbarView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
    },

    initialize: function (options) {

      if (!options.hideToolbar) {
        var toolbarItems = options.toolbarItems;
        var toolItemsMask = options.toolbarItemsMasks;
        var node = options.node;
        var selectedNodes = new NodeCollection(node);
        selectedNodes.connector = node.connector;

        this.commandController = new ToolbarCommandController({
          commands: options.commands || commands
        });

        this.commonToolbarOptions = {
          originatingView: options.originatingView,
          context: options.context,
          toolbarCommandController: this.commandController,
          container: options.container,
          useIconsForDarkBackground: options.useIconsForDarkBackground
        };

        var rightToolbarItems = toolbarItems ? toolbarItems.rightToolbar : undefined
        var rightToolbarMask = toolItemsMask ? toolItemsMask.toolbars.rightToolbar : undefined
        this._righttoolbarView = this._setToolbarView(node, rightToolbarItems,
            rightToolbarMask, toolbarItems.rightToolbar.options);

        var delayedActionsToolbarItems = toolbarItems ? toolbarItems.delayedActionsToolbar :
                                         undefined
        var delayedActionsToolbarMask = toolItemsMask ?
                                        toolItemsMask.toolbars.delayedActionsToolbar : undefined
        this._delayedActionsToolbarView = this._setToolbarView(node, delayedActionsToolbarItems,
            delayedActionsToolbarMask, toolbarItems.delayedActionsToolbar.options);
      }

      if (options.statusIndicatorsView && options.statusIndicatorsViewOptions) {
        this._statusIndicatorsView = new options.statusIndicatorsView(
            options.statusIndicatorsViewOptions);
      }

      if (options.enableCollapse) {
        var collapseOptions;
        if (options.context.perspective) {
          collapseOptions = {
            perspective: options.context.perspective
          }
        }
        this._collapseView = new CollapseView(collapseOptions);
      }

      if (options.originatingView) {
        this.listenTo(options.originatingView, 'adjust:toolbar', this.adjustToolbar);
      }

      this.listenTo(this, 'dom:refresh', this._DomRefresh);
      this.listenTo(this, "status:indicator:available", this.showDivider);

      if (this._delayedActionsToolbarView) {
        this.listenTo(this._delayedActionsToolbarView, 'render', this._DomRefresh);
      }
    },

    onRender: function () {
      this.delegateEvents();
      if (this._statusIndicatorsView) {
        this.statusIndicatorsRegion.show(this._statusIndicatorsView);
      }
      if (this._righttoolbarView) {
        this.toolbarRegion.show(this._righttoolbarView);
      }
      if (this._delayedActionsToolbarView) {
        this.delayedActionsToolbarRegion.show(this._delayedActionsToolbarView);
      }
      if (this._collapseView) {
        this.collapseRegion.show(this._collapseView);
      }
      if (this._showDivider) {
        this.ui.dividerRegion.addClass('divider-show');
      }
    },

    _setToolbarView: function (node, toolbarItems, toolbarMask, toolOptions) {
      var nodes = new NodeCollection([node]);
      nodes.connector = node.connector;

      var status = _.extend(this.commonToolbarOptions, {
        nodes: nodes
      });

      var filteredCollection = new FilteredToolItemsCollection(
          toolbarItems, {
            status: status,
            commands: this.commandController.commands,
            delayedActions: node.delayedActions,
            mask: toolbarMask
          });

      // Toolbars in the header widget offer actions working on the workspace
      // node. This node may fetch permitted actions in the delayed mode.
      var toolbarView = new LazyToolbarView(_.extend({
        collection: filteredCollection
      }, this.commonToolbarOptions, toolOptions));

      return toolbarView;
    },

    showDivider: function () {
      if (this._collapseView || !this.options.hideToolbar) {
        this._showDivider = true;
        this.ui.dividerRegion.addClass('divider-show');
      }
    },

    onDestroy: function () {

      if (this._statusIndicatorsView) {
        this._statusIndicatorsView.destroy();
      }
      if (this._righttoolbarView) {
        this._righttoolbarView.destroy();
      }
      if (this._delayedActionsToolbarView) {
        this._delayedActionsToolbarView.destroy();
      }
      if (this._collapseView) {
        this._collapseView.destroy();
      }
    },

    _DomRefresh: function () {

      if (this._righttoolbarView) {
        this._righttoolbarView.triggerMethod('dom:refresh');
      }
      if (this._delayedActionsToolbarView) {
        this._delayedActionsToolbarView.triggerMethod('delayed:toolbar:refresh');
      }
    },

    adjustToolbar: function () {
      var tabIndex = -1;
      if (arguments && arguments.length > 0) {
        tabIndex = arguments[0].tabIndex;
      }

      if (this.$el.find(".binf-dropdown").length === 0) {
        this._DomRefresh();
      }
    }

  });

  _.extend(HeaderToolbarView.prototype, LayoutViewEventsPropagationMixin);

  return HeaderToolbarView;

});
