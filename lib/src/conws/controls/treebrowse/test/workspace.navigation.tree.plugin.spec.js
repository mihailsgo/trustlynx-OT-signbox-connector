/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/ancestors',
  'csui/models/node/node.addable.type.factory',
  'csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/widgets/nodestable/toolbaritems',
  'csui/utils/testutils/async.test.utils',
  'conws/utils/test/testutil',
  'conws/utils/logging/logutil',
  'conws/models/workspacecontext/workspacecontext.factory',
  '../../../utils/commands/navigate/test/test.navigate.workspace.extension.js',
  './workspace.navigation.tree.plugin.mock.js',
  'conws/utils/commands/navigate/navigable'
], function ($, _,
  Backbone, Marionette,
  PageContext,
  NodeModelFactory,
  NextNodeModelFactory,
  AncestorsCollectionFactory,
  AddableTypeCollectionFactory,
  TableToolbarView,
  toolbarItems,
  TestUtils,
  TestUtil,
  LogUtil,
  WorkspaceContextFactory,
  NavigateTestExtension,
  MockData,
  Navigable) {

  'use strict';

  var navigable = {
    isConwsNavigationTreeView: Navigable.isConwsNavigationTreeView
  };

  describe('TreeBrowseTest', function () {

    beforeAll(function (done) {

      $.mockjax.clear(); // to be sure, no mock data relict from previous test spec can affect our tests
      MockData.enable();

      done();
    });

    afterAll(function (done) {

      MockData.disable();

      done();
    });

    var pageContext, resultsRegion, regionEl, tableToolbarView;
    var el;
    function testsetup(type,tree,up) {

      function set_bwsinfo(attributes,wkspid) {
        if (attributes.type===848 && (attributes.id!==wkspid || !wkspid)) {
          throw new Error("Inconsistent bwsinfo. Check test setup!");
        }
        var bwsinfo = (attributes.data || (attributes.data = {})).bwsinfo = { id: wkspid };
        if (attributes.type!==848 && wkspid && (!tree||up!==undefined)) {
          bwsinfo.up = up!==false;
        }
      }

      var deferred = $.Deferred();
      pageContext = resultsRegion = regionEl = tableToolbarView = undefined;
      el = undefined;
      var attributes, attributes2;

      Navigable.isConwsNavigationTreeView = function(){return !!tree;};

      if (type==="workspace") {
        attributes = { id: 98022, type: 848, container: true, parent_id: 262468, volume_id: -2000 };
        set_bwsinfo(attributes,98022);
      } else if (type==="intermediate") {
        attributes = { id: 98026, type: 0, container: true, parent_id: 98022, volume_id: 98022 };
        set_bwsinfo(attributes,98022);
      } else if (type==="parent") {
        attributes = { id: 98028, type: 0, container: true, parent_id: 98026, volume_id: 98022 };
        set_bwsinfo(attributes,98022);
      } else if (type==="subfolder") {
        attributes = { id: 98024, type: 0, container: true, parent_id: 98028, volume_id: 98022 };
        set_bwsinfo(attributes,98022);
      } else if (type==="away") {
        attributes = { id: 98024, type: 0, container: true, parent_id: 98028, volume_id: 98022 };
        set_bwsinfo(attributes,98022);
        attributes2 = { id: 30592, type: 0, container: true, parent_id: 14314, volume_id: -2000 };
        set_bwsinfo(attributes2,null);
      } else if (type==="outside") {
        attributes = { id: 30592, type: 0, container: true, parent_id: 14314, volume_id: -2000 };
        set_bwsinfo(attributes,null);
      } else {
        deferred.reject(new Error("Unknown or unsupported test case setup: "+type));
        return deferred;
      }

      $('body').empty();
      regionEl = $('<div style="width:550px; height:200px;"></div>').appendTo(document.body);
      resultsRegion = new Marionette.Region({
        el: regionEl
      });

      pageContext = new PageContext({
        factories: {
          connector: {
            connection: {
              url: '//server/otcs/cs/api/v1',
              supportPath: '/support',
              session: {
                ticket: 'dummy'
              }
            }
          },
          node: {
            attributes: attributes
          }
        }
      });

      pageContext.getModel(AncestorsCollectionFactory).fetch().then(
        function() {
          if (type==="outside") {
            createToolbar();
          } else {
            pageContext.getObject(WorkspaceContextFactory).fetch().then(
              function() {
                if (type==="away") {
                  pageContext.getModel(NodeModelFactory).set(attributes2);
                  pageContext.getObject(WorkspaceContextFactory).fetch().then(
                    function(){
                      createToolbar();
                    },  function() {
                      deferred.reject(new Error("workspacecontext fetch2 error"));
                    }
                  );
                } else {
                  createToolbar();
                }
              }, function() {
                deferred.reject(new Error("workspacecontext fetch error"));
              }
            );
          }
        }, function() {
          deferred.reject(new Error("ancestors fetch error"));
        }
      );

      function createToolbar() {
        tableToolbarView = new TableToolbarView({
          context: pageContext,
          toolbarItems: toolbarItems /* perhaps better to reduce the items to our test items? */,
          collection: new Backbone.Collection(),
          container: pageContext.getModel(NodeModelFactory),
          addableTypes: pageContext.getCollection(AddableTypeCollectionFactory)
        });
        tableToolbarView.on("render", function () {
          TestUtils.waitFor(function() {
            return tableToolbarView.$(".csui-icon-v2__csui_action_filter32").length>0;
          }).then(deferred.resolve,deferred.reject);
        });
        resultsRegion.show(tableToolbarView);
      }

      return deferred.promise();
    }

    function teardown() {
      Navigable.isConwsNavigationTreeView = navigable.isConwsNavigationTreeView;
      resultsRegion && resultsRegion.destroy();
      regionEl && regionEl.remove();
      $('body').empty();
    }

    describe('treeView navigation enabled:', function(){

      describe('outside a workspace:', function(){

        beforeAll(function (done) {
          testsetup("outside",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('toolbar item is registered', function (done) {
          var items = toolbarItems.navigationToolbar.collection.where({signature:"TreeBrowse"});
          expect(items.length).toEqual(1,"toolbar item registered");
          done();
        });

        it('filter visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_filter32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"filter visibility");
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('directly in workspace:', function(){

        beforeAll(function (done) {
          testsetup("workspace",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"icon visibility");
          done();
        });

      });

      describe('in a direct workspace subfolder in standard browsing scenario:', function(){

        beforeAll(function (done) {
          testsetup("intermediate",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"icon visibility");
          done();
        });

      });

      describe('in a deeper workspace subfolder in standard browsing scenario:', function(){

        beforeAll(function (done) {
          testsetup("subfolder",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"icon visibility");
          done();
        });

      });

      describe('in a deeper workspace subfolder overridden by extension:', function(){

        beforeAll(function (done) {
          NavigateTestExtension.checkNodesTableToolbarElements = function(){
            return { treeView: false, navigateUp: true };
          };
          testsetup("subfolder",true,true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          delete NavigateTestExtension.checkNodesTableToolbarElements;
          done();
        });

        it('tree icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"tree icon visibility");
          done();
        });

        it('up icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"up icon visibility");
          done();
        });

      });

      describe('in a deeper workspace subfolder with non-accessible parent:', function(){

        beforeAll(function (done) {
          testsetup("subfolder",true,false).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"icon visibility");
          done();
        });

      });

      describe('directly in workspace disabled by extension:', function(){

        beforeAll(function (done) {
          NavigateTestExtension.isWorkspaceNavigationEnabled = function(){ return false; };
          testsetup("workspace",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          delete NavigateTestExtension.isWorkspaceNavigationEnabled;
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });


      });

      describe('away from a workspace:', function(){

        beforeAll(function (done) {
          testsetup("away",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

    });

    describe('treeView navigation disabled:', function(){

      describe('outside a workspace:',  function(){

        beforeAll(function (done) {
          testsetup("outside").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('directly in workspace:',  function(){

        beforeAll(function (done) {
          testsetup("workspace").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('in a direct workspace subfolder in standard browsing scenario:',  function(){

        beforeAll(function (done) {
          testsetup("intermediate").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('in a deeper workspace subfolder in standard browsing scenario:',  function(){

        beforeAll(function (done) {
          testsetup("subfolder").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('directly in workspace disabled by extension:',  function(){

        beforeAll(function (done) {
          NavigateTestExtension.isWorkspaceNavigationEnabled = function(){ return false; };
          testsetup("workspace").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          delete NavigateTestExtension.isWorkspaceNavigationEnabled;
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('away from a workspace:',  function(){

        beforeAll(function (done) {
          testsetup("away").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

    });

  });

});
