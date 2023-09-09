/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'require', 'csui/lib/underscore',
    'csui/utils/commands/versions/open.version.perspective',
    'csui/utils/commands/versions/open', 'csui/utils/commands/versions/doc.version.preview'
  ], function (require, _, OpenVersionPerspectiveCommand,
      OpenVersionContentCommand, DocVersionPreviewCommand) {
    'use strict';

    var config = _.extend({
      allowViewContent: true,
      allowPerspective: false
    }, require.moduleConfig('csui/utils/commands/open.document/csui.open.document.delegates'));

    return [
      {
        sequence: 500,
        command: OpenVersionPerspectiveCommand,
        decides: function (version, options) {
          var context = options && options.context;
          if (!(context && context.perspective)) {
            return false;
          }
          return config.allowPerspective;
        }
      },
      {
        sequence: 750,
        command: DocVersionPreviewCommand
      },
      {
        sequence: 1000,
        command: OpenVersionContentCommand,
        decides: function () {
          return config.allowViewContent;
        }
      },
      {
        sequence: 10000,
        command: OpenVersionPerspectiveCommand
      }
    ];
  });
