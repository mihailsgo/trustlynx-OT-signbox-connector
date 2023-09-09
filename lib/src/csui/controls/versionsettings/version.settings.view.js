/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette', 'i18n',
  'csui/controls/versionsettings/impl/version.control.view',
  'i18n!csui/controls/versionsettings/impl/nls/lang',
  'hbs!csui/controls/versionsettings/impl/version.settings',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/base',
  'csui/utils/url',
  'smart/utils/smart.base',
  'csui/utils/contexts/factories/next.node',
  'csui/controls/icons.v2',
  'css!csui/controls/versionsettings/impl/settings'
], function ($, _, Backbone, Marionette, i18n, VersionControlView, lang, template,
    LayoutViewEventsPropagationMixin, ModalAlert, base, Url, SmartBase,
    NextNodeModelFactory, iconRegistry) {
  'use strict';
  var VersionSettingsView = Marionette.LayoutView.extend({

    constructor: function VersionSettingsView(options) {
      options || (options = {});
      _.defaults(options, {
        iconName: "csui_action_version_control32"
      });
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.parentView = options.originatingView || options.parentView;
      this.context = options.context;
      this.listenTo(this.context.getModel(NextNodeModelFactory), 'before:change:id', function () {
        this.parentView._blockingCounter && this.parentView.unblockActions();
        this.isContainerChanged = true;
      });
      this.isSilentFetch = true;
      this.listenTo(this.parentView.collection, 'request', function () {
        this.isSilentFetch = false;
      });
    },
    template: template,
    templateHelpers: function () {
      return {
        enabled: this.enabled(),
        settingLabel: lang.versionSettings,
        iconTheme: this.options.useIconsForDarkBackground ? 'dark' : '',
        iconName: this.options.iconName
      };
    },

    ui: {
      settingsIcon: '.csui-toolbar-settings'
    },

    events: {
      'click @ui.settingsIcon': '_openSettingsView',
      'keydown': 'onKeyInView',
      'keyup': 'onKeyUpView'
    },

    _openSettingsView: function (options) {
        options = options || {};
        options.model = this.options.model;
        options.settingsView = this;
        this.versionControlSettings = new VersionControlView(options);
      this.listenTo(this.versionControlSettings, 'closeDropdown', this._closeSettingsMenu);
      this.listenTo(this.versionControlSettings, 'show', this.setDropdownPosition);
      $(window).on('resize.dropdownResize', _.bind(this.setDropdownPosition, this));
      var defaultContainer = $.fn.binf_modal.getDefaultContainer();
      this.versionDropdownMask = document.createElement('div');
      this.versionDropdownContainer = document.createElement('div');
      this.ui.settingsIcon.attr('aria-expanded', 'true');
      this.versionDropdownContainer.classList.add('csui-toolbar-control-settings-dropdown');
      this.versionDropdownMask.classList.add('version-mask');
      $(defaultContainer).append(this.versionDropdownMask).append(this.versionDropdownContainer);
      $(this.versionDropdownMask).on('click',
          _.bind(this._saveAndDestroySettingsDropdown, this));
      this.versionDropdownContainerRegion = new Marionette.Region({
        el: this.versionDropdownContainer
      });
      this.versionDropdownContainerRegion.show(this.versionControlSettings);
      this.versionDropdownContainerRegion.$el.addClass('binf-open');
    },

    _saveAndDestroySettingsDropdown: function () {
      var settings = this.versionControlSettings.settings,
          model = this.options.model;
      if (model.get('versions_control_advanced') !== settings.majorMinorVersion) {
        this.parentView._blockingCounter === 0 && this.parentView.blockActions();
        saveSettings.call(this).done(_.bind(function () {
          !this.isContainerChanged &&
          model.fetch({silent: this.isSilentFetch}).always(_.bind(function () {
            this.isSilentFetch = true;
          }, this));
          this.parentView.unblockActions();
        }, this)).fail(_.bind(function (request) {
          this.parentView.unblockActions();
          var errorMsg = new base.RequestErrorMessage(request);
          ModalAlert.showError(errorMsg.message);
        }, this));
      }
      this.destroyVersionControlView();

      function saveSettings() {
        var settings = this.versionControlSettings.settings,
            model = this.options.model,
            connector = model.connector,
            data = {
              "versions_control_advanced": settings.majorMinorVersion.toString(),
              "apply_to": settings.permissionLevel
            };
        return model.save(undefined, {
          data: data,
          type: 'PUT',
          wait: true,
          silent: true,
          patch: true,
          contentType: 'application/x-www-form-urlencoded',
          url: Url.combine(connector.getConnectionUrl().getApiBase('v2'),
              '/nodes/' + model.get("id"))
        });

      }
    },

    destroyVersionControlView: function () {
      var versionControlSettings = this.versionControlSettings;
      if (versionControlSettings && !versionControlSettings.controlViewIsInFocus) {
        this.versionDropdownContainerRegion.$el.removeClass('binf-open');
        this.ui.settingsIcon.attr('aria-expanded', 'false');
        $(this.versionDropdownMask).off('click');
        $(window).off('resize.dropdownResize');
        versionControlSettings.destroy();
        $(this.versionDropdownMask).remove();
        $(this.versionDropdownContainer).remove();
      }
    },

    restoreFocusToView: function () {
      this.$el.find('.csui-acc-focusable').trigger('focus');
    },

    setDropdownPosition: function () {
      var settingsIconDmns   = this.ui.settingsIcon[0].getBoundingClientRect(),
          settingsIconWidth  = settingsIconDmns.width,
          settingsIconHeight = settingsIconDmns.height,
          settingsIconLeft   = settingsIconDmns.left,
          settingsIconTop    = settingsIconDmns.top,
          dropdownWidth      = this.versionDropdownContainer.offsetWidth,
          removableWidth     = SmartBase.isRTL() ? 0 : (dropdownWidth - settingsIconWidth);
      this.versionDropdownContainer.style.left = (settingsIconLeft - removableWidth) + 'px';
      this.versionDropdownContainer.style.top = (settingsIconTop + settingsIconHeight) + 'px';
    },

    enabled: function () {
      return this.options.model.actions.findWhere({signature: 'versionscontrol'});
    },

    saveAndDestroySettingsDropdown: function () {
      this._saveAndDestroySettingsDropdown();
    },

    onKeyInView: function (event) {
      switch (event.keyCode) {
      case 13:
      case 32:
        if (this.enabled()) {
          event.preventDefault();
          event.stopPropagation();
          this._openSettingsView(this.options);
        }
        break;
      }

    },

    _closeSettingsMenu: function () {
        this._saveAndDestroySettingsDropdown();
        this.restoreFocusToView();
    },

  });
  _.extend(VersionSettingsView.prototype, LayoutViewEventsPropagationMixin);
  return VersionSettingsView;
});
