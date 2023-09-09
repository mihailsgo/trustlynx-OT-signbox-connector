/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['i18n!greet/commands/hello/impl/nls/lang'
], function (lang) {
  'use strict';

  return {
    otherToolbar: [
      {
        signature: 'greet-hello',
        name: lang.toolbarButtonTitle
      }
    ]
  };

});
