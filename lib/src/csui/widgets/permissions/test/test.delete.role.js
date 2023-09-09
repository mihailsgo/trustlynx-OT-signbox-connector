/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/models/command'
], function (CommandModel) {
  'use strict';

  var DeleteRoleCommand = CommandModel.extend({
    defaults: {
      signature: "DeleteRole",
      name: "Delete role"
    }
  });

  return DeleteRoleCommand;
});