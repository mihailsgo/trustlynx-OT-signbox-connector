/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/utils/base',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'csui-ext!csui/widgets/permissions/impl/permissions.list/toolbaritems',
  'csui-ext!csui/widgets/permissions/permissions.list/toolbaritems'
], function (_, base, lang, ToolItemsFactory, TooItemModel, deprecatedExtraToolItems, extraToolItems) {
  'use strict';
  var toolbarItems = {

    inlineToolbar: new ToolItemsFactory({
          other: [
            {
              signature: "ChangeOwnerPermission",
              name: lang.ToolbarItemChangeOwnerPermission,
              iconName: "csui_action_change_owner32"
            },
            {
              signature: "DeletePermission",
              name: lang.ToolbarItemDeletePermission,
              iconName: "csui_action_delete32"
            },
            {
              signature: "EditPermission",
              name: lang.ToolbarItemEditPermission,
              iconName: "csui_action_edit32"
            },
            {
              signature: "ApplyPermission",
              name: lang.ToolbarItemApplyPermission,
              iconName: "csui_action_share32"
            }
          ]
        },
        {
          maxItemsShown: base.isHybrid() ? 1 : 3,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32"
        })

  };

  if (deprecatedExtraToolItems) {
    console.warn('DEPRECATED: depend on the extension "csui-ext!csui/widgets/permissions/permissions.list/toolbaritems"' + ' instead.');

    if(extraToolItems) {
      var allExtraToolItems = extraToolItems.concat(deprecatedExtraToolItems);
      addExtraToolItems(allExtraToolItems);
    }
    else {
      addExtraToolItems(deprecatedExtraToolItems);
    }
  }
  else if(extraToolItems) {
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
