/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'i18n',
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/mixins/view.state/toolitems.state.mixin',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!csui/controls/toolbar/toolitem',
  'csui/controls/icons.v2',
  'csui/lib/binf/js/binf'
], function (require, i18n, $, _, Backbone, Marionette,
    ToolItemsStateMixin, TabableRegionBehavior, template, iconRegistry) {
  'use strict';

  var ToolItemView = Marionette.ItemView.extend({
    tagName: 'li',

    className: function () {
      var className = this.model.get('className') || '';
      if (this.model.isSeparator()) {
        className += ' binf-divider';
      }
      return className;
    },

    attributes: function () {
      var attrs = {};
      if (this.model.isSeparator()) {
        attrs['aria-hidden'] = 'true';
      } else {
        var signature = this.model.get('signature') || '';
        attrs['data-csui-command'] = signature.toLowerCase();
        if (signature.toLowerCase()==='add') {
          attrs['data-csui-addtype'] = this.model.get('commandData').type;
        }

        if (this.options.role) {
          attrs.role = this.options.role;
        } else  {
          attrs.role = 'none';
        }
      }
      return attrs;
    },

    ui: {
      link: 'a'
    },

    template: template,

    templateHelpers: function () {
        var configuredRole = this.model.get('toolItemRole');
        var linkRole = configuredRole ? configuredRole : this.model.isSeparator() ? 'none' : undefined;
        if (!linkRole) {
            linkRole = this.options.noMenuRoles ? undefined : 'menuitem';
        }
        var data = {
        renderIconAndText: this.options.renderIconAndText === true,
        renderTextOnly: this.options.renderTextOnly === true,
        isSeparator: this.model.isSeparator(),
        toolItemAria: this.model.get('toolItemAria'),
        hasToolItemAriaExpand: this.model.get('toolItemAriaExpand') !== undefined,
        toolItemAriaExpand: this.model.get('toolItemAriaExpand'),
        linkRole: linkRole,
        hasIcon: this._hasIcon(),
        icon: this._icon,
        iconName: this._iconName,
        iconStateIsOn: this._stateIsOn,
        iconTheme: this.options.useIconsForDarkBackground ? 'dark' : ''
      },
      command = this.options.command;
      data.disabledClass = command && command.get('selfBlockOnly') && command.get('isExecuting') ?
                           'binf-disabled' : '';
      data.title = !!this.model.get('title') ? this.model.get('title') : this.model.get('name');
      return data;
    },

    events: {
      'click a': '_handleClick',
      'keydown': 'onKeyInView'
    },

    constructor: function ToolItemView(options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this._calculateIconName();
      this.listenTo(this.model, 'change:stateIsOn', function () {
        this._calculateIconName();
        this.render();
        this.makeFocusable();
      });
    },

    onKeyInView: function (event) {
      var target = $(event.target);
      if (event.keyCode === 32 || event.keyCode === 13) {  // space(32) & enter(13)
        this._handleClick(event, true);
        return false;
      } 
    },

    saveRenderState: function () {
      this._renderState = {};
      _.each(ToolItemView.STATE_PARAMS, function (param) {
        this._renderState[param] = this.options[param];
      }, this);
    },

    restoreRenderState: function () {
      if (this._renderState) {
        _.each(ToolItemView.STATE_PARAMS, function (param) {
          this.options[param] = this._renderState[param];
        }, this);
        this.render();
        delete this._renderState;
      }
    },

    onBeforeRender: function () {
      var hasFocusA = this.$el.find('a:focus');
      this.itemHadFocus = hasFocusA.length===1;
    },

    onRender: function () {
      if (this.itemHadFocus) {
        var theA = this.$el.find('a:visible');
        theA.attr('tabindex', 0);
        theA.addClass([TabableRegionBehavior.accessibilityFocusableClass, TabableRegionBehavior.accessibilityActiveElementClass]);
        theA[0].focus();
        this.itemHadFocus = false;
      }
    }
  }, {
    STATE_PARAMS: ['renderIconAndText', 'renderTextOnly']
  });
  _.extend(ToolItemView.prototype, ToolItemsStateMixin);
  return ToolItemView;
});
