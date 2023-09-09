/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'nuc/lib/underscore', 'nuc/lib/jquery', 'i18n'
], function (_, $, i18n) {
    'use strict';

    function isRTL() {
        return i18n.settings.rtl === true || document.documentElement.dir === 'rtl';
    }
    return {
        isRTL: isRTL
    };
});
