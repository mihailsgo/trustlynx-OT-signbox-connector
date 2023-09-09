/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/marionette', 'csui/lib/fastclick',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/factories/connector',
  'csui/pages/start/multi.perspective.routing', 'csui/utils/base',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/utils/page.leaving.blocker',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/iconpreload/icon.preload.view',
  "css!xecmpf/pages/start/perspectivewithoutheader"
], function (_, $, Marionette, FastClick,
  PerspectiveContext, ConnectorFactory, MultiPerspectiveRouting,
  base, PerspectivePanelView, ViewEventsPropagationMixin,
  TabablesBehavior, PageLeavingBlocker, GlobalMessage, IconPreloadView) {

  var PerspectiveOnlyPageView = Marionette.ItemView.extend({

    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior
      }
    },

    template: false,

    constructor: function PerspectiveOnlyPageView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);

      if (!this.options.el) {
        this.setElement(document.body);
      }
      var context = options.context || new PerspectiveContext(),
        connector = context.getObject(ConnectorFactory);
      context.options = context.options || {};
      context.options.suppressReferencePanel = true;

      context.options.navigateMode = options.navigateMode;
      context.options.enableWorkspaceNavigation = true;
      if (!connector.connection.credentials &&
        !connector.authenticator.isAuthenticated() &&
        !connector.authenticator.syncStorage().isAuthenticated()) {
        this._navigateToSignIn();
        return;
      }

      this.perspectivePanel = new PerspectivePanelView({
        context: context
      });
      this.propagateEventsToViews(this.perspectivePanel);
      var routing = new MultiPerspectiveRouting({
        context: context
      });
      routing.ensureStart({
        pushState: true
      });
      if (base.isAppleMobile()) {
        this.$el.addClass('csui-on-ipad');
      }
      FastClick.attach(this.el);
      $(window).on("unload", function () {});
    },

    onRender: function () {
      if (!this._redirecting) {
        this.$el.addClass("binf-widgets xecm-page-widget");
        this.$el.append("<div class='binf-widgets xecm-page-widget-sub-wrapper'></div>");
        this.$el.find('.xecm-page-widget-sub-wrapper').addClass("xecm-no-iframe-wrap");

        IconPreloadView.ensureOnThePage();
        GlobalMessage.setMessageRegionView(this, {
          classes: "xecm-global-message",
          useClass: true,
          sizeToParentContainer: true
        });
        var perspectiveRegion = new Marionette.Region({
          el: this.$el.find("div.xecm-page-widget-sub-wrapper")
        });
        perspectiveRegion.show(this.perspectivePanel);
      }
    },

    _navigateToSignIn: function () {
      if (MultiPerspectiveRouting.routesWithSlashes()) {
        PageLeavingBlocker.forceDisable();
        location.reload();
      }
      this._redirecting = true;
    }

  });

  _.extend(PerspectiveOnlyPageView.prototype, ViewEventsPropagationMixin);

  return PerspectiveOnlyPageView;

});