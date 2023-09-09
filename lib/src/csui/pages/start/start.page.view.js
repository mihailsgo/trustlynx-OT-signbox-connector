/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone','csui/lib/marionette', 'csui/utils/routing',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/factories/connector',
  'csui/pages/start/perspective.routing', 'csui/utils/base',
  'csui/pages/start/impl/navigationheader/navigationheader.view',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/utils/non-attaching.region/non-attaching.region',
  'csui/utils/page.leaving.blocker', 'csui/controls/iconpreload/icon.preload.view',
  'csui/pages/error.page/error.page.view',
  'css!csui/pages/start/impl/start.page'
], function (module, _, $, Backbone, Marionette, routing, PerspectiveContext, ConnectorFactory,
    PerspectiveRouting, base, NavigationHeaderView, PerspectivePanelView,
    ViewEventsPropagationMixin, TabablesBehavior, TabableRegionBehavior, NonEmptyingRegion,
    NonAttachingRegion, PageLeavingBlocker, IconPreloadView, ErrorPageView) {
  'use strict';

  var config = _.extend({
    signInPageUrl: 'signin.html',
    redirectToSignInPage: !routing.routesWithSlashes()
  }, module.config());

  var StartPageView = Marionette.ItemView.extend({
    template: false,

    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior
      }
    },

    constructor: function StartPageView(options) {
      options || (options = {});
      options.el = document.body;

      Marionette.View.prototype.constructor.call(this, options);
      var context = options.context || new PerspectiveContext();
      var connector = context.getObject(ConnectorFactory);
      this.context = context;
      if (!connector.connection.credentials &&
          !connector.authenticator.isAuthenticated() &&
          !connector.authenticator.syncStorage().isAuthenticated() &&
          !(connector.authenticator.interactive && connector.authenticator.interactive()) ) {
        if (!config.redirectToSignInPage) {
          this._showMissingCredentialsError();
        } else {
          this._navigateToSignIn();
        }
        return;
      }
      connector.authenticator.on('loggedOut', function (args) {
        if (args.reason === 'failed') {
          this._navigateToSignIn();
        }
        context.viewStateModel && context.viewStateModel.clean();
      }, this);
      this.navigationHeader = new NavigationHeaderView({
        context: context,
        signInPageUrl: this.options.signInPageUrl
      });

      this.context = context;

      this.perspectivePanel = new PerspectivePanelView({
        context: context
      });
      this.listenTo(this.perspectivePanel, 'before:start:perspective:loading', function () {
        this.el.classList.add('mouse-blocked');
      })
      .listenTo(this.perspectivePanel, 'after:finish:perspective:loading', function () {
        this.el.classList.remove('mouse-blocked');
      });
      if (this.options.applyFastTheme && this.perspectivePanel) {
        document.body.classList.add('csui-pre-loading');

        this.listenToOnce(this.perspectivePanel, 'before:start:perspective:loading', function () {
        });

        this.listenToOnce(this.perspectivePanel, 'after:finish:perspective:loading', function () {
          var preLoaderElement = this.options.preLoaderEle || '#csui-pre-loader';
          $('body > ' + preLoaderElement).remove();
          document.body.classList.remove('csui-pre-loading');
        });
      }

      this.propagateEventsToViews(this.navigationHeader, this.perspectivePanel);

      var routing = PerspectiveRouting.getInstance({
        context: context
      });
      routing.start();
      this.$el.addClass('binf-widgets');
      if (base.isAppleMobile()) {
        this.$el.addClass('csui-on-ipad');
      }
      
      if (base.isIOSBrowser()) {
        this.$el.addClass('csui-on-macintosh');
      }

      require(['csui/utils/accessibility'
      ], function (Accessibility) {
        Accessibility.isAccessibleMode() && this.$el.addClass('accessibility');
      }.bind(this));
      $(window).on('unload', function () {});
    },

    onRender: function () {
      if (this._redirecting) {
        return this;
      }

      IconPreloadView.ensureOnThePage();

      this._appendView(this.navigationHeader);
      this._appendView(this.perspectivePanel);
      this.$el.children('.cs-perspective-panel').attr('role', 'main');
      setTimeout(_.bind(function () {
        var bodyRegion = new NonAttachingRegion({el: this.el});
        bodyRegion.show(this, {render: false});
      }, this));
      this.$el.on('globalmessage.shown', function (event, view) {
        var messageTabable = new TabableRegionBehavior(view.options, view);
      });
    },

    onBeforeDestroy: function () {
      this.navigationHeader && this.navigationHeader.destroy();
      this.perspectivePanel && this.perspectivePanel.destroy();
    },

    _appendView: function (view) {
      var region = new NonEmptyingRegion({el: this.el});
      region.show(view);
    },

    _navigateToSignIn: function () {
      if (!config.redirectToSignInPage) {
        PageLeavingBlocker.forceDisable();
        location.reload();
      } else {
        var signInPageUrl = this.options.signInPageUrl || config.signInPageUrl,
            query         = location.search;
        query += query ? '&' : '?';
        query += 'nextUrl=' + encodeURIComponent(location.pathname);
        location.href = signInPageUrl + query + location.hash;
      }
      this._redirecting = true;
    },

    _showMissingCredentialsError: function() {
      var errorModel    = new Backbone.Model({
          message:  'The StartPageView was created without providing valid authentication data.',
          hideNavigationButtons: true,
          errorCode: 401,
          showLogout: false
        }),
        errorPageView = new ErrorPageView({
          model: errorModel
        });
      errorPageView.render();
    }

  });

  _.extend(StartPageView.prototype, ViewEventsPropagationMixin);

  return StartPageView;
});
