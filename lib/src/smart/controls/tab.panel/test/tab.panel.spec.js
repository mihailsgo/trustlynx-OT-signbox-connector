/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/jquery', 'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/lib/marionette',
  'smart/controls/tab.panel/tab.panel.view', 'smart/controls/tab.panel/tab.links.ext.view',
  'smart/controls/tab.panel/tab.links.ext.scroll.mixin',
], function ($, _, Backbone, Marionette, TabPanelView, TabLinkCollectionViewExt,
    TabLinksScrollMixin) {
  'use strict';

  describe('TabPanelView', function () {
    it('can be created', function () {
      var collection = new Backbone.Collection(),
          tabPanel = new TabPanelView({collection: collection});
      expect(tabPanel instanceof TabPanelView).toBeTruthy();
    });

    it('can render tab with a Backbone.View as the contentView', function () {
      var emptyView = Backbone.View.extend({
        render: function () {}
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

    xit('can render tab title in the default language from multiple ones', function () {
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
    function initialializeTabPanel(TabLinkCollectionViewClass) {
      this.tabContainer = $('<div class="binf-widgets">').appendTo(document.body);
      this.tabPanelView = new TabPanelView({
        TabLinkCollectionViewClass: TabLinkCollectionViewClass,
        contentView: Marionette.View,
        collection: new Backbone.Collection([
          {title: 'Test1'}, {title: 'Test2'}, {title: 'Test3'}
        ]),
        delayTabContent: true
      });
      this.tabPanelRegion = new Marionette.Region({el: this.tabContainer});
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
      $('body').empty();
    });

    function checkTabActivations(done) {
      expect(eventFlow.length).toBeGreaterThan(1);
      expect(eventFlow.length % 2).toBe(0);
      for (var i = 0; i < eventFlow.length - 1; ++i) {
        expect(eventFlow[i]).toBeLessThan(eventFlow[i + 1]);
      }
      done();
    }

    it('programmatic activations do not continue endlessly', function (done) {
      initialializeTabPanel.call(this);

      var activeTab = this.tabPanelView.activeTab;

      this.tabPanelView.once('activate:tab', startWithTab1);
      activeTab.set('tabIndex', 1);
      setTimeout(checkTabActivations.bind(this, done), 500);

      function startWithTab1() {
        setTimeout(function () {
          activeTab.set('tabIndex', 2);
          setTimeout(function () { activeTab.set('tabIndex', 1) }, 1);
        });
      }
    });

    function testClickActions(done, TabLinkCollectionViewClass) {
      initialializeTabPanel.call(this, TabLinkCollectionViewClass);

      var tabLinks = this.tabPanelView.tabLinks.children;
      var tabLink1 = tabLinks.findByIndex(1);
      var tabLink2 = tabLinks.findByIndex(2);

      this.tabPanelView.once('activate:tab', startWithTab1);
      this.tabPanelView.activeTab.set('tabIndex', 1);
      setTimeout(checkTabActivations.bind(this, done), 500);

      function startWithTab1() {
        setTimeout(function () {
          click(tabLink2.ui.link[0]);
          setTimeout(function () {
            click(tabLink1.ui.link[0]);
          }, 1);
        });
      }
    }

    it('clicking activations do not continue endlessly', function (done) {
      testClickActions.call(this, done);
    });

    it('extended tab link view is covered too', function (done) {
      testClickActions.call(this, done, TabLinkCollectionViewExt);
    });
  });

  describe('keyboard navigation', function () {
    var tabPanelView;
    beforeAll(function () {
      this.tabContainer = $('<div class="binf-widgets">').appendTo(document.body);
      _.extend(TabPanelView.prototype, TabLinksScrollMixin);
      tabPanelView = new TabPanelView({
        TabLinkCollectionViewClass: TabLinkCollectionViewExt,
        contentView: Marionette.View,
        collection: new Backbone.Collection([
          {title: 'Test1'}, {title: 'Test2'}, {title: 'Test3'},
          {title: 'Test4'}, {title: 'Test5'}, {title: 'Test6'},
          {title: 'Test7'}, {title: 'Test8'}, {title: 'Test9'}
        ]),
        delayTabContent: true
      });
      this.tabPanelRegion = new Marionette.Region({el: this.tabContainer});
      this.tabPanelRegion.show(tabPanelView);
      tabPanelView._initializeToolbars();
      $(document.body).find('.tab-panel').css('max-width', '50%');
      setTimeout(function () {
        tabPanelView._initializeToolbars();
        tabPanelView._enableToolbarState();
      }, 1);
    });

    afterAll(function () {

      $('body').empty();

    });
    it("navigate to next tab using right arrow key", function () {
      var tabLinks = tabPanelView.tabLinks.children,
          tabLink1 = tabLinks.findByIndex(0),
          tabLink2 = tabLinks.findByIndex(1);

      click(tabLink1.ui.link[0]);
      $(tabLink1.ui.link[0]).trigger('focus');
      $(tabLink1.ui.link[0]).trigger({type: 'keydown', keyCode: 39});
      expect($(tabLink2.ui.link[0]).is(':focus')).toBeTruthy();
      $(tabLink2.ui.link[0]).trigger({type: 'keydown', keyCode: 13});
      expect($(tabLink2.ui.link[0]).parent().hasClass('binf-active')).toBeTruthy();
    });

    it("switch to end tab using End key", function (done) {
      var tabLinks = tabPanelView.tabLinks.children,
          lastTabIndex = tabPanelView.tabLinks.children.length - 1,
          lastTab = tabLinks.findByIndex(lastTabIndex),
          tabLink2 = tabLinks.findByIndex(1);
      $(tabLink2.ui.link[0]).trigger({type: 'keydown', keyCode: 35});
      expect($(lastTab.ui.link[0]).is(':focus')).toBeTruthy();
      done();
    });

    it("navigate to previous tab using left arrow key", function (done) {
      var tabLinks = tabPanelView.tabLinks.children,
          lastTabIndex = tabPanelView.tabLinks.children.length - 1,
          leftElIndex = tabPanelView.tabLinks.children.length - 2,
          lastTab = tabLinks.findByIndex(lastTabIndex),
          leftTab = tabLinks.findByIndex(leftElIndex);
      $(lastTab.ui.link[0]).trigger({type: 'keydown', keyCode: 37});
        expect($(leftTab.ui.link[0]).is(':focus')).toBeTruthy();
        done();

    });

    it("on enter on tab, it should be active", function (done) {
      var tabLinks = tabPanelView.tabLinks.children,
          leftElIndex = tabPanelView.tabLinks.children.length - 2,
          leftTab = tabLinks.findByIndex(leftElIndex);
      $(leftTab.ui.link[0]).trigger({type: 'keydown', keyCode: 32});
        expect($(leftTab.ui.link[0]).parent().hasClass('binf-active')).toBeTruthy();
        done();
    });

    it("switch to first tab using Home key", function (done) {
      var tabLinks = tabPanelView.tabLinks.children,
          leftElIndex = tabPanelView.tabLinks.children.length - 2,
          leftTab = tabLinks.findByIndex(leftElIndex),
          tabLink1 = tabLinks.findByIndex(0);
      $(leftTab.ui.link[0]).trigger({type: 'keydown', keyCode: 36});
        expect($(tabLink1.ui.link[0]).is(':focus')).toBeTruthy();
        done();
    });

    it("on tab, the focus should shift to body", function (done) {
      var tabLinks = tabPanelView.tabLinks.children,
          tabLink1 = tabLinks.findByIndex(0),
          tabLink2 = tabLinks.findByIndex(1);
      $(tabLink1.ui.link[0]).trigger({type: 'keydown', keyCode: 9});
        expect($(tabLink2.ui.link[0]).is(':focus')).toBeFalsy();
        done();
    });

    it("on shift+tab, should get the lastfocused element", function (done) {
      var tabLinks = tabPanelView.tabLinks.children,
          tabLink1 = tabLinks.findByIndex(0),
          prevFocusedEle = tabPanelView.currentlyFocusedElement(true);
        expect(tabLink1.ui.link[0]).toEqual(prevFocusedEle[0]);
        done();
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
