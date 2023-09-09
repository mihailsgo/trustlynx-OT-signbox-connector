/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/controls/icon/icon.view',
  'i18n!csui/controls/checkbox/impl/nls/lang',
  'hbs!csui/controls/checkbox/impl/checkbox.view',
  'csui/controls/checkbox/checkbox.icons.v2',
  'css!csui/controls/control/impl/control',
  'css!csui/controls/checkbox/impl/checkbox.view'
], function ($, _, Backbone, Marionette, IconView, lang, template) {
  'use strict';
  return Marionette.ItemView.extend(/** @lends Checkbox# */ {
    className: 'csui-control-view csui-checkbox-view',
    template: template,
    calculateIconName: function () {
      var checked = this.model.get('checked');
      this._iconName = 'csui_checkbox';
      switch (checked) {
      case 'true':
        this._iconName = 'csui_checkbox-selected';
        break;
      case 'mixed':
        this._iconName = 'csui_checkbox-mixed';
        break;
      case 'false':
        this._iconName = 'csui_checkbox';
        break;
      }
      return this._iconName;
    },
    setDisabled: function (d) {
      this.model.set('disabled', !!d);
    },
    templateHelpers: function () {
      return {
        disabled: this.model.get('disabled') ? 'disabled' : '',
        ariaChecked: this.model.get('checked'),
        title: this.title !== undefined ? this.title : lang.title,
        ariaLabelledBy: this.ariaLabelledBy, // if ariaLabelledBy is set, the ariaLabel field will NOT be created
        ariaLabel: this.ariaLabel !== undefined ? this.ariaLabel : lang.ariaLabel,
        label: this.label || ''
      };
    },
    ui: {
      cb: 'button.csui-control.csui-checkbox',
      checkboxIconContainer: '.csui-checkbox-icon-container'
    },
    events: {
      'click': '_toggleChecked'
    },
    constructor: function Checkbox(options) {
      options || (options = {});

      this.ariaLabel = options.ariaLabel;
      this.ariaLabelledBy = options.ariaLabelledBy;
      this.title = options.title;
      this.label = options.label;
      if (!options.model) {

        options.model = new Backbone.Model(
            {disabled: options.disabled === undefined ? false : options.disabled}
        );

      }
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._setChecked(options.checked, {silent: true});
      this.calculateIconName();
      this.checkboxIconView = new IconView(
          {iconName: this._iconName, size: 'xsmall', states: 'true'});

      this.listenTo(this, 'render', function () {
        var region = new Marionette.Region({el: this.ui.checkboxIconContainer});
        region.show(this.checkboxIconView);
      });

      this._undelegateModelAndCollectionEvents();
      this.listenTo(this.model, 'change:disabled', this._handleDisableChanged);
      this.listenTo(this.model, 'change:checked', this._handleCheckedChanged);
    },
    setChecked: function (state) {
      var options = {silent: false};
      if (this.model.get('disabled')) {
        options.silent = true;
      }
      this._setChecked(state, options);
    },
    _updateIcon: function () {
      this.calculateIconName();
      this.checkboxIconView.setIcon(this._iconName);
    },
    _handleDisableChanged: function () {
      var disabled = this.model.get('disabled');
      this.ui.cb.prop('disabled', disabled);
    },
    _handleCheckedChanged: function () {
      this._updateIcon();
      var checked = this.model.get("checked");
      this.ui.cb.attr('aria-checked', checked);
    },

    _setChecked: function (state, options) {
      switch (state) {
      case 'true':
      case true:
        this.model.set('checked', 'true', options);
        break;
      case 'mixed':
        this.model.set('checked', 'mixed', options);
        break;
      default:
        this.model.set('checked', 'false', options);
        break;
      }
    },
    _toggleChecked: function () {
      if (this.model.get('disabled')) {
        return; // don't change checkbox and don't fire events, because it's disabled
      }
      var currentState = this.model.get('checked');
      var args = {sender: this, model: this.model};
      this.triggerMethod('clicked', args);

      if (!args.cancel) {
        if (!currentState || currentState === 'false' || currentState === 'mixed') {
          this.model.set('checked', 'true');
        } else {
          this.model.set('checked', 'false');
        }
      }
    }

  });
});