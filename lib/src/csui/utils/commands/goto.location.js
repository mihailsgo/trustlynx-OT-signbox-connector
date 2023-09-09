/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore', 'csui/lib/backbone',
  'i18n!csui/utils/commands/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/models/command',
  'csui/models/node/node.model',
  'csui-ext!csui/utils/commands/goto.location'
], function (require, $, base, _, Backbone, lang, CommandHelper, CommandModel, NodeModel, navExtensions) {
  'use strict';

  var GoToLocationCommand = CommandModel.extend({

    defaults: {
      signature: "goToLocation",
      scope: "single"
    },

    enabled: function (status, options) {
      var node = CommandHelper.getJustOneNode(status);
      var context = status.context || options && options.context;

      var currentNode;
      if (context.hasModel('node')) {
        currentNode = context.getModel('node');
      }

      var parentNode;
      if (node.parent) {
        parentNode = node.parent;
      }

      var theSameNode = false;
      if (currentNode && parentNode) {
        theSameNode = (currentNode.get('id') === parentNode.get('id'));
      }

      return node && this._isSupported(node) && !theSameNode;
    },

    _isSupported: function (node) {
      return node.parent && node.parent.isFetchable();
    },
    _makeAccessible: function () {
      return ['open'];
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          node = CommandHelper.getJustOneNode(status),
          nodeParent,
          navOptions = {originatingView: status.originatingView, context: status.context},
          self = this;

      if (node && this._isSupported(node)) {
        nodeParent = node.parent;
      } else if (!node.parent && status.model){
        nodeParent = status.model;
      }

      if (nodeParent) {
        
        if (nodeParent && nodeParent.get('type') === undefined) {
          var parentNode = new NodeModel({
            id: nodeParent.get('id')
          }, {
            connector: nodeParent.connector,
            commands: this._makeAccessible()
          });

          parentNode.fetch().done(function (resp) {
            nodeParent = parentNode;
            self.navigate(nodeParent, navOptions);
            deferred.resolve();
          }).fail(function (resp) {
            require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
              var error = new base.Error(resp);
              ModalAlert.showError(error.message);
            });
            deferred.reject();
          });
        } else {
          this.navigate(nodeParent, navOptions);
          deferred.resolve();
        }
      }
      return deferred.promise();
    },

    executeDefaultAction: function (node, originatingView, context) {
      var args = {node: node};
      originatingView.trigger('before:defaultAction', args);
      var deferred = $.Deferred();
      if (!args.cancel) {
        require(['csui/utils/commands'
        ], function (commands) {
          var command = commands.get('Browse');
          if (!command) {
            throw new Error('Invalid command: Browse');
          }
          var status  = {
                nodes: new Backbone.Collection([node])
              },
              options = {
                context: context,
                originatingView: originatingView
              };

          CommandHelper.handleExecutionResults(command.execute(status, options))
              .then(function () {
                originatingView.trigger('executed:defaultAction', args);
                deferred.resolve();
              });

        }, deferred.reject);

      }
    },

    navigate: function (node, options) {
      if (navExtensions) {
        var self = this;
        var promise = navExtensions.reduce(
          function (previousPromise, navExtension) {
            return previousPromise.catch(function (error) {
              if (error) {
                throw error;
              } else {
                return navExtension.navigate(node, options);
              }
            });
          }, $.Deferred().reject());

        return promise.catch(function (error) {
          if (error) {
            throw error;
          } else {
            self.executeDefaultAction(node, options.originatingView, options.context);
          }
        });
      } else {
        this.executeDefaultAction(node, options.originatingView, options.context);
        return $.Deferred().resolve().promise();
      }
    }

  });

  return GoToLocationCommand;

});
