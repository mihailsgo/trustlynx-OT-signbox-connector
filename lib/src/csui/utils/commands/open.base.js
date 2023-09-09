/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore', 'csui/models/command', 'csui/utils/commandhelper'
  ], function (_, CommandModel, CommandHelper) {
    'use strict';

    var OpenBaseCommand = CommandModel.extend({
      openDelegates: null,
      getCommandKey: function () {
        if(!this.openDelegates) {
          return [];
        }

        var commandKeys = this.openDelegates.map(function (delegate) {
          var command = delegate.get('command');
          return command.getCommandKey && command.getCommandKey()
            || command.get('command_key') || [];
        });
        return _
          .chain(commandKeys)
          .flatten()
          .invoke('toLowerCase')
          .unique()
          .value();
      },

      enabled: function (status, options) {
        if(!this.openDelegates) {
          return false;
        }

        var node = CommandHelper.getJustOneNode(status);
        if (!node) {
          return false;
        }
        var type = node.get('type');
        if (!(type && _.contains(['144', '749', '736', '801'], type.toString()))) {
          return false;
        }
        var fallbackCommand = this.openDelegates.last().get('command');
        return fallbackCommand.enabled(status, options);
      },

      execute: function (status, options) {
        var delegatedCommand = this.getDelegatedCommand(status, options);
        return delegatedCommand.execute(status, options);
      },

      getDelegatedCommand: function (status, options) {
        var node = CommandHelper.getJustOneNode(status);
        return node && this.openDelegates.findByNode(node, status, options);
      }
    });

    return OpenBaseCommand;
  });
