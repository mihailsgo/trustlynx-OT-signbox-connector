/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'csui-ext!csui/widgets/recentlyaccessed/tileview.toolbaritems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';
  var toolbarItems = {
    inlineActionbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              commandData: {dialogView: true},
              iconName: "csui_action_properties32"
            },
            {
              signature: "DocPreview",
              name: lang.ToolbarItemDocPreview,
              iconName: "csui_action_preview32",
              commandData: {
                ifNotOpenDelegate: true,
                fullView: false,
                includeContainers: false
              }
            }
          ],
          share: [
            {
              signature: "CopyLink", name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
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
          maxItemsShown: 1,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});
