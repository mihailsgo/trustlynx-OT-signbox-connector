/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/tab.panel/tab.panel.view', 'csui/controls/tab.panel/tab.links.ext.view'
], function ($, Backbone, Marionette, TabPanelView, TabLinkCollectionViewExt) {
  'use strict';

  describe('TabPanelView', function () {
    it('can be created', function () {
      var collection = new Backbone.Collection(),
          tabPanel = new TabPanelView({collection: collection});
      expect(tabPanel instanceof TabPanelView).toBeTruthy();
    });

    it('can render tab with a Backbone.View as the contentView', function () {
      var emptyView = Backbone.View.extend({
        render: function() {}
      });
      var collection = new Backbone.Collection([{title: 'Test'}]);
      var tabPanel = new TabPanelView({
            contentView: emptyView,
            collection: collection
          });
      expect(tabPanel).toBeDefined();
      tabPanel.render();
    });

    it('can render tab title in single language', function () {
      var collection = new Backbone.Collection([
            {title: 'Test'}
          ]),
          tabPanel = new TabPanelView({
            contentView: Marionette.View,
            collection: collection
          });
      tabPanel.render();
      var links = tabPanel.tabLinks.children;
      expect(links.length).toEqual(1);
      var linkText = links.first().$el.text().replace(/\s+/g, '');
      expect(linkText).toEqual('Test');
    });

    it('can render tab title in the default language from multiple ones', function () {
      var collection = new Backbone.Collection([
            {
              title: {
                en: 'English',
                de: 'Deutsch'
              }
            }
          ]),
          tabPanel = new TabPanelView({
            contentView: Marionette.View,
            collection: collection
          });
      tabPanel.render();
      var links = tabPanel.tabLinks.children;
      expect(links.length).toEqual(1);
      var linkText = links.first().$el.text().replace(/\s+/g, '');
      expect(linkText).toEqual('English');
    });

    it('creates and all content views when rendered by default', function () {
      var collection = new Backbone.Collection([
            {title: 'Test1'}, {title: 'Test2'}
          ]),
          tabPanel = new TabPanelView({
            contentView: Marionette.View,
            collection: collection
          });
      tabPanel.render();
      var contents = tabPanel.tabContent.children;
      expect(contents.length).toEqual(2);
      expect(contents.findByIndex(0).content).toBeTruthy();
      expect(contents.findByIndex(1).content).toBeTruthy();
    });

    it('creates only content view for the active tab if specified', function () {
      var collection = new Backbone.Collection([
            {title: 'Test1'}, {title: 'Test2'}
          ]),
          tabPanel = new TabPanelView({
            contentView: Marionette.View,
            collection: collection,
            delayTabContent: true
          });
      tabPanel.render();
      var contents = tabPanel.tabContent.children;
      expect(contents.length).toEqual(2);
      expect(contents.findByIndex(0).content).toBeTruthy();
      expect(contents.findByIndex(1).content).toBeFalsy();
    });

    it('creates only content view for the active tab if not first', function () {
      var collection = new Backbone.Collection([
            {title: 'Test1'}, {title: 'Test2'}
          ]),
          tabPanel = new TabPanelView({
            contentView: Marionette.View,
            collection: collection,
            delayTabContent: true,
            activeTab: new Backbone.Model({tabIndex: 1})
          });
      tabPanel.render();
      var contents = tabPanel.tabContent.children;
      expect(contents.length).toEqual(2);
      expect(contents.findByIndex(0).content).toBeFalsy();
      expect(contents.findByIndex(1).content).toBeTruthy();
    });

  });

  describe('when tabs are activated rapidly', function () {
    var eventBeforeIndex, eventAfterIndex, eventFlow;
    function initialializeTabPanel(TabLinkCollectionViewClass, overlappingTabActivation) {
      this.tabContainer = $('<div class="binf-widgets">').appendTo(document.body);
      this.tabPanelView = new TabPanelView({
        TabLinkCollectionViewClass: TabLinkCollectionViewClass,
        contentView: Marionette.View,
        collection: new Backbone.Collection([
          { title: 'Test1' }, { title: 'Test2' }, { title: 'Test3' }
        ]),
        delayTabContent: true,
        overlappingTabActivation: overlappingTabActivation
      });
      this.tabPanelRegion = new Marionette.Region({ el: this.tabContainer });
      this.tabPanelRegion.show(this.tabPanelView);

      registerActivationCounters.call(this);
    }

    function registerActivationCounters() {
      eventBeforeIndex = -1;
      eventAfterIndex = 0;
      eventFlow = [];

      this.tabPanelView.on('before:activate:tab', countBeforeTabActivations);
      this.tabPanelView.on('activate:tab', countTabActivations);

      function countBeforeTabActivations() {
        eventBeforeIndex += 2;
        eventFlow.push(eventBeforeIndex);
      }

      function countTabActivations() {
        eventAfterIndex += 2;
        eventFlow.push(eventAfterIndex);
      }
    }

    afterEach(function () {
      this.tabPanelView.off('activate:tab');
      this.tabPanelRegion.empty();
      this.tabContainer.remove();
    });

    function checkTabActivations(done, overlappingTabActivation) {
      var i, j;
      expect(eventFlow.length).toBeGreaterThan(1);
      expect(eventFlow.length % 2).toBe(0);
      if (overlappingTabActivation === false) {
        for (i = 0; i < eventFlow.length - 1; ++i) {
          expect(eventFlow[i]).toBeLessThan(eventFlow[i + 1]);
        }
      } else {
        var overlapping;
        out: for (i = 0; i < eventFlow.length; ++i) {
          for (j = i - 1; j >= 0; --j) {
            if (eventFlow[i] < eventFlow[j]) {
              overlapping = true;
              break out;
            }
          }
        }
      }
      checkContent.call(this, done, 1);
    }

    function checkContent(done, start) {
      for (var i = start || 0; i < 3; ++i) {
        var tabContent = this.tabPanelView.tabContent.children.findByIndex(i);
        expect(tabContent.content).toBeTruthy();
      }
      done();
    }

    function checkActiveClasses(done) {
      expect(this.tabPanelView.tabContent.$el.find('.binf-tab-pane.binf-active').length).toBe(1);
      done();
    }

    function testContentWithProgrammaticActivation(done, overlappingTabActivation) {
      initialializeTabPanel.call(this, undefined, overlappingTabActivation);

      var activeTab = this.tabPanelView.activeTab;
      activeTab.set('tabIndex', 0);
      setTimeout(checkContent.bind(this, done, 0), 1000);
      setTimeout(function () {
        activeTab.set('tabIndex', 1);
        setTimeout(function () {
          activeTab.set('tabIndex', 2);
        }, 1);
      }, 1);
    }

    it('content is created with overlapping activations', function (done) {
      testContentWithProgrammaticActivation.call(this, done);
    });

    it('content is created with overlapping activations disabled', function (done) {
      testContentWithProgrammaticActivation.call(this, done, false);
    });

    function testProgrammaticActivation(done, overlappingTabActivation) {
      initialializeTabPanel.call(this, undefined, overlappingTabActivation);

      var activeTab = this.tabPanelView.activeTab;

      this.tabPanelView.once('activate:tab', startWithTab1);
      activeTab.set('tabIndex', 1);
      setTimeout(checkTabActivations.bind(this, done, overlappingTabActivation), 500);

      function startWithTab1() {
        setTimeout(function () {
          activeTab.set('tabIndex', 2);
          setTimeout(function () { activeTab.set('tabIndex', 1); }, 1);
        });
      }
    }

    it('overlapping activations are allowed by default', function (done) {
      testProgrammaticActivation.call(this, done);
    });

    it('programmatic activations do not continue endlessly', function (done) {
      testProgrammaticActivation.call(this, done, false);
    });

    function testClickActions(done, TabLinkCollectionViewClass, overlappingTabActivation) {
      initialializeTabPanel.call(this, TabLinkCollectionViewClass, overlappingTabActivation);

      var tabLinks = this.tabPanelView.tabLinks.children;
      var tabLink1 = tabLinks.findByIndex(1);
      var tabLink2 = tabLinks.findByIndex(2);

      this.tabPanelView.once('activate:tab', startWithTab1);
      this.tabPanelView.activeTab.set('tabIndex', 1);
      setTimeout(checkTabActivations.bind(this, done, overlappingTabActivation), 500);

      function startWithTab1() {
        setTimeout(function () {
          click(tabLink2.ui.link[0]);
          setTimeout(function () {
            click(tabLink1.ui.link[0]);
          }, 1);
        });
      }
    }

    it('clicking activations allow overlapping by default', function (done) {
      testClickActions.call(this, done);
    });

    it('clicking activations do not continue endlessly', function (done) {
      testClickActions.call(this, done, undefined, false);
    });

    it('extended tab link view is covered too', function (done) {
      testClickActions.call(this, done, TabLinkCollectionViewExt, false);
    });

    function testActiveClass(done, overlappingTabActivation) {
      initialializeTabPanel.call(this, undefined, overlappingTabActivation);

      var activeTab = this.tabPanelView.activeTab;
      activeTab.set('tabIndex', 1);
      this.tabPanelView.once('activate:tab', startWithTabs);
      setTimeout(checkActiveClasses.bind(this, done), 1000);

      function startWithTabs() {
        setTimeout(function () {
          setTimeout(function () {
            activeTab.set('tabIndex', 0);
            setTimeout(function () {
              activeTab.set('tabIndex', 1);
            }, 1);
          }, 1);
        });
      }
    }

    it('binf-active class is assigned to just one tab pane with overlapping activations on', function (done) {
      testActiveClass.call(this, done);
    });

    xit('binf-active class is assigned to just one tab pane with overlapping activations off', function (done) {
      testActiveClass.call(this, done, false);
    });
  });

  function click(element) {
    var event = new MouseEvent('click', {
      isTrusted: true,
      bubbles: true,
      cancelable: true,
      view: window
    });
    return element.dispatchEvent(event);
  }
});
