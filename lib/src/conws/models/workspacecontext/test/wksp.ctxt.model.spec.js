/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/node',
  'csui/utils/testutils/async.test.utils',
  'conws/utils/test/testutil',
  'conws/utils/logging/logutil',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/models/workspacecontext/impl/workspacecontext.node.factory',
  './wksp.ctxt.model.mock.js'
], function ($, _,
  Backbone, Marionette,
  PageContext,
  ModelFactory,
  NodeModelFactory,
  TestUtils,
  TestUtil,
  LogUtil,
  WorkspaceContextFactory,
  WorkspaceContextNodeFactory,
  MockData) {

  'use strict';

  var TestModel = Backbone.Model.extend({

    constructor: function TestModel(attributes,options) {

      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.options = options;

    },

    fetch: function() {
      this.set("id",this.options.node.get("id"));
    }

  });

  var WkspTestModelFactory = ModelFactory.extend({

      propertyPrefix: 'wkspCtxtTestModel',

      constructor: function WkspTestModelFactory(context, options){

        ModelFactory.prototype.constructor.apply(this, arguments);
        var node = context.getModel(NodeModelFactory);
        this.property = new TestModel( {}, { node: node });

    },

    fetch: function(options){
        return this.property.fetch(options);
    }
  });

  var NaviTestModelFactory = ModelFactory.extend({

      propertyPrefix: 'naviCtxtTestModel',

      constructor: function NaviTestModelFactory(context, options){

        ModelFactory.prototype.constructor.apply(this, arguments);
        var node = context.getModel(NodeModelFactory);
        this.property = new TestModel( {}, { node: node });

    },

    fetch: function(options){
        return this.property.fetch(options);
    }
  });

  describe('WorkspaceContextModelTest', function () {

    beforeAll(function (done) {

      $.mockjax.clear(); // to be sure, no mock data relict from previous test spec can affect our tests
      MockData.enable();

      done();
    });

    afterAll(function (done) {

      MockData.disable();

      done();
    });

    var pageContext, wkspContext, wkspCtxtModel, wkspNodeModel, wkspTestModel, naviTestModel;
    var wkspCtxtFetched, wkspNodeFetched, wkspTestFetched, naviTestFetched;
    var attributes, checkval;

    function getAttributes(type) {
      var attributes;
      if (type==="workspace1") {
        attributes = { id: 98015, type: 848, container: true, parent_id: 262468, volume_id: -2000 };
        attributes.data = { bwsinfo: {id: 98015} };
      } else if (type==="intermediate1") {
        attributes = { id: 98016, type: 0, container: true, parent_id: -98015, volume_id: 98015 };
        attributes.data = { bwsinfo: {id: 98015} };
      } else if (type==="parent1") {
        attributes = { id: 98018, type: 0, container: true, parent_id: 98016, volume_id: 98015 };
        attributes.data = { bwsinfo: {id: 98015} };
      } else if (type==="subfolder1") {
        attributes = { id: 98014, type: 0, container: true, parent_id: 98018, volume_id: 98015 };
        attributes.data = { bwsinfo: {id: 98015} };
      } else if (type==="workspace2") {
        attributes = { id: 98022, type: 848, container: true, parent_id: 262468, volume_id: -2000 };
        attributes.data = { bwsinfo: {id: 98022} };
      } else if (type==="intermediate2") {
        attributes = { id: 98026, type: 0, container: true, parent_id: -98022, volume_id: 98022 };
        attributes.data = { bwsinfo: {id: 98022} };
      } else if (type==="parent2") {
        attributes = { id: 98028, type: 0, container: true, parent_id: 98026, volume_id: 98022 };
        attributes.data = { bwsinfo: {id: 98022} };
      } else if (type==="subfolder2") {
        attributes = { id: 98024, type: 0, container: true, parent_id: 98028, volume_id: 98022 };
        attributes.data = { bwsinfo: {id: 98022} };
      } else if (type==="outside") {
        attributes = { id: 30592, type: 0, container: true, parent_id: 14314, volume_id: -2000 };
        attributes.data = { bwsinfo: {id: null} };
      } else {
        throw new Error("Unknown or unsupported test case setup: "+type);
      }
      return attributes;
    }

    function testsetup() {

      clearmodels();
      clearflags();

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
          }
        }
      });
      wkspContext = pageContext.getObject(WorkspaceContextFactory);
      wkspContext.setWorkspaceSpecific(WkspTestModelFactory);

      wkspCtxtModel = wkspContext.getModel(WorkspaceContextNodeFactory);
      wkspNodeModel = wkspContext.getModel(NodeModelFactory);
      wkspTestModel = wkspContext.getModel(WkspTestModelFactory);
      naviTestModel = wkspContext.getModel(NaviTestModelFactory);

      var track = function(object,name,callback) {
        var method = object[name];
        object[name] = function() {
          callback();
          return method.apply(object,arguments);
        }
      }
      track(wkspCtxtModel,"fetch",function(){ wkspCtxtFetched = true; })
      track(wkspNodeModel,"fetch",function(){ wkspNodeFetched = true; });
      track(wkspTestModel,"fetch",function(){ wkspTestFetched = true; });
      track(naviTestModel,"fetch",function(){ naviTestFetched = true; });
    }

    function teardown() {
      clearmodels();
      clearflags();
    }

    function clearmodels() {
      pageContext = wkspContext = wkspCtxtModel = wkspNodeModel = wkspTestModel = naviTestModel = undefined;
    }

    function clearflags() {
      wkspCtxtFetched = wkspNodeFetched = wkspTestFetched = naviTestFetched = false;
    }
    describe('navigate starting in workspace directly:', function(){

      beforeAll(function(done){
        testsetup();
        done();
      });

      afterAll(function(done){
        teardown();
        done();
      });

      beforeEach(function(done){
        clearflags();
        done();
      });

      it('1. start in workspace1', function(done){
        attributes = getAttributes("workspace1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function() {

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeFalsy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeTruthy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          }, function() {
            done.fail(new Error("start in workspace1 error"));
          }
        );
      });

      it('2. navigate to subfolder1', function(done){
        attributes = getAttributes("subfolder1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeTruthy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeFalsy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("navigate to subfolder1 error"));
          }
        );
      });

      it('3. navigate to intermediate1', function(done){
        attributes = getAttributes("intermediate1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function() {

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeTruthy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeFalsy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          }, function() {
            done.fail(new Error("navigate to intermediate1 error"));
          }
        );
      });

      it('4. navigate to workspace1', function(done){
        attributes = getAttributes("workspace1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function() {

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeFalsy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeFalsy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          }, function() {
            done.fail(new Error("navigate to workspace1 error"));
          }
        );
      });

      it('5. navigate to workspace2', function(done){
        attributes = getAttributes("workspace2");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeFalsy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeTruthy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("navigate to workspace2 error"));
          }
        );
      });

      it('6. navigate to outside', function(done){
        attributes = getAttributes("outside");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeFalsy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeTruthy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("navigate to outside error"));
          }
        );
      });
    });
    describe('navigate starting in workspace1 subfolder:', function(){

      beforeAll(function(done){
        testsetup();
        done();
      });

      afterAll(function(done){
        teardown();
        done();
      });

      beforeEach(function(done){
        clearflags();
        done();
      });

      it('1. start in subfolder1', function(done){
        attributes = getAttributes("subfolder1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeTruthy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeTruthy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("start in subfolder1 error"));
          }
        );
      });

      it('2. navigate to workspace1', function(done){
        attributes = getAttributes("workspace1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeFalsy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeFalsy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("navigate to workspace1 error"));
          }
        );
      });

      it('3. navigate to intermediate1', function(done){
        attributes = getAttributes("intermediate1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function() {

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeTruthy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeFalsy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          }, function() {
            done.fail(new Error("navigate to intermediate1 error"));
          }
        );
      });

      it('4. navigate to subfolder1', function(done){
        attributes = getAttributes("subfolder1");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeTruthy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeFalsy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("navigate to subfolder1 error"));
          }
        );
      });

      it('5. navigate to subfolder2', function(done){
        attributes = getAttributes("subfolder2");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeTruthy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeTruthy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("navigate to subfolder2 error"));
          }
        );
      });

      it('6. navigate to outside', function(done){
        attributes = getAttributes("outside");
        pageContext.getModel(NodeModelFactory).set(attributes);
        pageContext.getObject(WorkspaceContextFactory).fetch().then(
          function(){

            checkval = attributes.data.bwsinfo.id||undefined;

            expect(wkspCtxtFetched).toBeFalsy("wkspid model fetch");
            expect(wkspCtxtModel.get("id")).toEqual(checkval,"wkspid model id");

            expect(wkspNodeFetched).toBeFalsy("node model fetch");
            expect(wkspNodeModel.get("id")).toEqual(checkval,"node model id");

            expect(wkspTestFetched).toBeTruthy("test model fetch");
            expect(wkspTestModel.get("id")).toEqual(checkval,"test model id");

            expect(naviTestFetched).toBeFalsy("navi model fetch");
            expect(naviTestModel.get("id")).toEqual(undefined,"navi model id");

            done();
          },  function() {
            done.fail(new Error("navigate to outside error"));
          }
        );
      });
    });

  });

});
