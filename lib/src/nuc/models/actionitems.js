/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/actionitem'
], function (_, Backbone, ActionItemModel) {
  'use strict';

  var ActionItemCollection = Backbone.Collection.extend({

    model: ActionItemModel,
    comparator: 'sequence',

    constructor: function ActionItemCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByNode: function (node) {
      return this.find(function (item) {
        return item.enabled(node);
      });
    },

    getAllSignatures: function () {
      return _
          .chain(this.pluck('signature'))
          .unique()
          .value();
    },
    getAllCommandSignatures: function (commands) {
      return _
          .chain(this.getAllSignatures())
          .map(function (signature) {
            var command = commands.get(signature);
            if (command) {
              var commandKey = command.getCommandKey && command.getCommandKey()
                || command.get('command_key') || [];
              var firstCommandKey = commandKey[0];
              if (firstCommandKey === 'default') {
                return ['default', 'open', commandKey[2]];
              }
              return commandKey;
            }
          })
          .flatten()
          .compact()
          .invoke('toLowerCase')
          .unique()
          .value();
    },

    getPromotedCommandsSignatures: function () {
      return _
          .chain(this.getAllSignatures())
          .flatten()
          .compact()
          .invoke('toLowerCase')
          .unique()
          .value();
    }

  });

  return ActionItemCollection;

});
