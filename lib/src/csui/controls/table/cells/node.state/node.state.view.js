/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/log', 'csui/utils/base', 'csui/utils/accessibility',
  'csui/controls/table/cells/cell/cell.view',
  'csui/controls/table/cells/cell.registry',
  'csui/controls/node.state/node.states.view',
  'csui/controls/node.state/node.state.icons',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'i18n!csui/controls/table/cells/node.state/impl/nls/lang',
  'css!csui/controls/table/cells/node.state/impl/node.state'
], function (module, _, $, Marionette, log, base, Accessibility, CellView, cellViewRegistry,
    NodeStateCollectionView, nodeStateIcons, FieldsV2Mixin, lang) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();

  log = log(module.id);

  var NodeStateCellView = CellView.extend({
    needsAriaLabel: true,

    events: {
      focus: '_focused',
      keydown: '_handleKeys',
      keyup: '_trapKeys',
      click: '_clicked',
      'blur @ui.entryButton': '_blurredEntryButton'
    },

    ui: {
      entryButton: 'button.csui-node-states-entry'
    },

    constructor: function NodeStateCellView(options) {
      CellView.prototype.constructor.apply(this, arguments);
      this.cellRegion = new Marionette.Region({el: this.el});
      this.listenTo(this, 'before:render', this._rememberFocus)
          .listenTo(this, 'before:render', this._disengageKeyTrap)
          .listenTo(this, 'before:render', this._destroyStateIcons)
          .listenTo(this, 'render', this._restoreFocus)
          .listenTo(this, 'before:destroy', this._disengageKeyTrap)
          .listenTo(this, 'before:destroy', this._destroyStateIcons);
    },

    _destroyStateIcons: function () {
      this.cellRegion.empty();
    },

    _getEnabledNodeStateIcons: function() {
      var nodeStateIconsPrototype;
      var enabledNodeStateIcons;

      nodeStateIconsPrototype = Object.getPrototypeOf(nodeStateIcons);
      enabledNodeStateIcons = new nodeStateIconsPrototype.constructor(
          nodeStateIcons.filter(function (iconModel) {
            var IconView = iconModel.get('iconView');
            try {
              return IconView && (!IconView.enabled || IconView.enabled({
                context: this.options.context,
                node: this.model
              }));
            } catch (error) {
              log.warn('Evaluating an icon view failed.\n{0}',
                  error.message) && console.warn(log.last);
            }
          }, this));
      return enabledNodeStateIcons;
    },

    renderValue: function () {
      var enabledStateIcons = this._getEnabledNodeStateIcons();
      if (enabledStateIcons.length) {
        if (enabledStateIcons.length>1) {
          this._render4MultiState();
        }
        var iconsView = new NodeStateCollectionView({
            context: this.options.context,
            node: this.model,
            tableView:this.options.tableView,
            collection: enabledStateIcons
         });
        if (enabledStateIcons.length>1) {
          var wrapperEl = this.$el.find('div.csui-node-states-multi-wrapper');
          this.cellRegion = new Marionette.Region({el: wrapperEl});
        }

        this.cellRegion.show(iconsView);
        var that = this;
        this.$('button.csui-node-states-entry').on('keyup', function(event2) {
          if (event2.keyCode===13 || event2.keyCode===32) {
            that._disengageKeyTrap();
            that._engageKeyTrap();
            event2.preventDefault();
            event2.stopPropagation();
          }
        });

      } else {
        this._renderEmpty();
      }
    },

    getAriaLabel: function () {
      var hasState = this.cellRegion.currentView;
      return hasState ? lang.someStateIconsAria : lang.noStateIconsAria;
    },

    getAttributes: function() {
      var self = this;
      var attributes = [];
      this._getEnabledNodeStateIcons().each(function(iconModel) {
        var IconView = iconModel.get('iconView');
        var tmpView = new IconView({
          context: self.options.context,
          model: self.model
        });
        if (_.isFunction(tmpView.getAttributes)) {
          attributes = attributes.concat(tmpView.getAttributes());
        }
      });
      _.each(attributes, function(attribute) {
        if (_.isBoolean(attribute.value)) {
          attribute.value = (attribute.value === true ? lang.bool_value_true : lang.bool_value_false);
        }
      });

      return attributes;
    },

    _render4MultiState: function() {
      $('<button>', {class: 'csui-node-states csui-node-states-entry',
          'aria-label': lang.stateEntryButtonAria, tabindex: -1})
          .text('').appendTo(this.$el);
      $('<div>', {class: 'csui-node-states-multi-wrapper'})
          .appendTo(this.$el);
    },

    _renderEmpty: function () {
      if (accessibleTable) {
        $('<span>', {title: lang.noStateIconsAria})
            .text(lang.noStateIconsAria)
            .appendTo(this.$el);
      }
    },

    _clicked: function(event) {
      if (event.target === this.ui.entryButton[0]) {
        event.preventDefault();
        event.stopPropagation();
        this._disengageKeyTrap();
        this._engageKeyTrap();
      }
    },

    _handleKeys: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32 ) { // enter or space
        if (event.target === this.ui.entryButton[0]) {
          event.preventDefault();
          event.stopPropagation();
          this._disengageKeyTrap();
          this._engageKeyTrap();
        }
      } else if (this._hasEngagedKeyTrap()) {
        if (event.keyCode === 27) { // ESC
          this._disengageKeyTrap();
          event.preventDefault();
          event.stopPropagation();

          if (this.ui.entryButton.is(':visible')) {
            this.$el.addClass('csui-node-states-entry-focused');
            this.ui.entryButton.attr('tabindex', 0).focus();
          }
        } else if (event.keyCode === 37 || event.keyCode === 38) { // left or up
          event.preventDefault(); // stop browser from scrolling
          event.stopPropagation();
          this._moveFocus(-1);
        } else if (event.keyCode === 39 || event.keyCode === 40) { // right or down
          event.preventDefault(); // stop browser from scrolling
          event.stopPropagation();
          this._moveFocus(1);
        } else {
          this._trapKeys(event);
        }
      }
    },

    _trapKeys: function (event) {
      if (this._hasEngagedKeyTrap() && event.keyCode === 9) {
        event.preventDefault(); // Stop browser from tabbing
        event.stopPropagation();
      }
    },

    _rememberFocus: function () {
      this._focusTrapped = this.el.contains(document.activeElement) &&
                           this._hasEngagedKeyTrap();
    },

    _restoreFocus: function () {
      if (this._focusTrapped) {
        this._engageKeyTrap();
      }
    },

    _focused: function(event) {
       if (event.target.tagName==='TD' && this._hasEngagedKeyTrap()) {
         this._engageKeyTrap();
         event.preventDefault();
         event.stopPropagation();
         return;
       }
       this._disengageKeyTrap();

       var enabledButtons = this._getEnabledNodeStateIcons();
       if (enabledButtons.length>1) {
         this.ui.entryButton.attr('tabindex', 0);
         this.$el.attr('tabindex', -1);
         this.$el.addClass('csui-node-states-entry-focused');
         this.ui.entryButton.focus();
         event.preventDefault();
         event.stopPropagation();
       }
    },

    _blurredEntryButton: function (event) {
      this.$el.removeClass('csui-node-states-entry-focused');
      this.ui.entryButton.attr('tabindex', '-1');
    },

    _engageKeyTrap: function () {
      var elements = base.findFocusables(this.cellRegion.el);
      if (elements.length) {
        this._keysTrapped = true;
        $(elements[0]).focus();
      }
    },

    _disengageKeyTrap: function () {
      if (this._hasEngagedKeyTrap()) {
        this._keysTrapped = false;
      }
    },

    _hasEngagedKeyTrap: function () {
      return this._keysTrapped;
    },

    _moveFocus: function (direction) {
      var elements = base.findFocusables(this.cellRegion.el),
          lastElement = elements.length - 1,
          activeElement = elements.index(document.activeElement) + direction;
      if (activeElement < 0) {
        activeElement = lastElement;
      } else if (activeElement > lastElement) {
        activeElement = 0;
      }
      activeElement = elements[activeElement];
      if (activeElement) {
        activeElement.focus();
      } else {
        log.warn('Focusable elements were unexpectedly removed from {0} ({1}).',
            log.getObjectName(this), this.cid) && console.warn(log.last);
      }
    }
  }, {
    columnClassName: 'csui-table-cell-node-state',

    flexibleWidth: true,

    getModelFields: function (options) {
      return nodeStateIcons.reduce(function (fields, iconModel) {
        var IconView = iconModel.get('iconView');
        if (IconView && IconView.getModelFields) {
          var field = IconView.getModelFields(options);
          if (field) {
            FieldsV2Mixin.mergePropertyParameters(fields, field);
          }
        }
        return fields;
      }, {});
    },

    getModelExpand: function (options) {
      return nodeStateIcons.reduce(function (expands, iconModel) {
        var IconView = iconModel.get('iconView');
        if (IconView && IconView.getModelExpand) {
          var expand = IconView.getModelExpand(options);
          if (expand) {
            FieldsV2Mixin.mergePropertyParameters(expands, expand);
          }
        }
        return expands;
      }, {});
    }
  });
  cellViewRegistry.registerByColumnKey('reserved', NodeStateCellView);
  cellViewRegistry.registerByOtherColumnKey('reserved_user_id', NodeStateCellView);

  return NodeStateCellView;
});
