/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/lib/marionette',
  'csui/perspectives/mixins/perspective.edit.mixin',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/perspectives/banner-content-sidebar/banner-content-sidebar.perspective.view',
  'hbs!csui/perspectives/sidepanel-right/impl/sidepanel-right',
  'css!csui/perspectives/banner-content-sidebar/impl/banner-content-sidebar'
], function (module, _, Backbone, $, Marionette, PerspectiveEditMixin, LayoutViewEventsPropagationMixin, BannerContentSidebarView, perspectiveTemplate) {

  var SidepanelRightPerspectiveView = BannerContentSidebarView.extend({
    template: perspectiveTemplate,
    templateHelpers: function () {
      var showBanner;
      if (this.options.perspectiveMode === "edit" || (this.options.perspectiveMode === 'personalize' && !!this.options.banner.length)) {
        showBanner = true;
      } else {
        showBanner = !!this.options.banner.length && this.options.banner[0].hidden !== true ? true : false;
      }
      return {
        showBanner: showBanner,
        sidebarRight: true,
        sidebarLeft: false
      };
    },
    constructor: function SidepanelRightPerspectiveView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.perspectiveType = 'sidepanel-right';
      options.context.perspective.type = this.perspectiveType;
      BannerContentSidebarView.prototype.constructor.call(this, options);
    }
  });
  _.extend(SidepanelRightPerspectiveView.prototype, LayoutViewEventsPropagationMixin);
  PerspectiveEditMixin.mixin(SidepanelRightPerspectiveView.prototype);
  return SidepanelRightPerspectiveView;

});