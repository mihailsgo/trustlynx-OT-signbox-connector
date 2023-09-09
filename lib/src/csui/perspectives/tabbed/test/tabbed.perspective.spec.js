/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/perspectives/tabbed/tabbed.perspective.view', 'json!./perspective.json'
], function (_, $, Marionette, PerspectiveContext, TabbedPerspectiveView, perspective) {

  describe('TabbedPerspectiveView', function () {
    describe('given empty configuration', function () {
      var context, perspectiveView;

      beforeEach(function () {
        if (!context) {
          context = new PerspectiveContext({
            factories: {
              connector: {
                connection: {
                  url: '//server/otcs/cs/api/v1',
                  supportPath: '/support',
                  session: {
                    ticket: 'dummy'
                  }
                }
              }
            }
          });
        }
        perspectiveView = new TabbedPerspectiveView({
          context: context
        });
      });

      it('assigns right classes', function () {
        var className = perspectiveView.$el.attr('class');
        expect(className).toBeDefined();
        var classes = className.split(' ');
        expect(classes).toContain('cs-perspective');
        expect(classes).toContain('cs-tabbed-perspective');
      });

      it('renders empty output', function () {
        expect(perspectiveView.$el.html()).toBe('');
      });
    });

    describe('when tabs are activated rapidly', function () {
      beforeEach(function (done) {
        this.perspectiveContext = new PerspectiveContext();
        this.perspectiveContainer = $('<div class="binf-widgets">').appendTo(document.body);
        this.perspectiveView = new TabbedPerspectiveView(_.extend({
          context: this.perspectiveContext,
          delayTabContent: true
        }, perspective.options));
        this.perspectiveRegion = new Marionette.Region({ el: this.perspectiveContainer });
        this.perspectiveView.widgetsResolved.then(function () {
          this.perspectiveRegion.show(this.perspectiveView);
          done();
        }.bind(this));
      });

      afterEach(function () {
        this.perspectiveView.off('activate:tab');
        this.perspectiveRegion.empty();
        this.perspectiveContainer.remove();
      });

      it('widget data is collected during the first rendering', function (done) {
        var tabPanel = this.perspectiveView.tabPanel;
        var eventCount = 0;
        tabPanel
          .on('before:populate:tab', function (tabPanel, tabPane) {
            expect(tabPane.contextFragment).toBeTruthy();
            expect(tabPane.content).toBeFalsy();
            ++eventCount;
          }.bind(this))
          .on('populate:tab', function (tabPanel, tabPane) {
            expect(tabPane.contextFragment).toBeFalsy();
            expect(tabPane.content).toBeTruthy();
            expect(tabPane.content.isRendered).toBeTruthy();
            ++eventCount;
          }.bind(this));

        setTimeout(function () {
          expect(eventCount).toBe(4);
          done();
        }, 1000);

        var activeTab = tabPanel.activeTab;
        setTimeout(function () {
          activeTab.set('tabIndex', 1);
          setTimeout(function () {
            activeTab.set('tabIndex', 2);
          }, 1);
        }, 1);
      });
    });
  });
});
