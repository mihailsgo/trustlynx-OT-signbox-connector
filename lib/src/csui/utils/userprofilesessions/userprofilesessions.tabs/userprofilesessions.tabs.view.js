/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette3',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/utils/userprofilesessions/userprofilesessions.tabs/userprofilesessions.tabs',
], function ($, _, Marionette, PerfectScrollingBehavior, userprofilesessionsTabs) {
  'use strict';
  var UserSettingsTabsView = Marionette.CollectionView.extend({
    tagName: 'div',
    className: 'csui-userprofilesessions',
    
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },

    constructor: function UserSettingsTabsView(options) {
      options || (options = {});
      this.options = options;
      this.collection = userprofilesessionsTabs;
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },

    childView: function (userprofilesessionsTabModel) {
      return userprofilesessionsTabModel.get('viewClass');
    },

    childViewOptions: function (userprofilesessionsTabModel) {
      return _.extend({
        context: this.options.context,
        connector: this.options.connector,
        userid: this.options.userid,
        settingsModeChanged:false
      }, userprofilesessionsTabModel.get('viewClassOptions'));
    }

  });

  return UserSettingsTabsView;

});
