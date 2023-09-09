/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'csui-ext!csui/widgets/nodestable/headermenuitems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraMenuItems) {
  'use strict';

  var toolbarItems = {
    headerMenuToolbar: new ToolItemsFactory({
          other: [
            {signature: "Properties", name: lang.MenuItemInformation},
            {signature: "CopyLink", name: lang.MenuItemCopyLink},
            {signature: "Share", name: lang.MenuItemShare, flyout: 'share'},
            {signature: "SendTo", name: lang.ToolbarItemSendTo, flyout: 'sendto'},
            {signature: "EmailLink", name: lang.ToolbarItemEmailLinkShort, flyout: 'sendto'},
            {signature: "permissions", name: lang.ToolbarItemPermissions},
            {signature: "Rename", name: lang.MenuItemRename},
            {signature: "ReserveDoc", name: lang.ToolbarItemReserve},
            {signature: "UnreserveDoc", name: lang.ToolbarItemUnreserve},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
            {signature: "Copy", name: lang.MenuItemCopy},
            {signature: "Move", name: lang.MenuItemMove},
            {signature: "Collect", name: lang.ToolbarCollect},
            {signature: "Delete", name: lang.MenuItemDelete},
            {signature: "ZipAndDownload", name: lang.ToolbarItemZipAndDownload},
			{signature: "Restructure", name: lang.MenuItemRestructure},

			{
              signature: "CompoundDocument",
              name: lang.compoundDocument,
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRelease",
              name: lang.CreateRelease,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRevision",
              name: lang.CreateRevision,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "Reorganize",
              name: lang.Reorganize,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "ViewReleases",
              name: lang.ToolbarItemViewReleases,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            }
          ]
        },
        {
          maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
          dropDownIconName: "csui_action_caret_down32"
        }
    )
  };

  if (extraMenuItems) {
    _.each(extraMenuItems, function (moduleMenuItems) {
      _.each(moduleMenuItems, function (menuItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(menuItems, function (menuItem) {
          menuItem = new TooItemModel(menuItem);
          targetToolbar.addItem(menuItem);
        });
      });
    });
  }

  toolbarItems.clone = function () {
    return ToolItemsFactory.cloneToolbarItems(this);
  };

  return toolbarItems;
});
