/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/next.node',
  'conws/perspectives/tabbed/tab.index/conws.tab.index.preferences.extension',
  'conws/utils/commands/goto.location'
], function ($, Backbone,
  PageContext,
  NextNodeModelFactory,
  conwsTabIndexPreferencesExtensions
) {

  describe('ConwsTabIndexPreferencesTest', function () {

    var pageContext;
    var plugin;
    var nextNode;
    var result;

    function testsetup() {

      pageContext = new PageContext({
        factories: {
          connector: {
            assignTo: function assignTo(what) {
              what && (what.connector = this);
            },
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

      nextNode = pageContext.getModel(NextNodeModelFactory);
      plugin = conwsTabIndexPreferencesExtensions[0];

      return $.Deferred().resolve().promise();
    }

    function teardown() {
      return $.Deferred().resolve().promise();
    }

    it("one extension exists",function(done){
      result = conwsTabIndexPreferencesExtensions && conwsTabIndexPreferencesExtensions[0];
      expect(result).toBeDefined('extension is defined');
      result = conwsTabIndexPreferencesExtensions && conwsTabIndexPreferencesExtensions.length;
      expect(result).toEqual(1,'only one extension'); // extend these tests, if there is more than one extension!
      done();
    });

    describe("Navigate to tabbed perspective",function(){

      beforeAll(function (done) {

        testsetup().then(function(){
          pageContext.perspective = new Backbone.Model({
            options: {
              tabs: [
                {
                  columns: [
                    {
                      widget: {
                        type: "dummy for first tab"
                      }
                    }
                  ]
                },
                {
                  columns: [
                    {
                      widget: {
                        type: "csui/widgets/nodestable"
                      }
                    }
                  ]
                }
              ]
            }
          });
          done();
        }, done.fail);

      });

      afterAll(function (done) {

        teardown().then(done, done.fail);

      });

      describe("to a workspace",function(){

        beforeAll(function (done) {

          nextNode.set({ type: 848, id: 1010101, volume_id: 1010102 });
          nextNode.set("data", { bwsinfo: {id: 1010101} });
          done();

        });

        afterAll(function (done) {

          done();

        });

        it("by default sets the first tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated',undefined);
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(0,'tabindex is first tab');
          done();
        });

        it("for gotoLocation sets the folderbrowser tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated','gotoLocation');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(1,'tabindex is folderbrowser tab');
          done();
        });

        it("for browseView sets the first tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated','browseView');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(0,'tabindex is first tab');
          done();
        });

        it("for conwsLink sets the first tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated','conwsLink');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(0,'tabindex is first tab');
          done();
        });

      });

      describe("to a subfolder of a workspace",function(){

        beforeAll(function (done) {

          nextNode.set({ type: 0, id: 1010101, volume_id: -1010102 });
          nextNode.set("data", { bwsinfo: {id: 1010102} });
          done();

        });

        afterAll(function (done) {

          done();

        });

        it("by default sets the folderbrowser tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated',undefined);
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(1,'tabindex is folderbrowser tab');
          done();
        });

        it("for gotoLocation sets the folderbrowser tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated','gotoLocation');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(1,'tabindex is folderbrowser tab');
          done();
        });

        it("for browseView sets the first tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated','browseView');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(0,'tabindex is first tab');
          done();
        });

        it("for conwsLink sets the folderbrowser tab",function(done){
          pageContext.viewStateModel.set('conwsNavigated','conwsLink');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toEqual(1,'tabindex is folderbrowser tab');
          done();
        });

      });

      describe("to a folder outside a workspace",function(){

        beforeAll(function (done) {

          nextNode.set({ type: 0, id: 1010101, volume_id: 1010102 });
          nextNode.set("data", { bwsinfo: {id: null} });
          done();

        });

        afterAll(function (done) {

          done();

        });

        it("by default sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated',undefined);
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for gotoLocation sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','gotoLocation');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for browseView sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','browseView');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for conwsLink sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','conwsLink');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

      });

    })

    describe("Navigate to non tabbed perspective",function(){

      beforeAll(function (done) {

        testsetup().then(function(){
          pageContext.perspective = new Backbone.Model({ options: {} });
          done();
        }, done.fail);

      });

      afterAll(function (done) {

        teardown().then(done, done.fail);

      });

      describe("to a workspace",function(){

        beforeAll(function (done) {

          nextNode.set({ type: 848, id: 1010101, volume_id: 1010102 });
          nextNode.set("data", { bwsinfo: {id: 1010101} });
          done();

        });

        afterAll(function (done) {

          done();

        });

        it("by default sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated',undefined);
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for gotoLocation sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','gotoLocation');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for browseView sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','browseView');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for conwsLink sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','conwsLink');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

      });

      describe("to a subfolder of a workspace",function(){

        beforeAll(function (done) {

          nextNode.set({ type: 0, id: 1010101, volume_id: -1010102 });
          nextNode.set("data", { bwsinfo: {id: 1010102} });
          done();

        });

        afterAll(function (done) {

          done();

        });

        it("by default sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated',undefined);
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for gotoLocation sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','gotoLocation');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for browseView sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','browseView');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for conwsLink sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','conwsLink');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

      });

      describe("to a folder outside a workspace",function(){

        beforeAll(function (done) {

          nextNode.set({ type: 0, id: 1010101, volume_id: 1010102 });
          nextNode.set("data", { bwsinfo: {id: null} });
          done();

        });

        afterAll(function (done) {

          done();

        });

        it("by default sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated',undefined);
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for gotoLocation sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','gotoLocation');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for browseView sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','browseView');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

        it("for conwsLink sets nothing",function(done){
          pageContext.viewStateModel.set('conwsNavigated','conwsLink');
          result = plugin.getPreferredTabIndex({ context: pageContext });
          expect(result).toBeUndefined('tabindex is undefined');
          done();
        });

      });

    })

  });

});
