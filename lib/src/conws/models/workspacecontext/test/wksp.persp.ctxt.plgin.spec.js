/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/next.node',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/models/workspacecontext/impl/workspace.perspective.context.plugin',
  'conws/utils/commands/goto.location'
], function ($, Backbone,
  PageContext,
  NodeModelFactory,
  NextNodeModelFactory,
  WorkspaceContextFactory,
  WorkspacePerspectiveContextPlugin,
  conwsGotoLocationPlugin
) {

  describe('WorkspacePerspectiveContextPluginTest', function () {

    var pageContext;
    var wkspContext;
    var plugin;
    var sourceModel;
    var nodeModel;
    var nextNode;
    var result;

    function testsetup(type) {

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
          },
          node: {
            get: function (key) {
              return this.attributes[key];
            },
            attributes: {
              id: 2121212,
              type: type,
              volume_id: 1212121
            }
          }
        }
      });

      wkspContext = undefined;
      sourceModel = undefined;

      nodeModel = pageContext.getModel(NodeModelFactory);
      nextNode = pageContext.getModel(NextNodeModelFactory);
      plugin = new WorkspacePerspectiveContextPlugin({ context: pageContext });

      return $.Deferred().resolve().promise();
    }

    function teardown() {
      return $.Deferred().resolve().promise();
    }


    describe('Navigate from workspace with tab perspective', function () {

      beforeAll(function (done) {

        testsetup(848).then(function(){
          nodeModel.set("data", { bwsinfo: {id: nodeModel.get("id")} });
          pageContext.perspective = new Backbone.Model({ options: { tabs: [] } });
          wkspContext = pageContext.getObject(WorkspaceContextFactory);
          done();
        }, done.fail);

      });

      afterAll(function (done) {

        teardown().then(done, done.fail);

      });

      it('to the same workspace', function (done) {
        nextNode.set({ type: 848, id: wkspContext.node.get("id"), volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: wkspContext.node.get("id")} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result&&result.forceChange).toEqual(false,'rejects change, when flag is true');
        done();
      });

      it('to a subfolder of the same workspace', function (done) {
        nextNode.set({ type: 0, id: 1010101, volume_id: -wkspContext.node.get("id") });
        nextNode.set("data", { bwsinfo: {id: wkspContext.node.get("id")} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result&&result.forceChange).toEqual(false,'rejects change, when flag is true');
        done();
      });

      it('to another workspace', function (done) {
        nextNode.set({ type: 848, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: 1010101} });
        result = plugin.onApply( sourceModel, false );
        expect(result&&result.forceChange).toEqual(true,'forces change, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result&&result.forceChange).toEqual(true,'forces change, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

      it('to a folder anywhere else', function (done) {
        nextNode.set({ type: 0, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: null} });
        result = plugin.onApply( sourceModel, false );
        expect(result&&result.forceChange).toEqual(true,'forces change, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result&&result.forceChange).toEqual(true,'forces change, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

    });

    describe('Navigate from workspace without tab perspective', function () {

      beforeAll(function (done) {

        testsetup(848).then(function(){
          nodeModel.set("data", { bwsinfo: {id: nodeModel.get("id")} });
          wkspContext = pageContext.getObject(WorkspaceContextFactory);
          done();
        }, done.fail);

      });

      afterAll(function (done) {

        teardown().then(done, done.fail);

      });

      it('to the same workspace', function (done) {
        nextNode.set({ type: 848, id: wkspContext.node.get("id"), volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: wkspContext.node.get("id")} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result&&result.forceChange).toEqual(false,'rejects change, when flag is true');
        done();
      });

      it('to a subfolder of the same workspace', function (done) {
        nextNode.set({ type: 0, id: 1010101, volume_id: -wkspContext.node.get("id") });
        nextNode.set("data", { bwsinfo: {id: wkspContext.node.get("id")} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result&&result.forceChange).toEqual(false,'rejects change, when flag is true');
        done();
      });

      it('to another workspace', function (done) {
        nextNode.set({ type: 848, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: 1010101} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

      it('to a folder anywhere else', function (done) {
        nextNode.set({ type: 0, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: null} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

    });

    describe('Navigate from folder with tab perspective', function () {

      beforeAll(function (done) {

        testsetup(0).then(function(){
          nodeModel.set("data", { bwsinfo: {id: null} });
          pageContext.perspective = new Backbone.Model({ options: { tabs: [] } });
          done();
        }, done.fail);

      });

      afterAll(function (done) {

        teardown().then(done, done.fail);

      });

      it('to a workspace', function (done) {
        nextNode.set({ type: 848, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: 1010101} });
        result = plugin.onApply( sourceModel, false );
        expect(result&&result.forceChange).toEqual(true,'forces change, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result&&result.forceChange).toEqual(true,'forces change, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

      it('to another folder', function (done) {
        nextNode.set({ type: 0, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: null} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

    });

    describe('Navigate from folder without tab perspective', function () {

      beforeAll(function (done) {

        testsetup(0).then(function(){
          nodeModel.set("data", { bwsinfo: {id: null} });
          done();
        }, done.fail);

      });

      afterAll(function (done) {

        teardown().then(done, done.fail);

      });

      it('to a workspace', function (done) {
        nextNode.set({ type: 848, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: 1010101} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

      it('to another folder', function (done) {
        nextNode.set({ type: 0, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: null} });
        result = plugin.onApply( sourceModel, false );
        expect(result).toBeUndefined('does nothing, when flag is false');
        result = plugin.onApply( sourceModel, undefined );
        expect(result).toBeUndefined('does nothing, when flag is undefined');
        result = plugin.onApply( sourceModel, true );
        expect(result).toBeUndefined('does nothing, when flag is true');
        done();
      });

    });

    describe("ConwsNavigateFlagTest",function(){

      beforeEach(function (done) {

        testsetup(0).then(function(){
          nodeModel.set("data", { bwsinfo: {id: null} });
          done();
        }, done.fail);

      });

      afterEach(function (done) {

        teardown().then(done, done.fail);

      });

      it("goto location to a workspace sets the flags",function(done){
        conwsGotoLocationPlugin.navigate(undefined,{context:pageContext});
        result = pageContext.viewStateModel.get('conwsNavigate');
        expect(result).toEqual('gotoLocation','conwsNavigate is set');
        result = pageContext.viewStateModel.get('conwsNavigated');
        expect(result).toBeUndefined('conwsNavigated is undefined');
        nextNode.set({ type: 848, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: 1010101} });
        plugin.onApply( sourceModel, false );
        result = pageContext.viewStateModel.get('conwsNavigate');
        expect(result).toBeUndefined('conwsNavigate is undefined');
        result = pageContext.viewStateModel.get('conwsNavigated');
        expect(result).toEqual('gotoLocation','conwsNavigated is set');
        done();
      });

      it("goto location to a subfolder sets the flags",function(done){
        conwsGotoLocationPlugin.navigate(undefined,{context:pageContext});
        result = pageContext.viewStateModel.get('conwsNavigate');
        expect(result).toEqual('gotoLocation','conwsNavigate is set');
        result = pageContext.viewStateModel.get('conwsNavigated');
        expect(result).toBeUndefined('conwsNavigated is undefined');
        nextNode.set({ type: 0, id: 1010101, volume_id: -1010102 });
        nextNode.set("data", { bwsinfo: {id: 1010102} });
        plugin.onApply( sourceModel, false );
        result = pageContext.viewStateModel.get('conwsNavigate');
        expect(result).toBeUndefined('conwsNavigate is undefined');
        result = pageContext.viewStateModel.get('conwsNavigated');
        expect(result).toEqual('gotoLocation','conwsNavigated is set');
        done();
      });

      it("goto location to a folder outside a workspace sets the flags",function(done){
        conwsGotoLocationPlugin.navigate(undefined,{context:pageContext});
        result = pageContext.viewStateModel.get('conwsNavigate');
        expect(result).toEqual('gotoLocation','conwsNavigate is set');
        result = pageContext.viewStateModel.get('conwsNavigated');
        expect(result).toBeUndefined('conwsNavigated is undefined');
        nextNode.set({ type: 0, id: 1010101, volume_id: 1010102 });
        nextNode.set("data", { bwsinfo: {id: null} });
        plugin.onApply( sourceModel, false );
        result = pageContext.viewStateModel.get('conwsNavigate');
        expect(result).toBeUndefined('conwsNavigate is undefined');
        result = pageContext.viewStateModel.get('conwsNavigated');
        expect(result).toEqual('gotoLocation','conwsNavigated is set');
        done();
      });

    })

  });

});
