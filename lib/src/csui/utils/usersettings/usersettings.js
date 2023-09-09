/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/utils/usersettings/usersettings.tabs/usersettings.tabs.view',
  'csui/utils/usersettings/usersettings.tabs/usersettings.tabs',
  'i18n!csui/utils/usersettings/impl/nls/lang'
], function (UserSettingsTabsView, UserSettingsTabs, lang) {
  "use strict";

  return [{
    tabName: "usersettings",
    tabDisplayName: lang.settingsTabTitle,
    tabContentView: UserSettingsTabsView,
    showTab: function (model, options) {
      if (UserSettingsTabs.length && options.enableSimpleSettingsModel === true &&
          options.showUserSettings !== undefined) {
        return options.showUserSettings === true;
      }
      return false;
    }
  }];
});