/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'require', 'csui/utils/contexts/perspective/perspective.context', 'csui/models/nodes',
  '../../testutils/async.test.utils.js', './delete.mock.js'
], function ($, require, PerspectiveContext, NodeCollection, TestUtils, DeleteMock) {
  'use strict';

  var nodeId = 2000;
  var nextNodeId = 3000;
  var parentNodeId = 4000;
  var testNodeId = 5000;

  describe('DeleteSelfHandler', function () {
    var node, nextNode, status;

    beforeAll(function () {
      DeleteMock.enable();
    });

    afterAll(function () {
      DeleteMock.disable();
    });

    beforeEach(function () {
      var perspectiveContext = new PerspectiveContext({
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
            attributes: {id: nodeId, parent_id: parentNodeId}
          },
          nextNode: {
            attributes: {id: nextNodeId}
          }
        }
      });

      node = perspectiveContext.getModel('node');
      nextNode = perspectiveContext.getModel('nextNode');

      status = {
        context: perspectiveContext,
        container: node,
        nodes: new NodeCollection(node)
      };
    });

    it('navigates forward to parent folder when history is unavailable', function (done) {
      expect(node.get('id')).toEqual(nodeId);
      expect(nextNode.get('id')).toEqual(nextNodeId);

      require(['csui/utils/commands/delete'], function (DeleteCommand) {
        var deleteCommand = new DeleteCommand();

        deleteCommand.execute(status).done(function () {
          expect(nextNode.get('id')).toEqual(parentNodeId);
          done();
        });

        TestUtils.asyncElement('body', '.binf-modal-content').done(
          function (el) {
            expect(el.length).toEqual(1);
            expect($(".binf-modal-title .title-text").text()).toEqual("Delete");
            $('.binf-modal-footer .csui-yes').trigger('click');
          }
        );
      });
    });

    it('navigates to specific node when deleteSelfHandler is set', function (done) {
      define('goto-node', function () {
        return function (node, options) {
          var context = options.context;
          if (context.hasModel('nextNode')) {
            var nextNode = context.getModel('nextNode');
            nextNode.set('id', testNodeId);
          }
        };
      });

      window.csui.requirejs.undef('csui/utils/commands/delete');
      window.csui.requirejs.config({
        config: {
          'csui/utils/commands/delete': {
            deleteSelfHandler: 'goto-node'
          }
        }
      });

      require(['csui/utils/commands/delete'], function (DeleteCommand) {
        var deleteCommand = new DeleteCommand();

        expect(node.get('id')).toEqual(nodeId);
        expect(nextNode.get('id')).toEqual(nextNodeId);

        deleteCommand.execute(status).done(function () {
          expect(nextNode.get('id')).toEqual(testNodeId);
          done();
        });

        TestUtils.asyncElement('body', '.binf-modal-content').done(
          function (el) {
            expect(el.length).toEqual(1);
            expect($(".binf-modal-title .title-text").text()).toEqual("Delete");
            $('.binf-modal-footer .csui-yes').trigger('click');
          }
        );
      });
    });

  });

});
