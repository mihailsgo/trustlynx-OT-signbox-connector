/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/controls/userpicker/roles/user.view',
  'csui/controls/userpicker/roles/group.view'
], function (UserView, GroupView) {
  'use strict';

  return [{
    type: 0,
    viewClass: UserView
  }, {
    type: 1,
    viewClass: GroupView
  }];
});
