/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/controls/toolbar/toolitem.view',
  'csui/utils/base',
  'csui/controls/mixins/view.state/toolitems.state.mixin',
  'hbs!csui/controls/toolbar/impl/flyout.toolitem',
  'i18n!csui/controls/toolbar/impl/nls/localized.strings'
], function (_, $, Marionette, ToolItemView, base, ToolItemsStateMixin, template, lang) {
  'use strict';

  var FlyoutToolItemView = Marionette.CompositeView.extend({
    tagName: 'li',
    className: 'csui-flyout binf-dropdown-submenu binf-pull-down',
    attributes: function () {
      var signature = this.model.get('signature') || '';
      var attrs = {};
      if (this.model.isSeparator()) {
        attrs['aria-hidden'] = 'true';
      }
      else {
        attrs['data-csui-command'] = signature.toLowerCase();
        if (this.options.role) {
          attrs.role = this.options.role;
        } else {
          attrs.role = 'none';
        }
      }
      return attrs;
    },

    onDomRefresh: function () {
      if (this.$el.parent('.csui-toolbar, .csui-table-actionbar > ul.binf-nav').length) {
        this.$el.addClass('binf-pull-down');
      } else {
        this.$el.removeClass('binf-pull-down');
      }
      if (this.$el.hasClass('binf-open')) {
        this.$el.trigger('click'); // Hide dropdown
      }
    },
    template: template,
    templateHelpers: function () {
      var command = this.options.command;
      return {
        name: this.model.get('name'),
        renderIconAndText: this.options.renderIconAndText === true,
        renderTextOnly: this.options.renderTextOnly === true,
        expandTitle: lang.showMoreLabel,
        toolItemAria: this.model.get("toolItemAria"),
        hasToolItemAriaExpand: this.model.get("toolItemAriaExpand") !== undefined,
        toolItemAriaExpand: this.model.get("toolItemAriaExpand"),
        hasIcon: this._hasIcon(),
        icon: this._icon,
        iconName: this._iconName,
        iconStateIsOn: this._stateIsOn,
        iconTheme: this.options.useIconsForDarkBackground ? 'dark' : '',
        disabledClass: command && command.get('selfBlockOnly') && command.get('isExecuting') ?
        'binf-disabled' : '',
        title: !!this.model.get('title') ? this.model.get('title') : this.model.get('name'),
        linkRole: this.options.noMenuRoles ? undefined : 'menuitem'
      };
    },

    childViewContainer: '.binf-dropdown-menu',

    getChildView: function (item) {
      return item.toolItems && item.toolItems.length ? FlyoutToolItemView : ToolItemView;
    },

    childViewOptions: function () {
      return {
       renderTextOnly:true
      };
    },

    childEvents: {
      'toolitem:action': function (childView, args) {
        this.triggerMethod('toolitem:action', args);
        this.$el.data('binf.dropdown.submenu') && this.$el.data('binf.dropdown.submenu').hide();
      }
    },

    ui: {
      link: 'a.csui-toolitem'
    },

    events: {
      'click @ui.link': 'activeSubmenu'
    },

    onRender: function () {
      this.$el.binf_dropdown_submenu();
      this.$el.off('dom:refresh').on('dom:refresh', _.bind(this.onDomRefresh, this));
      this.$el.off('binf.dropdown.submenu.after.show')
        .on('binf.dropdown.submenu.after.show', _.bind(function (event) {
          if (this.$el.parent().hasClass('csui-toolbar') || !(this.$el.hasClass('binf-pull-down'))) {
            var $dropdownMenu = this.$el.children().last();
            base.alignDropDownSubMenus({ targetEl: this.$el, dropdownMenu: $dropdownMenu });
          }
        },this));
    },

    constructor: function FlyoutToolItemView(options) {
      this.options = options || {};
      this.collection = options.collection || (options.model && options.model.toolItems);
      this.model = this.options.model;
      this._calculateIconName();
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.collection, 'add change reset', function (models) {
        if(this.el && this.el.offsetWidth > 0 && this.el.offsetHeight > 0){
          return;
        } else{
          this._calculateIconName();
          this.render();
        }
      });
    },
    onKeyInView: function (event) {
      var target = $(event.target);
      if (event.keyCode === 13) {
        this._handleClick(event);
        return false;
      }
    },

    activeSubmenu: function (event) {
      if (base.isAppleMobile()) {
        var active = $(event.target).attr('aria-expanded') === 'true' ? true : false,
          submenuParent = this.$el.parent('ul.binf-dropdown-menu');
        if (!active) {
          submenuParent.addClass('csui-submenu-active');
        } else {
          submenuParent.removeClass('csui-submenu-active');
        }
      }
    },

    saveRenderState: function () {
      this._renderState = {};
      _.each(FlyoutToolItemView.STATE_PARAMS, function (param) {
        this._renderState[param] = this.options[param];
      }, this);
    },

    restoreRenderState: function () {
      if (this._renderState) {
        _.each(FlyoutToolItemView.STATE_PARAMS, function (param) {
          this.options[param] = this._renderState[param];
        }, this);
        this.render();
        delete this._renderState;
      }
    },
  },
  {
    STATE_PARAMS: ['renderIconAndText', 'renderTextOnly']
  });
  _.extend(FlyoutToolItemView.prototype, ToolItemsStateMixin);
  return FlyoutToolItemView;
});
