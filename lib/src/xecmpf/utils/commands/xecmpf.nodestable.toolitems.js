/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



 define(['i18n!xecmpf/utils/commands/nls/localized.strings'
], function (lang) {
  'use strict';
  return {
    leftToolbar: [
      {
        signature: "XECMPFCreateDocument",
        icon: "icon xecmpf-nodestable-docgen-action",
        name: lang.createDocumentCommand,
        type: "leftToolbar"
      }
    ],
    inlineActionbar: [
      {
        signature: "XECMPFCreateDocument",
        name: lang.createDocumentCommand,
        icon: "icon xecmpf-workspaces-docgen"
      }
    ]
  };
});
