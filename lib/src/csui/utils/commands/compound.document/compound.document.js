/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/underscore",
    "i18n!csui/utils/commands/nls/localized.strings", "csui/models/command",
], function (_, lang,CommandModel) {
    'use strict';

    var CompoundDocumentCommand = CommandModel.extend({

        defaults: {
            signature: "CompoundDocument",
            command_key: ['CompoundDocument', 'compounddocument','createrelease','createrevision','Reorganize','releases'],
            name: lang.compoundDocumentHeaderTitle,
            verb: lang.compoundDocumentHeaderTitle,
            doneVerb: lang.compoundDocumentHeaderTitle,
            scope: "multiple"
        }
    });
    return CompoundDocumentCommand;
});