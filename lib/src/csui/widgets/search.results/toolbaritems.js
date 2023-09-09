/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'i18n!csui/widgets/search.results/nls/lang',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'csui-ext!csui/widgets/search.results/toolbaritems',
  'csui/widgets/search.results/impl/toolbaritems'
], function (_, publicLang, lang, ToolItemsFactory, TooItemModel, extraToolItems,
    oldExtraToolItems) {
  'use strict';
  var toolbarItems = {

    filterToolbar: new ToolItemsFactory({
          filter: [
            {
              signature: "Filter",
              name: lang.ToolbarItemFilter,
              iconName: "csui_action_filter32"
            }
          ]
        },
        {
          addTrailingDivider: false
        }),
    tableHeaderToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "CopyLink",
              name: lang.ToolbarItemCopyLink
            }
          ],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'SendTo',
              name: lang.ToolbarItemSendTo,
              flyout: 'sendto',
              group: 'share'
            },
            {
              signature: 'Share',
              name: lang.ToolbarItemShare,
              flyout: 'share',
              promoted: true,
              group: 'share'
            },
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink,
              flyout: 'sendto',
              promoted: true,
              group: 'share'
            }
          ],
          main: [
            {signature: "InlineEdit", name: lang.ToolbarItemRename},
            {signature: "permissions", name: lang.ToolbarItemPermissions},
            {signature: "Download", name: lang.ToolbarItemDownload},
            {signature: "ReserveDoc", name: publicLang.ToolbarItemReserve},
            {signature: "UnreserveDoc", name: publicLang.ToolbarItemUnreserve},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
            {signature: "Copy", name: lang.ToolbarItemCopy},
            {signature: "Move", name: lang.ToolbarItemMove},
            {signature: "AddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "Collect", name: lang.ToolbarCollect},
            {signature: "Delete", name: lang.ToolbarItemDelete},
            {signature: "RemoveCollectedItems", name: lang.ToolbarItemRemoveCollectionItems},
            {signature: "ZipAndDownload", name: lang.MenuItemZipAndDownload},
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
          ],
          shortcut: [
            {signature: "OriginalCopyLink", name: lang.ToolbarItemOriginalCopyLink},
            {signature: "OriginalEdit", name: lang.ToolbarItemOriginalEdit},
            {signature: "OriginalEmailLink", name: lang.ToolbarItemOriginalShare},
            {signature: "OriginalReserveDoc", name: publicLang.ToolbarItemOriginalReserve},
            {signature: "OriginalUnreserveDoc", name: publicLang.ToolbarItemOriginalUnreserve},
            {signature: "OriginalCopy", name: lang.ToolbarItemOriginalCopy},
            {signature: "OriginalMove", name: lang.ToolbarItemOriginalMove},
            {signature: "OriginalAddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "OriginalDownload", name: lang.ToolbarItemOriginalDownload},
            {signature: "OriginalDelete", name: lang.ToolbarItemOriginalDelete}
          ]
        },
        {
          maxItemsShown: 15,
          dropDownIconName: "csui_action_more32",
          dropDownText: lang.ToolbarItemMore,
          addGroupSeparators: false,
          lazyActions: true
        }),
    otherToolbar: new ToolItemsFactory({
          info: [{
            signature: "Properties",
            name: lang.ToolbarItemInfo,
            iconName: "csui_action_properties32"
          }, {
            signature: "DocPreview",
            name: lang.ToolbarItemDocPreview,
            commandData: {ifNotOpenDelegate: true}
          }, {
            signature: "CopyLink",
            name: lang.ToolbarItemCopyLink
          }],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'SendTo',
              name: lang.ToolbarItemSendTo,
              flyout: 'sendto',
              group: 'share'
            },
            {
              signature: 'Share',
              name: lang.ToolbarItemShare,
              flyout: 'share',
              promoted: true,
              group: 'share'
            },
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink,
              flyout: 'sendto',
              promoted: true,
              group: 'share'
            }
          ],
          main: [
            {signature: "permissions", name: lang.ToolbarItemPermissions},
            {signature: "Download", name: lang.ToolbarItemDownload},
            {signature: "ReserveDoc", name: publicLang.ToolbarItemReserve},
            {signature: "UnreserveDoc", name: publicLang.ToolbarItemUnreserve},
            {signature: "Copy", name: lang.ToolbarItemCopy},
            {signature: "Move", name: lang.ToolbarItemMove},
            {signature: "AddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "Collect", name: lang.ToolbarCollect},
            {signature: "Delete", name: lang.ToolbarItemDelete},
            {signature: "ZipAndDownload", name: lang.MenuItemZipAndDownload},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
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
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false,
          lazyActions: true
        }),
    inlineToolbar: new ToolItemsFactory({
          info: [{
            signature: "Properties",
            name: lang.ToolbarItemInfo,
            iconName: "csui_action_properties32"
          }, {
            signature: "DocPreview",
            name: lang.ToolbarItemDocPreview,
            iconName: "csui_action_preview32",
            commandData: {ifNotOpenDelegate: true}
          }, {
            signature: "CopyLink",
            name: lang.ToolbarItemCopyLink,
            iconName: "csui_action_copy_link32"
          }
          ],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true,  iconName: "csui_action_edit32"},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'Share',
              name: lang.MenuItemShare,
              iconName: "csui_action_share32",
              flyout: 'share'
            },
            {
              signature: 'SendTo',
              name: lang.ToolbarItemSendTo,
              iconName: "csui_action_send_to32",
              flyout: 'sendto'
            },
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink,
              flyout: 'sendto'
            }	
          ],
          other: [
            {
              signature: "permissions",
              name: lang.ToolbarItemPermissions,
              iconName: "csui_action_view_perms32"
            },
            {
              signature: "Download",
              name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "ReserveDoc",
              name: publicLang.ToolbarItemReserve,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "UnreserveDoc",
              name: publicLang.ToolbarItemUnreserve,
              iconName: "csui_action_reserve32"
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
              signature: "Copy",
              name: lang.ToolbarItemCopy,
              iconName: "csui_action_copy32"
            },
            {
              signature: "Move",
              name: lang.ToolbarItemMove,
              iconName: "csui_action_move32"
            },
            {
              signature: "AddVersion",
              name: lang.ToolbarItemAddVersion,
              iconName: "csui_action_add_version32"
            },
            {
              signature: "Collect",
              name: lang.ToolbarCollect,
              iconName: "csui_action_collect32"
            },
            {
              signature: "Delete",
              name: lang.ToolbarItemDelete,
              iconName: "csui_action_delete32"
            },
            {
              signature: "ZipAndDownload",
              name: lang.MenuItemZipAndDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "CompoundDocument",
              name: lang.compoundDocument,
              flyout: "CompoundDocument",
              iconName: "csui_action_compound_document32"
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
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        }),
    tabularInlineToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "CopyLink",
              name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true,  iconName: "csui_action_edit32"},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'Share',
              name: lang.MenuItemShare, 
              iconName: "csui_action_share32",
              flyout: 'share'
            }
          ],
          other: [
            {
              signature: "permissions",
              name: lang.ToolbarItemPermissions,
              iconName: "csui_action_view_perms32"
            },
            {
              signature: "Download",
              name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "ReserveDoc",
              name: publicLang.ToolbarItemReserve,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "UnreserveDoc",
              name: publicLang.ToolbarItemUnreserve,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "Copy",
              name: lang.ToolbarItemCopy,
              iconName: "csui_action_copy32"
            },
            {
              signature: "Move",
              name: lang.ToolbarItemMove,
              iconName: "csui_action_move32"
            },
            {
              signature: "AddVersion",
              name: lang.ToolbarItemAddVersion,
              iconName: "csui_action_add_version32"
            },
            {
              signature: "Collect",
              name: lang.ToolbarCollect,
              iconName: "csui_action_collect32"
            },
            {
              signature: "Delete",
              name: lang.ToolbarItemDelete,
              iconName: "csui_action_delete32"
            },
            {
              signature: "ZipAndDownload",
              name: lang.MenuItemZipAndDownload,
              iconName: "csui_action_download32"
            }
          ]
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        }),

    versionToolItems: ['properties', 'open', 'download', 'delete']
  };

  if (oldExtraToolItems) {
    addExtraToolItems(oldExtraToolItems);
  }

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
