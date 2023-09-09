/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette', 'i18n',
  'i18n!csui/controls/versionsettings/impl/nls/lang',
  'hbs!csui/controls/versionsettings/impl/version.control',
  'csui/controls/version.control.dialog/version.control.dialog.view',
  'csui/controls/version.control.dialog/disable.version.settings.view',
  'css!csui/controls/versionsettings/impl/settings'
], function (require, $, _, Backbone, Marionette, i18n, lang, template, versionControlDialog,
    offVersionSettingsView) {
  'use strict';

  var VersionControlView = Marionette.ItemView.extend({

    constructor: function VersionControlView(options) {
      this.options = options || (options = {});
      this.requiredFieldsLabelId = _.uniqueId("requiredFields");
      Marionette.ItemView.call(this, options);
      this.model = options.model;
      this.settingsView = options.settingsView;
    },

    template: template,
    templateHelpers: function () {
      return {
        onlyRequiredFieldsLabel: lang.majorMinorVersion,
        requiredFieldsLabelId: this.requiredFieldsLabelId,
        currentFolder: lang.currentFolder,
        currentAndSubfolder: lang.currentAndSubfolder,
        versionControlTitle: lang.versionControlTitle,
        exampleVersions: lang.exampleVersions
      };
    },

    ui: {
      applyToFolderAndSubFoldersParentEle: '.csui-version-folder-permissions',
      folderPermissionSelector: '.csui-folder-permissions-item'
    },
    events: {
      'click @ui.folderPermissionSelector': 'onClickToChangeFolderPermissionLevel',
      'keydown': 'onKeyDown',
      'keyup': 'onKeyUp'
    },
    className: 'csui-toolbar-settings-container',

    onRender: function () {
      var self              = this,
          majorMinorVersion = this.model.get('versions_control_advanced');
      this.settings = {
        majorMinorVersion: majorMinorVersion || false,
        permissionLevel: this.options.permissionLevel || 0
      };
      this._folderPermissionEnabled = majorMinorVersion || false;
      this.requiredFieldSwitchModel = new Backbone.Model({data: this._folderPermissionEnabled});
      require(['csui/controls/form/fields/booleanfield.view'], function (BooleanFieldView) {
        self.requiredFieldSwitchView = new BooleanFieldView({
          mode: 'writeonly',
          model: self.requiredFieldSwitchModel,
          labelId: self.requiredFieldsLabelId,
          onBeforeChange: _.bind(function () {
            if (self._folderPermissionEnabled) {
              self._disableVersionSettings().done(function (result) {
                self._folderPermissionEnabled = false;
                self.controlViewIsInFocus = false;
                self.settings.majorMinorVersion = false;
                self.settings.permissionLevel = result;
                self.settingsView.saveAndDestroySettingsDropdown();
                self.settingsView.restoreFocusToView();
                return true;
              }).fail(function () {
                self.controlViewIsInFocus = false;
                self.settingsView.destroyVersionControlView();
                self.settingsView.restoreFocusToView();
                return false;
              });
            } else {
              return true;
            }
          }, self)
        });
        self.$('.required-fields-switch').append(self.requiredFieldSwitchView.$el);
        self.requiredFieldSwitchView.render();
        self.requiredFieldSwitchView.on('field:changed', function (event) {
          self._folderPermissionEnabled = undefined;
          if (event.fieldvalue || event.fieldView.fieldvalue) {
            self._applyFolderPermissionLevel(self.$el.find('ul li:nth-child(1)'));
            self.ui.applyToFolderAndSubFoldersParentEle.removeClass('binf-hidden');
            self.settings.majorMinorVersion = true;
            self.settings.permissionLevel = 0;
          } else {
            self.ui.applyToFolderAndSubFoldersParentEle.addClass('binf-hidden');
            self.settings.majorMinorVersion = false;
          }
          self.refreshTabableElements();
        });
        self.triggerMethod("dom:refresh");
      });
    },

    onDomRefresh: function () {
      if (this.requiredFieldSwitchView &&
          $(this.requiredFieldSwitchView.ui.flagWriteField).length) {
        this.refreshTabableElements();
        this.tabableElements.length && this.tabableElements[0].focus();
      }
    },

    onClickToChangeFolderPermissionLevel: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var selectedItem,
          selectedField = $(event.target).attr('aria-label');
      if (lang.currentFolder === selectedField) {
        selectedItem = this.$el.find('ul li:nth-child(1)');
        this.settings.permissionLevel = 0;
      } else if (lang.currentAndSubfolder === selectedField) {
        selectedItem = this.$el.find('ul li:nth-child(2)');
        this.settings.permissionLevel = 2;
      }
      this._applyFolderPermissionLevel(selectedItem);
    },

    refreshTabableElements: function () {
      this.tabableElements = this.$el.find('input, ul li').filter(
          ':visible').toArray();
    },

    _applyFolderPermissionLevel: function (selectedItem) {
      var prevPermissionSelected = this.$el.find('.csui-folder-permissions-item.selected');
      if (!(selectedItem.find('.selected').length)) {
        if (prevPermissionSelected.length) {
          prevPermissionSelected.find('.cs-icon').removeClass('icon-listview-checkmark');
          prevPermissionSelected.removeClass('selected').attr("aria-selected", "false");
        }
        selectedItem.find('.cs-icon').addClass('icon-listview-checkmark');
        selectedItem.attr("aria-selected", "true");
        selectedItem.addClass('selected');
      }
    },

    onBeforeDestroy: function () {
      this.tabableElements = undefined;
      this._folderPermissionEnabled = undefined;
      this.controlViewIsInFocus = undefined;
      this.requiredFieldSwitchView && this.requiredFieldSwitchView.off('field:changed');
    },

    onKeyDown: function (event) {
      switch (event.keyCode) {
        case 13:
        case 32:
          this.onClickToChangeFolderPermissionLevel(event);
          break;
        case 9:
          this.moveInRegions(event);
          break;
        case 37:
        case 39:
          event.preventDefault();
          event.stopPropagation();
          break;
        case 38:
        case 40:
          this.moveInSelectionRegion(event);
          break;
      }
    },

    onKeyUp: function (event) {
      event.keyCode === 27 && this.trigger('closeDropdown');
    },

    moveInRegions: function (event) {
      var currentlyFocusedElementIndex = this.tabableElements && this.tabableElements.indexOf(event.target);
      if (this.tabableElements && this.tabableElements.length === 1) {
        event.stopPropagation();
        event.preventDefault();
      } else if (this.tabableElements) {
        if (currentlyFocusedElementIndex === 0) {
          this.tabableElements[1].classList.contains('selected') ? this.tabableElements[1].focus() :
          this.tabableElements[2].focus();
        } else {
          this.tabableElements[0].focus();
        }
        event.stopPropagation();
        event.preventDefault();
      }
    },

    moveInSelectionRegion: function (event) {
      var currentlyFocusedElementIndex = this.tabableElements && this.tabableElements.indexOf(event.target);
      if (this.tabableElements && this.tabableElements.length === 1 || currentlyFocusedElementIndex === 0) {
        event.stopPropagation();
        event.preventDefault();
      } else if (this.tabableElements) {
        if (currentlyFocusedElementIndex === 1) {
          this.tabableElements[2].focus();
        } else {
          this.tabableElements[1].focus();
        }
        event.stopPropagation();
        event.preventDefault();
      }
    },

    _disableVersionSettings: function () {
      this.controlViewIsInFocus = true;
      var view                  = new offVersionSettingsView(),
          versionControlOptions = {
            _view: view,
            standardHeader: false,
            title: lang.majorMinorVersion,
            dialogClassName: 'csui-version-settings-off',
            actionBtnLabel: lang.actionBtnLabel,
            cancelBtnLabel: lang.cancelBtnLabel
          };
      return new versionControlDialog(versionControlOptions).show();
    }

  });

  return VersionControlView;
});