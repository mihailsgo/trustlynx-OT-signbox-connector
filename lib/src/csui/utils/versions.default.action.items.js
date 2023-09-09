/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module','csui/lib/underscore', 'csui/models/actionitems',
  'csui-ext!csui/utils/versions.default.action.items'
], function (module, _, ActionItemCollection, extraActions) {
  'use strict';

  var config = _.extend({
    openVersionContentOnly: false
  }, module.config());

  var defaultActionItems = new ActionItemCollection([
    {
      type: 144,
      signature: config.openVersionContentOnly ? 'OpenVersionDelegate' : 'VersionOpen',
      sequence: 10
    }
  ]);

  if (extraActions) {
    defaultActionItems.add(_.flatten(extraActions, true));
  }

  return defaultActionItems;

});
