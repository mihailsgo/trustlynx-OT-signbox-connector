/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/backbone',
  'csui-ext!csui/utils/usersettings/usersettings.tabs/usersettings.tabs'
], function (_, Backbone, extraUserSettingTabs) {
  'use strict';

  var userSettingsTab = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      viewClass: null,
      viewClassOptions: null,
      viewModel:null,
      enabled: function() {
        return true;
      }
    },

    constructor: function userSettingsTab(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var UserSettingsTabCollection = Backbone.Collection.extend({

    model: userSettingsTab,
    comparator: 'sequence',

    constructor: function UserSettingsTabCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var userSettingsTabs = new UserSettingsTabCollection();

  addExtensions(extraUserSettingTabs);

  function addExtensions(extensions) {
    if (extensions) {
      var tabsToAdd = _.filter(_.flatten(extensions, true), function (tabToAdd) {
        return tabToAdd.enabled && _.isFunction(tabToAdd.enabled) ? tabToAdd.enabled()
         : tabToAdd.enabled === undefined ? true : tabToAdd.enabled;        
      });
      userSettingsTabs.add(tabsToAdd);
    }
  }

  return userSettingsTabs;

});
