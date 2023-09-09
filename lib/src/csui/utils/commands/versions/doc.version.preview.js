/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/utils/commands/doc.preview',
  ], function (DocPreviewCommand) {
    'use strict';

    var DocVersionPreviewCommand = DocPreviewCommand.extend({
      defaults: {
        signature: 'DocVersionPreview'
      },

      delegatableOpenCommand: 'OpenVersionDelegate'
    });

    return DocVersionPreviewCommand;
  });
