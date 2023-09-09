/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/utils/commands/open.base',
  'csui/utils/commands/open.document/delegates/open.document.delegates'
], function (_, OpenBaseCommand, openDocumentDelegates) {
  'use strict';

  var OpenDocumentCommand = OpenBaseCommand.extend({
    defaults: { signature: 'OpenDocument' },

    openDelegates: openDocumentDelegates
  });

  return OpenDocumentCommand;
});
