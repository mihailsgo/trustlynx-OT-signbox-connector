/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/models/command'
], function (CommandModel) {
  'use strict';

  var AddOrEditRoleCommand = CommandModel.extend({
    defaults: {
      signature: "AddOrEditRole",
      name: "Add role"
    }
  });

  return AddOrEditRoleCommand;
});