/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/marionette', 'csui/lib/jquery',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/models/node/node.model',
  'csui/models/nodes',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/utils/commands/goto.location',
  'csui/utils/commands'
], function (Marionette, $, PerspectiveContext, NodeModel, NodeCollection, DefaultActionController,
             GoToLocationCommand, commands) {
  'use strict';

  var nodeId = 2000;
  var nextNodeId = 3000;
  var parentNodeId = 4000;
  var extensionNodeId = 5000;

  describe('GoToLocationCommand Command', function () {

    var goToLocationCommand;

    beforeAll(function () {
      goToLocationCommand = commands.get('goToLocation');
    });

    afterAll(function () {
      $('body').empty();
    });

    it('can be constructed', function () {
      var helloCommand = new GoToLocationCommand();
      expect(helloCommand instanceof GoToLocationCommand).toBeTruthy();
    });

    it('is registered by default', function () {
      expect(goToLocationCommand).toBeDefined();
    });

    it('signature is "GoToLocation"', function () {
      expect(goToLocationCommand.get('signature')).toEqual('goToLocation');
      expect(goToLocationCommand.get('command_key')).toBeUndefined();
    });

    describe('when executed with a node', function () {
      var status, context, view, node, nextNode;
      beforeEach(function () {
        context = new PerspectiveContext({
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
              attributes: {id: nodeId, parent_id: {id: parentNodeId, container: true, type:0, openable: true }}
            },
            nextNode: {
              attributes: {id: nextNodeId}
            }
          }
        });

        view = new Marionette.View();
        view.defaultActionController = new DefaultActionController();
        view.context = context;

        node = context.getModel('node');
        nextNode = context.getModel('nextNode');

        status = {
          context: context,
          file: {name: 'test.txt', size: 456, type: 'text/plain'},
          container: node,
          nodes: new NodeCollection(node),
          originatingView: view
        };
      });

      it('gets enabled for a single node with document type', function () {
        node.set('type', 144);
        expect(goToLocationCommand.enabled(status)).toBeTruthy();
      });

      it('gets enabled for a single node with email type', function () {
        node.set('type', 749);
        expect(goToLocationCommand.enabled(status)).toBeTruthy();
      });

      xit('does not gets enabled for node other than document and email type', function () {
        node.set('type', 0);
        expect(goToLocationCommand.enabled(status)).toBeFalsy();
      });

      it('execute when object is document type', function (done) {
        node.set('type', 144);

        expect(node.get('id')).toEqual(nodeId);
        expect(nextNode.get('id')).toEqual(nextNodeId);

        goToLocationCommand.execute(status).done(function () {
          setTimeout(function() {
            expect(nextNode.get('id')).toEqual(extensionNodeId);
            done();
           }, 100);
        });
      });

      it('execute when object is email type', function (done) {
        node.set('type', 749);

        expect(node.get('id')).toEqual(nodeId);
        expect(nextNode.get('id')).toEqual(nextNodeId);

        goToLocationCommand.execute(status).done(function () {
          setTimeout(function() {
              expect(nextNode.get('id')).toEqual(extensionNodeId);
              done();
            }, 100);
        });
      });

      xit('executes default action when extension fails', function (done) {
        node.set('type', 144);
        status.context.forceFail = true;

        expect(node.get('id')).toEqual(nodeId);
        expect(nextNode.get('id')).toEqual(nextNodeId);

        goToLocationCommand.execute(status).done(function () {
          setTimeout(function() {
            expect(nextNode.get('id')).toEqual(parentNodeId);
            done();
          }, 100);
        });
      });

    });

  });

});
