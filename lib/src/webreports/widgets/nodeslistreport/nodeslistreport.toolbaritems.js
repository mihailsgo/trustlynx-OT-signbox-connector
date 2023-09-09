/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
    'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
    'csui/controls/toolbar/toolitems.factory'
], function (_, lang, ToolItemsFactory) {

    var toolbarItems = {
        tableHeaderToolbar: new ToolItemsFactory({
            main: [
                {
                    signature: "Properties",
                    name: lang.ToolbarItemInfo,
                    iconName: "csui_action_properties32"
                },
                {signature: "Edit", name: lang.ToolbarItemEdit},
                {signature: "EmailLink", name: lang.ToolbarItemShare},
                {signature: "Download", name: lang.ToolbarItemDownload},
                {signature: "ReserveDoc", name: lang.ToolbarItemReserve},
                {signature: "UnreserveDoc", name: lang.ToolbarItemUnreserve},
                {signature: "Copy", name: lang.ToolbarItemCopy},
                {signature: "Move", name: lang.ToolbarItemMove},
                {signature: "AddVersion", name: lang.ToolbarItemAddVersion}
            ],
            shortcut: [
                {signature: "OriginalEdit", name: lang.ToolbarItemOriginalEdit},
                {signature: "OriginalEmailLink", name: lang.ToolbarItemOriginalShare},
                {signature: "OriginalReserveDoc", name: lang.ToolbarItemOriginalReserve},
                {signature: "OriginalUnreserveDoc", name: lang.ToolbarItemOriginalUnreserve},
                {signature: "OriginalCopy", name: lang.ToolbarItemOriginalCopy},
                {signature: "OriginalMove", name: lang.ToolbarItemOriginalMove},
                {signature: "OriginalAddVersion", name: lang.ToolbarItemAddVersion},
                {signature: "OriginalDownload", name: lang.ToolbarItemOriginalDownload}
            ]
        }),

        inlineActionbar: new ToolItemsFactory({
                info: [
                    {
                        signature: "Properties", name: lang.ToolbarItemInfo,
                        commandData: {dialogView: true},
                        iconName: "csui_action_properties32"
                    },
                    {
                        signature: "CopyLink",
                        name: lang.ToolbarItemCopyLink,
                        iconName: "csui_action_copy_link32"
                    },
                    {
                        signature: 'SendTo',
                        name: lang.ToolbarItemSendTo,
                        iconName: "csui_action_send_to32"
                    }
                ],
                share: [],
                edit: [
                    {
                        signature: "Edit", name: lang.ToolbarItemEdit,
                        iconName: "csui_action_edit32"
                    }
                ],
                other: [
                    {
                        signature: "Download", name: lang.ToolbarItemDownload,
                        iconName: "csui_action_download32"
                    },
                    {
                        signature: "goToLocation", name: lang.ToolbarGoToLocation
                    }
                ]
            },
            {
                maxItemsShown: 1, // this must be set to 1 for the menu point of origin to be within the widget
                dropDownText: lang.ToolbarItemMore,
                dropDownIconName: "csui_action_more32"
            }),
        dropdownMenuListInProperties: new ToolItemsFactory({
                main: [
                    {signature: "Edit", name: lang.ToolbarItemEdit},
                    {signature: "EmailLink", name: lang.ToolbarItemShare},
                    {signature: "Download", name: lang.ToolbarItemDownload},
                    {signature: "ReserveDoc", name: lang.ToolbarItemReserve},
                    {signature: "UnreserveDoc", name: lang.ToolbarItemUnreserve},
                    {signature: "Copy", name: lang.ToolbarItemCopy},
                    {signature: "Move", name: lang.ToolbarItemMove},
                    {signature: "AddVersion", name: lang.ToolbarItemAddVersion}
                ],
                shortcut: [
                    {signature: "OriginalEdit", name: lang.ToolbarItemOriginalEdit},
                    {signature: "OriginalEmailLink", name: lang.ToolbarItemOriginalShare},
                    {signature: "OriginalReserveDoc", name: lang.ToolbarItemOriginalReserve},
                    {signature: "OriginalUnreserveDoc", name: lang.ToolbarItemOriginalUnreserve},
                    {signature: "OriginalCopy", name: lang.ToolbarItemOriginalCopy},
                    {signature: "OriginalMove", name: lang.ToolbarItemOriginalMove},
                    {signature: "OriginalAddVersion", name: lang.ToolbarItemAddVersion},
                    {signature: "OriginalDownload", name: lang.ToolbarItemOriginalDownload}
                ]
            },
            {
                maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
                dropDownIconName: "csui_action_caret_down32"
            }
        )

    };

    return toolbarItems;

});
