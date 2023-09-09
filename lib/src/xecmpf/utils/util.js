/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore'], function (_) {
    'use strict';
    return {
        unEscapeSpecialCharacters: function (extSystem) {

            if (extSystem !== undefined) {
                if (_.isString(extSystem)) {
                    extSystem = extSystem.replaceAll('/', '0xF0A7');
                    extSystem = extSystem.replaceAll('\\', '0xF0A6');
                }
                else if (_.isArray(extSystem)) {
                    extSystem[0] = extSystem[0].replaceAll('/', '0xF0A7');
                    extSystem[0] = extSystem[0].replaceAll('\\', '0xF0A6');
                }
                else {
                    return extSystem;
                }

            }

            return extSystem;
        }
    }

});