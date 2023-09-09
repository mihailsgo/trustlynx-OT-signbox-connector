/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/models/command'
], function (CommandModel) {
  'use strict';

  var EditRolePermissionCommand = CommandModel.extend({
    defaults: {
      signature: "EditRolePermission",
      name: "Edit role"
    }
  });

  return EditRolePermissionCommand;
});