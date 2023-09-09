/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/models/commands',
  'csui/utils/commands/compound.document/properties',
  'csui-ext!csui/utils/commands/compound.document/releases.commands'
], function (_, CommandCollection,
  ReleasesPropertiesCommand,
    extraCommands) {
  'use strict';

  var commands = new CommandCollection([
    new ReleasesPropertiesCommand(),
  ]);

  if (extraCommands) {
    commands.add(
        _.chain(extraCommands)
            .flatten(true)
            .map(function (Command) {
              return new Command();
            })
            .value()
    );
  }

  return commands;

});
