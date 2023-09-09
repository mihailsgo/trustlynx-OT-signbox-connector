/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/utils/commands/open.base',
  'csui/utils/commands/versions/open.version/delegates/open.version.delegates'
], function (_, OpenBaseCommand, openVersionDelegates) {
  'use strict';

  var OpenVersionDelegateCommand = OpenBaseCommand.extend({
    defaults: { signature: 'OpenVersionDelegate' },

    openDelegates: openVersionDelegates
  });

  return OpenVersionDelegateCommand;
});
