/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/node',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/controls/breadcrumbspanel/breadcrumbspanel.extension'
], function ($, Backbone,
  PageContext,
  NodeModelFactory,
  WorkspaceContextFactory,
  BreadcrumbspanelExtension
) {

  describe('BreadcrumbspanelExtensionTest', function () {

    var pageContext;
    var wkspContext;
    var extension;
    var nodeModel;
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

      nodeModel = pageContext.getModel(NodeModelFactory);
      extension = BreadcrumbspanelExtension;

      return $.Deferred().resolve().promise();
    }

    function teardown() {
      return $.Deferred().resolve().promise();
    }


    describe('In a perspective with header', function () {

      beforeAll(function (done) {

        testsetup(848).then(function(){
          nodeModel.set("data", { bwsinfo: {id: nodeModel.get("id")} });
          pageContext.perspective = new Backbone.Model({ options: { header: { widget: {} } } });
          wkspContext = pageContext.getObject(WorkspaceContextFactory);
          done();
        }, done.fail);

      });

      afterAll(function (done) {

        teardown().then(done, done.fail);

      });

      it('in a workspace: hide breadcrumbs', function (done) {
        result = extension.hideBreadcrumbs({context:pageContext});
        expect(result).toEqual(true);
        done();
      });

      it('in a subfolder of a workspace: hide breadcrumbs', function (done) {
        nodeModel.set({ type: 0, id: 1010101, volume_id: wkspContext.node.get("id") });
        nodeModel.set("data", { bwsinfo: {id: wkspContext.node.get("id")} });
        result = extension.hideBreadcrumbs({context:pageContext});
        expect(result).toEqual(true);
        done();
      });

      it('in a folder anywhere else: show breadcrumbs', function (done) {
        nodeModel.set({ type: 0, id: 1010101, volume_id: 1010102 });
        nodeModel.set("data", { bwsinfo: {id: null} });
        result = extension.hideBreadcrumbs({context:pageContext});
        expect(result).toEqual(false);
        done();
      });

    });

    describe('In a perspective without header', function () {

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

      it('show in a workspace: show breadcrumbs', function (done) {
        nodeModel.set({ type: 848, id: wkspContext.node.get("id"), volume_id: 1010102 });
        nodeModel.set("data", { bwsinfo: {id: wkspContext.node.get("id")} });
        result = extension.hideBreadcrumbs({context:pageContext});
        expect(result).toEqual(false);
        done();
      });

      it('in a subfolder of a workspace: show breadcrumbs', function (done) {
        nodeModel.set({ type: 0, id: 1010101, volume_id: wkspContext.node.get("id") });
        nodeModel.set("data", { bwsinfo: {id: wkspContext.node.get("id")} });
        result = extension.hideBreadcrumbs({context:pageContext});
        expect(result).toEqual(false);
        done();
      });

      it('in a folder anywhere else: show breadcrumbs', function (done) {
        nodeModel.set({ type: 0, id: 1010101, volume_id: 1010102 });
        nodeModel.set("data", { bwsinfo: {id: null} });
        result = extension.hideBreadcrumbs({context:pageContext});
        expect(result).toEqual(false);
        done();
      });

    });

  });

});
