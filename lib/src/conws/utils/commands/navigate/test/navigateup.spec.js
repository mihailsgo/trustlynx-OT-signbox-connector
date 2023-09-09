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
  './test.navigate.workspace.extension.js',
  './navigateup.mock.js',
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
  MockData, Navigable) {

  'use strict';

  var navigable = {
    isConwsNavigationTreeView: Navigable.isConwsNavigationTreeView
  };

  describe('NavigateUpTest', function () {

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
    var el, clickel, checkval, changedIds;
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

      changedIds = [];
      return deferred.promise();
    }

    function teardown() {
      Navigable.isConwsNavigationTreeView = navigable.isConwsNavigationTreeView;
      resultsRegion && resultsRegion.destroy();
      regionEl && regionEl.remove();
      $('body').empty();
    }

    describe('treeView navigation disabled:', function(){

      describe('outside a workspace:', function(){

        beforeAll(function (done) {
          testsetup("outside").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('toolbar item is registered', function (done) {
          var items = toolbarItems.navigationToolbar.collection.where({signature:"ConwsNavigateUp"});
          expect(items.length).toEqual(1,"toolbar item registered");
          done();
        });

        it('filter visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_filter32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"filter visibility");
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('directly in workspace:', function(){

        beforeAll(function (done) {
          testsetup("workspace").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('click in a direct workspace subfolder in standard browsing scenario:', function(){

        beforeAll(function (done) {
          testsetup("intermediate").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"icon visibility");
          done();
        });

        it('navigation is triggered on click on icon', function(done) {
          pageContext.getModel(NextNodeModelFactory).on("change:id",function(model,newval,options){
            changedIds.push(newval);
          });
          pageContext.getModel(NextNodeModelFactory).once("change:id",function(model,newval,options){
            done();
          });
          clickel = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          TestUtil.fireEvents(clickel[0],TestUtil.PointerEvent,['pointerdown']);
          TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mousedown']);
          TestUtil.fireEvents(clickel[0],TestUtil.PointerEvent,['pointerup']);
          TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mouseup','click']);
        });

        it('wait some time before final checks', function(done) {
          setTimeout(function(){done();},1500);
        });

        it('menu is not open', function(done) {
          el = tableToolbarView.$('[data-csui-command="conwsnavigateup"].binf-pull-down.binf-open ul li a');
          expect(el.length).toEqual(0,"menu is not open after click.");
          done();
        });

        it('click was triggered once to workspace only', function(done) {
          checkval = LogUtil.stringify(changedIds);
          expect(checkval).toEqual('[98022]',"navigation triggered to workspace only");
          done();
        });

      });

      describe('click in a deeper workspace subfolder in standard browsing scenario:', function(){

        beforeAll(function (done) {
          testsetup("subfolder").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"icon visibility");
          done();
        });

        it('navigation is triggered on click on icon', function(done) {
          pageContext.getModel(NextNodeModelFactory).on("change:id",function(model,newval,options){
            changedIds.push(newval);
          });
          pageContext.getModel(NextNodeModelFactory).once("change:id",function(model,newval,options){
            done();
          });
          clickel = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          TestUtil.fireEvents(clickel[0],TestUtil.PointerEvent,['pointerdown']);
          TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mousedown']);
          TestUtil.fireEvents(clickel[0],TestUtil.PointerEvent,['pointerup']);
          TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mouseup','click']);
        });

        it('wait some time before final checks', function(done) {
          setTimeout(function(){done();},1500);
        });

        it('menu is not open', function(done) {
          el = tableToolbarView.$('[data-csui-command="conwsnavigateup"].binf-pull-down.binf-open ul li a');
          expect(el.length).toEqual(0,"menu is not open after click.");
          done();
        });

        it('click was triggered once to parent folder only', function(done) {
          checkval = LogUtil.stringify(changedIds);
          expect(checkval).toEqual('[98028]',"navigation triggered to parent folder only");
          done();
        });

      });

      describe('long press in a deeper workspace subfolder in standard browsing scenario:', function(){

        beforeAll(function (done) {
          testsetup("subfolder").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"icon visibility");
          done();
        });

        it('menu is opened on press', function(done) {
          var count;
          TestUtils.waitFor(function(){
            el = tableToolbarView.$('[data-csui-command="conwsnavigateup"].binf-pull-down.binf-open ul li a');
            count = el.length;
            return count===3;
          },"waiting for press",1500).then(function() {
            el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
            TestUtil.fireEvents(el[0],TestUtil.PointerEvent,['pointerup']);
            done();
          },function(){
            el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
            TestUtil.fireEvents(el[0],TestUtil.PointerEvent,['pointerup']);
            done.fail(new Error("menu not opened. count "+(count===undefined?"undefined":count)+"."));
          });
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          TestUtil.fireEvents(el[0],TestUtil.PointerEvent,['pointerdown']);
        });

        it('navigation is triggered on click in menu', function(done) {
          pageContext.getModel(NextNodeModelFactory).on("change:id",function(model,newval,options){
            changedIds.push(newval);
          });
          pageContext.getModel(NextNodeModelFactory).once("change:id",function(model,newval,options){
            done();
          });
          clickel = tableToolbarView.$('[data-csui-command="conwsnavigateup"].binf-pull-down ul li a');
          TestUtil.fireEvents(clickel[1],TestUtil.PointerEvent,['pointerdown']);
          TestUtil.fireEvents(clickel[1],TestUtil.MouseEvent,['mousedown']);
          TestUtil.fireEvents(clickel[1],TestUtil.PointerEvent,['pointerup']);
          TestUtil.fireEvents(clickel[1],TestUtil.MouseEvent,['mouseup','click']);
        });

        it('wait some time before final checks', function(done) {
          setTimeout(function(){done();},1500);
        });

        it('menu is not open', function(done) {
          el = tableToolbarView.$('[data-csui-command="conwsnavigateup"].binf-pull-down.binf-open ul li a');
          expect(el.length).toEqual(0,"menu is not open after click.");
          done();
        });

        it('click was triggered once to intermediate folder only', function(done) {
          checkval = LogUtil.stringify(changedIds);
          expect(checkval).toEqual('[98026]',"navigation triggered to intermediate folder only");
          done();
        });

      });

      describe('in a deeper workspace subfolder overridden by extension:', function(){

        beforeAll(function (done) {
          NavigateTestExtension.checkNodesTableToolbarElements = function(){
            return { treeView: true, navigateUp: false };
          };
          testsetup("subfolder").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          delete NavigateTestExtension.checkNodesTableToolbarElements;
          done();
        });

        it('up icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"up icon visibility");
          done();
        });

        it('tree icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_toggle_tree32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"tree icon visibility");
          done();
        });

      });

      describe('in a deeper workspace subfolder disabled by extension:', function(){

        beforeAll(function (done) {
          NavigateTestExtension.isWorkspaceNavigationEnabled = function(){ return false; };
          testsetup("subfolder").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          delete NavigateTestExtension.isWorkspaceNavigationEnabled;
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('in a deeper workspace subfolder with non-accessible parent:', function(){

        beforeAll(function (done) {
          testsetup("subfolder",false,false).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('away from a workspace:', function(){

        beforeAll(function (done) {
          testsetup("away").then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

    });

    describe('treeView navigation enabled:', function(){

      describe('click in a direct workspace subfolder in standard browsing scenario:', function(){

        beforeAll(function (done) {
          testsetup("intermediate",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

      describe('click in a deeper workspace subfolder in standard browsing scenario:', function(){
        beforeAll(function (done) {
          testsetup("subfolder",true).then(done,done.fail);
        });

        afterAll(function (done) {
          teardown();
          done();
        });

        it('icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__conws_action_navigate_up");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"icon visibility");
          done();
        });

      });

    });

  });

});
