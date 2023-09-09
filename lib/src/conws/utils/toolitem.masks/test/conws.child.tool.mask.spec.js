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
  'conws/widgets/header/impl/headertoolbaritems',
  'csui/widgets/nodestable/toolbaritems.masks',
  'csui/utils/toolitem.masks/children.toolitems.mask',
  'csui/utils/testutils/async.test.utils',
  'conws/utils/test/testutil',
  'conws/utils/logging/logutil',
  'conws/models/workspacecontext/workspacecontext.factory',
  './conws.child.tool.mask.mock.js'
], function ($, _,
  Backbone, Marionette,
  PageContext,
  NodeModelFactory,
  NextNodeModelFactory,
  AncestorsCollectionFactory,
  AddableTypeCollectionFactory,
  TableToolbarView,
  nodestableToolbarItems,
  headerToolbarItems,
  ToolbarItemsMasks,
  ChildrenToolItemsMask,
  TestUtils,
  TestUtil,
  LogUtil,
  WorkspaceContextFactory,
  MockData) {

  'use strict';

  var testToolbarItems = {
    filterToolbar: nodestableToolbarItems.filterToolbar,
    rightToolbar: headerToolbarItems.rightToolbar
  };

  describe('ToolbarMaskTest', function () {

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

    function testsetup(type,withHeader) {

      var deferred = $.Deferred();
      pageContext = resultsRegion = regionEl = tableToolbarView = undefined;
      el = undefined;
      var attributes;

      function actions(id) {
        return [
          {
            "body": "",
            "content_type": "",
            "form_href": "",
            "href": "/api/v2/nodes/"+id+"/nodes",
            "method": "GET",
            "name": "Open",
            "signature": "open"
          },
          {
            "body": "",
            "content_type": "",
            "form_href": "",
            "href": "",
            "method": "POST",
            "name": "Comments",
            "signature": "comment"
          }
        ];
      }

      if (type==="workspace") {
        attributes = { id: 98022, type: 848, container: true, parent_id: 262468, volume_id: -2000 };
        attributes.data = { bwsinfo: {id: 98022} };
        attributes.actions = actions(attributes.id);
      } else if (type==="intermediate") {
        attributes = { id: 98026, type: 0, container: true, parent_id: -98022, volume_id: 98022 };
        attributes.data = { bwsinfo: {id: 98022} };
        attributes.actions = actions(attributes.id);
      } else if (type==="parent") {
        attributes = { id: 98028, type: 0, container: true, parent_id: 98026, volume_id: 98022 };
        attributes.data = { bwsinfo: {id: 98022} };
        attributes.actions = actions(attributes.id);
      } else if (type==="subfolder") {
        attributes = { id: 98024, type: 0, container: true, parent_id: 98028, volume_id: 98022 };
        attributes.data = { bwsinfo: {id: 98022} };
        attributes.actions = actions(attributes.id);
      } else if (type==="outside") {
        attributes = { id: 30592, type: 0, container: true, parent_id: 14314, volume_id: -2000 };
        attributes.data = { bwsinfo: {id: null} };
        attributes.actions = actions(attributes.id);
      } else {
        deferred.reject(new Error("Unknown or unsupported test case setup: "+type));
        return;
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

      if (withHeader) {
        pageContext.perspective = new Backbone.Model({ options: { header: { /*any header*/ } } });
      }

      pageContext.getModel(AncestorsCollectionFactory).fetch().then(
        function() {
          if (type==="outside") {
            createToolbar();
          } else {
            pageContext.getObject(WorkspaceContextFactory).fetch().then(
              function() {
                createToolbar();
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
        var toolbarItemsMasks = new ToolbarItemsMasks();
        _.each(toolbarItemsMasks.toolbars, function (mask, key) {
          mask.restoreAndResetMask(new ChildrenToolItemsMask({
            context: pageContext,
            node: pageContext.getModel(NodeModelFactory)
          }));
        });
  
        tableToolbarView = new TableToolbarView({
          context: pageContext,
          toolbarItems: testToolbarItems,
          toolbarItemsMasks: toolbarItemsMasks,
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
      resultsRegion && resultsRegion.destroy();
      regionEl && regionEl.remove();
      $('body').empty();
    }

    describe('with header perspective:',function(){

      describe('outside a workspace:', function(){

        beforeAll(function (done) {
          testsetup("outside",true).then(done,done.fail);
        });
  
        afterAll(function (done) {
          teardown();
          done();
        });
  
        it('comment icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__esoc_no_comment32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"comment icon visibility");
          done();
        });
  
        it('favorite icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_no_fav32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"favorite icon visibility");
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
  
        it('comment icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__esoc_no_comment32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"comment icon visibility");
          done();
        });
  
        it('favorite icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_no_fav32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(false,"favorite icon visibility");
          done();
        });
  
      });
  
      describe('below a workspace:', function(){
  
        beforeAll(function (done) {
          testsetup("intermediate",true).then(done,done.fail);
        });
  
        afterAll(function (done) {
          teardown();
          done();
        });
  
        it('comment icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__esoc_no_comment32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"comment icon visibility");
          done();
        });
  
        it('favorite icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_no_fav32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"favorite icon visibility");
          done();
        });
  
      });
  
    });

    describe('without header perspective:',function(){

      describe('outside a workspace:', function(){

        beforeAll(function (done) {
          testsetup("outside").then(done,done.fail);
        });
  
        afterAll(function (done) {
          teardown();
          done();
        });
  
        it('comment icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__esoc_no_comment32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"comment icon visibility");
          done();
        });
  
        it('favorite icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_no_fav32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"favorite icon visibility");
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
  
        it('comment icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__esoc_no_comment32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"comment icon visibility");
          done();
        });
  
        it('favorite icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_no_fav32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"favorite icon visibility");
          done();
        });
  
      });
  
      describe('below a workspace:', function(){
  
        beforeAll(function (done) {
          testsetup("intermediate").then(done,done.fail);
        });
  
        afterAll(function (done) {
          teardown();
          done();
        });
  
        it('comment icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__esoc_no_comment32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"comment icon visibility");
          done();
        });
  
        it('favorite icon visibility', function(done) {
          el = tableToolbarView.$(".csui-icon-v2__csui_action_no_fav32");
          expect(TestUtils.isElementVisible(el[0])).toEqual(true,"favorite icon visibility");
          done();
        });
  
      });
        
    });

  });

});
