/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/backbone',
  'csui-ext!csui/utils/userprofilesessions/userprofilesessions.tabs/userprofilesessions.tabs'
], function (_, Backbone, extraUserProfileSessionsTabs) {
  'use strict';

  var userProfileSessionsTab = Backbone.Model.extend({

    defaults: {
      viewClass: extraUserProfileSessionsTabs,
      viewClassOptions: null,
      viewModel:null,
      enabled: function() {
        return true;
      }
    },

    constructor: function userProfileSessionsTab(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var userProfileSessionsTabCollection = Backbone.Collection.extend({

    model: userProfileSessionsTab,
    comparator: 'sequence',

    constructor: function userProfileSessionsTabCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var userProfileSessionsTabs = new userProfileSessionsTabCollection();  

  addExtensions(extraUserProfileSessionsTabs);

  function addExtensions(extensions) {
    if (extensions) {
      var tabsToAdd = _.filter(_.flatten(extensions, true), function (tabToAdd) {
        return tabToAdd.enabled && _.isFunction(tabToAdd.enabled) ? tabToAdd.enabled()
         : tabToAdd.enabled === undefined ? true : tabToAdd.enabled;
      });
      userProfileSessionsTabs.add(tabsToAdd);
    }
  }
  return userProfileSessionsTabs;

});
