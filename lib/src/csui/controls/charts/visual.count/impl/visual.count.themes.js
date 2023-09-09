/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['i18n!csui/controls/charts/visual.count/impl/nls/lang'], function(lang) {
    'use strict';
    var VisualCountThemes =  [
        {
            name: 'otPrimary',
            label: lang.OTPrimary,
            palette: ['#111b58','#00b8ba','#2E3D98','#09bcef','#4f3690','#7e929f','#5d0026','#055e78','#f05822','#090e2c'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otSecondary',
            label: lang.OTSecondary,
            palette: ['#4f3690','#004267','#7e929f','#111b58','#00b8ba','#2e3d98','#a7261b','#a0006b','#e00051','#5d0026'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otTertiary',
            label: lang.OTTertiary,
            palette: ['#006353','#8cc53e','#003B4D','#0084ce','#4f3690','#067d14','#111b58','#00b8ba','#2e3d98','#775909'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'dataClarity',
            label: lang.DataClarity,
            palette: ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#7f7f7f','#bcbd22','#17becf','#e377c2','#8c564b','#aec7e8','#ffbb78','#98df8a','#ff9896','#c5b0d5','#c7c7c7','#dbdb8d','#9edae5','#f7b6d2','#c49c94'],
            other: '#999',
            opacity: 1
        },
        {
            name: 'dataClarityPatterned',
            label: lang.DataClarityPatterned,
            palette: ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#7f7f7f','#bcbd22','#17becf','#e377c2','#8c564b','#aec7e8','#ffbb78','#98df8a','#ff9896','#c5b0d5','#c7c7c7','#dbdb8d','#9edae5','#f7b6d2','#c49c94'],
            other: '#999',
            opacity: 1
        },
        {
            name: 'otNavy',
            label: lang.OTNavy,
            palette: ['#090e2c','#0d1442','#111b58','#414979','#70769b','#a0a4bc'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otTeal',
            label: lang.OTTeal,
            palette: ['#005c5d','#008a8b','#00b8ba','#33c6c8','#66d4d6','#99e3e3'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otIndigo',
            label: lang.OTIndigo,
            palette: ['#171f4c','#232e72','#2e3d98','#5864ad','#828bc1','#abb1d6'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otPlum',
            label: lang.OTPlum,
            palette: ['#281b48','#3b296c','#4f3690','#725ea6','#9586bc','#b9afd3'],
            other: '#777',
            opacity: 1
        },
        {
            name: 'otMagenta',
            label: lang.OTMagenta,
            palette: ['#500036','#780050','#a0006b','#b33389','#c666a6','#d999c4'],
            other: '#777',
            opacity: 1
        }
    ];

    return VisualCountThemes;
});