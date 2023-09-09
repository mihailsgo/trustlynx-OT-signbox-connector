/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "csui/lib/jquery",
  "csui/lib/marionette",
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/page/page.context',
  'csui/widgets/nodestable/nodestable.view',
  "../../../utils/testutils/async.test.utils.js",
  './tree.browse.mock.js'
], function ($, Marionette, AncestorsCollectionFactory, PageContext, NodesTableView, TestUtils,
    TreeBrowseMock) {

  describe("UserPicker", function () {
    var context, nodesTableView, ancestorsCollection;

    beforeAll(function (done) {

      TreeBrowseMock.enable();
      context = new PageContext({
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
            attributes: {id: 2000}
          }
        }
      });

      nodesTableView = new NodesTableView({
        context: context
      });
      ancestorsCollection = context.getCollection(AncestorsCollectionFactory);
      var contentRegion = new Marionette.Region({
        el: $('<div id="content"></div>').appendTo(document.body)
      });
      context.fetch().done(function () {
        contentRegion.show(nodesTableView);
        ancestorsCollection.fetch().done(done);
      });

    });

    afterAll(function () {
      TestUtils.cancelAllAsync();

      TreeBrowseMock.disable();
      nodesTableView.destroy();
      TestUtils.restoreEnvironment();
    });

    describe("opening and closing tree view", function () {

      beforeAll(function (done) {
        TestUtils.asyncElement(document.body, '.csui-nodestable').done(
            function (el) {
              expect(el.length).toEqual(1);
              done();
            });
      });
      it("check opening tree view by clicking on tree command",
          function (done) {
            $('li[data-csui-command="treebrowse"] a').trigger('click');

            TestUtils.asyncElement(nodesTableView.$el,
                '.csui-treeview-hidden.csui-treeview-visibility', true).done(
                function (el) {
                  expect(el.length).toEqual(0);
                  done();
                });
          });
      it("check expanding a node with children",
          function (done) {
            TestUtils.asyncElement('.csui-tree-browse', 'span[title="First child"]').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  $('.csui-tree-browse ul li li  span.fancytree-expander:first').click();
                  TestUtils.asyncElement('.csui-tree-browse', 'span[title="Nested item"]').done(
                      function (el) {
                        expect(el.length).toEqual(1);
                        done();
                      });
                });
          });
      it("check collapsing the node",
          function (done) {
            $('.csui-tree-browse ul li li  span.fancytree-expander:first').click();
            TestUtils.asyncElement('.csui-tree-browse', 'span[title="Nested item"]', true).done(
                function (el) {
                  expect(el.length).toEqual(0);
                  done();
                });
          });
      it("check expanding a node without children, so it removes expand icon",
          function (done) {
            $('.csui-tree-browse ul li li  span.fancytree-expander:last').click();
            TestUtils.asyncElement('.csui-tree-browse',
                'ul li .fancytree-exp-nl .fancytree-expander').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  done();
                });

          });
      it("check closing tree view by clicking on tree command",
          function (done) {
            $('li[data-csui-command="treebrowse"] a').trigger('click');

            TestUtils.asyncElement(nodesTableView.$el,
                '.csui-treeview-hidden.csui-treeview-visibility').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  done();
                });
          });
    });

  });
});