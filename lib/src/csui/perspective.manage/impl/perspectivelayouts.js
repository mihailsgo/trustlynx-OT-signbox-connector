/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
    'csui/lib/underscore',
    'i18n!csui/perspective.manage/impl/nls/lang',
    'csui-ext!perspective.manage/impl/perspectivelayouts'
], function(module,_, Lang, extraPerspectiveLayouts) {
    var config = _.extend({       
        enableNewlayoutOption: false,
      }, module.config());

    var perspectivelayouts = [
        {
            title: Lang.LcrLayoutTitle,
            type: "left-center-right",
            icon: "csui-layout-lcr"
        },
        {
            title: Lang.FlowLayoutTitle,
            type: "flow",
            icon: "csui-layout-flow"
        }
    ];
    if (config.enableNewlayoutOption) {
        perspectivelayouts.push(
            {
                title: Lang.RSPLayoutTitle,
                type: "sidepanel-right",
                icon: "csui-layout-sidepanel-right"
            },
            {
                title: Lang.LSPLayoutTitle,
                type: "sidepanel-left",
                icon: "csui-layout-sidepanel-left"
            }
        );
    }


    if(extraPerspectiveLayouts) {
        perspectivelayouts = _.union(perspectivelayouts, extraPerspectiveLayouts);
    }

    return perspectivelayouts;
});