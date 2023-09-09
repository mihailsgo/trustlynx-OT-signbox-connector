/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette3',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/utils/usersettings/usersettings.tabs/usersettings.tabs',
], function ($, _, Marionette, PerfectScrollingBehavior, usersetingsTabs) {
  'use strict';
  var UserSettingsTabsView = Marionette.CollectionView.extend({
    tagName: 'div',
    className: 'csui-usersettings',
    
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
      this.collection = usersetingsTabs;
      Marionette.CollectionView.prototype.constructor.call(this, options);
    },

    childView: function (usersettingTabModel) {
      return usersettingTabModel.get('viewClass');
    },

    childViewOptions: function (usersettingTabModel) {
      return _.extend({
        context: this.options.context,
        connector: this.options.connector,
        userid: this.options.userid,
        settingsModeChanged:false
      }, usersettingTabModel.get('viewClassOptions'));
    },

    onRender: function () {
      var allFormsRendered = [];
      this.children.each(_.bind(function (childView) {
        var formRendered = $.Deferred();
        allFormsRendered.push(formRendered.promise());
        this.listenTo(childView, 'childview:rendered', function () {
          formRendered.resolve();
        });

        this.listenTo(childView.model, 'change:settingsModeChanged', function () {
          var pageReload = this.children.filter(function(child){
            return !!child.settingsModeChanged;
          }).length;
          var suw_view = this.$el.parents('div.esoc-simple-user-widget-view')[0];
          $(suw_view).toggleClass('csui-dialog-page-reload', !!pageReload);
        });
      }, this));
      $.whenAll.apply($, allFormsRendered).then(_.bind(function () {
        this.triggerMethod('update:scrollbar');
      }, this));
    },

  });

  return UserSettingsTabsView;

});
