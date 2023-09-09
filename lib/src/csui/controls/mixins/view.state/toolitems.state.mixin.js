/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/lib/backbone', 'csui/utils/log', 'csui/utils/base'
], function (module, _, $, Marionette, Backbone, log, base) {
  'use strict';

  log = log(module.id);

  return {

    _hasIcon: function () {
      return this.model.get('iconName') || this._iconName || this._icon;
    },

    _calculateIconName: function () {
      this._stateIsOn = this.model.get('stateIsOn');
      if (this._stateIsOn) {
        this._iconName = this.model.get('iconNameForOn');
        if (this._iconName) {
          this._stateIsOn = false;  // not using the icon-v2 modifier, because other icon is used
        } else {
          this._iconName = this.model.get('iconName');  // default back to non on state icon
        }
      } else {
        this._iconName = this.model.get('iconName');
        if (!this._iconName) {  // @deprecate using of css based (background-image) icons
          this._icon = this.model.get('icon');
        }
      }
    },

    renderIconAndText: function () {
      this.options.renderIconAndText = true;
      this.render();  // re-render
      this.options.renderIconAndText = false;
    },

    renderTextOnly: function (saveState) {
      if (this.isRenderedTextOnly()) {
        return;
      }
      saveState && this.saveRenderState();
      this.options.renderTextOnly = true;
      this.render();  // re-render
      this.options.renderTextOnly = false;
    },

    isRenderedTextOnly: function () {
      return !this._hasIcon() || // No Icon, only text is rendered.
        (this.options.renderTextOnly === true && // Has Icon, but asked to rendered textonly
          this.options.renderIconAndText !== true);
    },

    makeFocusable: function () {
      this.ui.link.addClass("csui-acc-focusable");
    },

    _handleClick: function (event, isKeyEvent) {
      if (base.isControlClick(event)) {
      } else {
        event.preventDefault();
        if (this.model.get('menuWithMoreOptions') === true) {
          event.stopPropagation();
        } else {
          this.closeDropdown();
        }
        if (isKeyEvent) {
          this.model.set({ isKeyEvent: !!isKeyEvent }, { silent: true });
        }
        var args = { toolItem: this.model };
        this.triggerMethod('before:toolitem:action', args);
        if (!args.cancel) {
          this.triggerMethod('toolitem:action', args);
        }
      }
    },
    isSeparator: function () {
      return this.model.isSeparator();
    },

    closeDropdown: function () {
      var dropdownEl = this.$el.closest('li.binf-dropdown.binf-open');
      var dropdownToggleEl = dropdownEl.find('.binf-dropdown-toggle');
      dropdownToggleEl.binf_dropdown('toggle');
    },
  };
});
