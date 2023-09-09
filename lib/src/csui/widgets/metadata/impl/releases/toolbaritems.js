/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/nls/localized.strings',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
], function (_, publicLang, lang, ToolItemsFactory, TooItemModel) {
  'use strict';

  var toolbarItems = {
    tableHeaderToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "ReleasesProperties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {signature: "CopyLink", name: lang.ToolbarItemCopyLink}
          ],

          main: [
            {
              signature: "FavoriteRename",
              name: lang.ToolbarItemRename,
              onlyInTouchBrowser: true
            },
            {signature: "InlineEdit", name: lang.ToolbarItemRename},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
            {signature: "Delete", name: lang.ToolbarItemDelete},
          ]
        },
        {
          maxItemsShown: 15,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false,
          lazyActions: true
        }),

        inlineToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "ReleasesProperties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "CopyLink",
              name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          other: [
            {
              signature: "InlineEdit",
              name: lang.ToolbarItemRename,
              iconName: "csui_action_rename32"
            },
            {
              signature: "Lock",
              name: lang.ToolbarItemLock,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "Unlock",
              name: lang.ToolbarItemUnlock,
              iconName: "csui_action_unreserve32"
            },
            {
              signature: "Delete",
              name: lang.ToolbarItemDelete,
              iconName: "csui_action_delete32"
            }
          ]
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };
  
  return toolbarItems;
});
