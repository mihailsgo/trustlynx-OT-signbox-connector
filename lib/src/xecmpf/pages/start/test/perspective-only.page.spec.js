/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/backbone',
  'xecmpf/pages/start/perspective-only.page.view',
  'csui/pages/start/perspective.routing',
  'xecmpf/pages/start/test/perspective-only.page.mock.data',
  "css!csui/themes/carbonfiber/theme",
], function ($, Backbone,  PerspectiveOnlyPageView, PerspectiveRouting,
    PerspectiveOnlyPageMockData) {

  describe('PerspectiveView After Successful Signin', function () {
    var fetchSpy, deferred;
    var perspectiveOnlyPageView, perspectivePanelView, perspectiveContext;
    var originalTimeout;

    beforeAll(function () {
      PerspectiveOnlyPageMockData.enable();

      require.config({
        config: {
          'csui/utils/contexts/factories/connector': {
            connection: {
              url: "//server/otcs/cs/api/v1",
              supportPath: '/img16',
              credentials: {
                username: '',
                password: ''
              }
            }
          }
        }
      });

      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
      spyOn(PerspectiveRouting, 'routesWithSlashes').and.returnValue(false);
      perspectiveOnlyPageView = new PerspectiveOnlyPageView();
      fetchSpy = spyOn(perspectiveOnlyPageView.perspectivePanel, "_showPerspective").and.callThrough();
      perspectiveOnlyPageView.render();
      perspectiveContext =  perspectiveOnlyPageView.perspectivePanel.options.context;
      perspectivePanelView = perspectiveOnlyPageView.perspectivePanel;
      deferred = $.Deferred();

      perspectiveOnlyPageView.perspectivePanel.options.context.on("sync", function () {
        setTimeout(function () {
          deferred.resolve();
        }, 500);
      });
    });

    afterAll(function () {
      PerspectiveOnlyPageMockData.disable();
      perspectiveOnlyPageView.destroy();
      var b = $('body');
      if ( b.length !== 1 ){// body was erased, add it for other tests again
          document.body = document.createElement('body');
      }
      $('body').empty();
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      Backbone.history.stop();
    });

    it('perspective fetch is successful', function () {
      deferred.promise().done(function () {
        expect(fetchSpy).toHaveBeenCalled();
      });
    });

    it('perspective view is rendered', function () {
      deferred.promise().done(function () {
        expect(perspectiveOnlyPageView).toBeDefined();
        expect(perspectiveOnlyPageView.$el.length).toBe(1);
        expect(perspectiveOnlyPageView.$el.hasClass("binf-widgets") > 0).toBeTruthy();
        expect(perspectiveOnlyPageView.$el.hasClass("xecm-page-widget") > 0).toBeTruthy();
      });
    });

    it('page has no header', function () {
      deferred.promise().done(function () {
        expect(perspectiveOnlyPageView.$el.find('.csui-navbar').length > 0).toBeFalsy();
      });
    });

    it('page has no breadcrumb', function () {
      deferred.promise().done(function () {
        expect(perspectiveOnlyPageView.$el.find('.breadcrumb-wrap').length).toBe(0);
      });
    });

    it('page has perspective panel', function () {
      deferred.promise().done(function () {
        expect(perspectiveOnlyPageView.$el.find('.cs-perspective-panel').length).toBe(1);
        expect(perspectiveOnlyPageView.$el.find('.cs-perspective').length).toBe(1);
      });
    });

  });

});
