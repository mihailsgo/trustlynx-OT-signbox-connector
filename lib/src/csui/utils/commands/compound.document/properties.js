/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/utils/commands/properties'
], function (PropertiesCommand) {
  'use strict';

  var ReleasesPropertiesCommand = PropertiesCommand.extend({

    defaults: {
        signature: 'ReleasesProperties',
        command_key: ['properties','ReleasesProperties'],
        scope: 'multiple',
        commands: 'csui/utils/commands/compound.document/releases.commands'
    },

    execute: function (status, options) {
      
      if (!status.container && status.originatingView.collection) {
        status.originatingView.options.showReleasesView = false;
        return this._executeWithSaveState(status, options);
      } else {
        status.originatingView.options.showReleasesView = false;
        return this._executeWithoutSaveState(status, options);
      }
    },

    _getAtLeastOneNode: function (status) {
        if (status.collection && status.nodes.length === 1) {
          return status.collection;
        }
        return status.nodes;
      }

  });

  return ReleasesPropertiesCommand;

});
