/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

window.csui.require.config({
  config: {
    'csui/utils/commands': {
      extensions: {
        'greet': [
          'greet/commands/hello/hello.command'
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
  'greet/commands/hello/hello.command', 'csui/utils/commands',
  './hello.mock.js'
], function ($, Backbone, NodeModel, ModalAlert, base, PageContext,
    ConnectorFactory, HelloCommand, commands, mock) {
  'use strict';

  describe('HelloCommand', function () {
    var helloCommand, originalNode, node;

    beforeEach(function (done) {
      mock.enable();

      if (!node) {
        helloCommand = commands.get('greet-hello');
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
      var helloCommand = new HelloCommand();
      expect(helloCommand instanceof HelloCommand).toBeTruthy();
    });

    it('can be registered', function () {
      expect(helloCommand).toBeDefined();
    });

    describe('when checking', function () {
      describe('is disabled', function () {
        it('with an empty node selection', function () {
          var helloInput = {
            nodes: []
          };
          expect(helloCommand.enabled(helloInput)).toBeFalsy();
        });

        it('with more than one node seleected', function () {
          var anotherNode = node.clone();
          anotherNode.set('id', node.id + 1);
          var helloInput = {
            nodes: new Backbone.Collection([node, anotherNode])
          };
          node.set('perm_modify', false);
          expect(helloCommand.enabled(helloInput)).toBeFalsy();
        });
      });

      describe('is enabled', function () {
        it('with a single node', function () {
          var helloInput = {
            nodes: new Backbone.Collection([node])
          };
          expect(helloCommand.enabled(helloInput)).toBeTruthy();
        });
      });
    });

    describe('when executing', function () {
      function openDialog(done) {
        var helloInput = {
          nodes: new Backbone.Collection([node])
        };
        promise = helloCommand
            .execute(helloInput)
            .fail(function () {
              promisedValue = arguments[0];
            });
        var interval = setInterval(function () {
          helloForm = $('.binf-modal-body');
          if (helloForm.length) {
            clearInterval(interval);
            closeButton = $('.binf-modal-footer .csui-cancel');
            setTimeout(done);
          }
        }, 100);
      }

      function cancelDialog(done) {
        closeButton.click();
        var interval = setInterval(function () {
          if (!$('.binf-modal-body').length) {
            clearInterval(interval);
            setTimeout(done);
          }
        }, 1000);
      }

      var promise, promisedValue, helloForm, closeButton;

      describe('and showing the dialog', function () {
        it('enables the close button', function (done) {
          openDialog(function () {
            expect(closeButton.hasClass('binf-disabled')).toBeFalsy();
            cancelDialog(done);
          });
        }, 5000);

        it('shows the node name', function (done) {
          openDialog(function () {
            expect(helloForm.text()).toContain(node.get('name'));
            cancelDialog(done);
          });
        }, 5000);

        it('stays open', function (done) {
          openDialog(function () {
            setTimeout(function () {
              expect($('.binf-modal-body').length).toBeTruthy();
              cancelDialog(done);
            }, 750);
          });
        }, 5000);

      });

      describe('and closing the dialog', function () {
        it('resolves the promise with nothing', function (done) {
          openDialog(function () {
            cancelDialog(function () {
              expect(promise.state()).toEqual('resolved');
              expect(promisedValue).toBeUndefined();
              done();
            });
          });
        }, 5000);
      });
    });
  });
});
