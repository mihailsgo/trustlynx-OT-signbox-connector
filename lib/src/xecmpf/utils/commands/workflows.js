/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/models/commands',
  'xecmpf/utils/commands/workflows/open.workflow',
], function (_, CommandCollection,
    workflowOpenCommand) {
  'use strict';

  var commands = new CommandCollection([
    new workflowOpenCommand()
  ]);

  return commands;

});