/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


window.csui.require.config({
  config: {
    'csui/utils/commands': {
      'extensions': {
        'greet': [
          'greet/commands/add.hello/add.hello.command'
        ]
      }
    }
  }
});

define([
  'csui/lib/jquery', 'csui/lib/backbone', 'csui/models/node/node.model',
  'csui/dialogs/modal.alert/modal.alert', 'csui/utils/base',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/connector',
  'greet/commands/add.hello/add.hello.command', 'csui/utils/commands',
  './add.hello.mock.js'
], function ($, Backbone, NodeModel, ModalAlert, base, PageContext,
    ConnectorFactory, AddHelloCommand, commands, mock) {
  'use strict';

  describe('AddHelloCommand', function () {

    var addHelloCommand, originalNode, node;

    beforeEach(function (done) {
      mock.enable();

      if (!node) {
        addHelloCommand = commands.get('greet-add-hello');
        var context = new PageContext({
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
            }),
            connector = context.getObject(ConnectorFactory);
        originalNode = new NodeModel({id: 2000}, {connector: connector});
        originalNode
            .fetch()
            .done(function () {
              node = originalNode.clone();
              done();
            });
      } else {
        node = originalNode.clone();
        done();
      }
    }, 5000);

    afterEach(function () {
      mock.disable();
    });

    it('can be constructed', function () {
      var helloCommand = new AddHelloCommand();
      expect(helloCommand instanceof AddHelloCommand).toBeTruthy();
    });
    xit('can be registered', function () {
      expect(addHelloCommand).toBeDefined();
    });

    describe('when checking', function () {
      var addHelloCommand;
      beforeEach(function () {
        if (!addHelloCommand) {
          addHelloCommand = new AddHelloCommand();
        }
      });

      describe('is disabled', function () {

        it('without a container', function () {
          expect(addHelloCommand.enabled({})).toBeFalsy();
        });

        it('with a non-container node', function () {
          node.set('container', false);
          expect(addHelloCommand.enabled({container: node})).toBeFalsy();
        });

      });

      describe('is enabled', function () {

        it('with a container', function () {
          node.set('container', true);
          expect(addHelloCommand.enabled({container: node})).toBeTruthy();
        });

      });

    });

  });

});
