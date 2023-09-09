/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/nls/localized.strings',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'csui/widgets/favorites/favorite.star.view',
  'csui/controls/versionsettings/version.settings.view',
  'csui-ext!csui/widgets/nodestable/toolbaritems',
  'i18n'
], function (_, publicLang, lang, ToolItemsFactory, TooItemModel, FavoriteStarView,
    VersionSettingsView, extraToolItems, i18n) {
  'use strict';
  var toolbarItems = {

    navigationToolbar: new ToolItemsFactory({
      main: [
        {
          signature: "BackToLastFragment",
          name: lang.ToolbarItemGoBack,
          icon: "icon arrow_back csui-icon-go-previous-node csui-no-hover-effect",
          toolItemAria: lang.ToolbarItemGoBack
        },
        {
          signature: "TreeBrowse",
          name: lang.ToolbarItemTreeBrowse,
          iconName: i18n && i18n.settings.rtl ? "csui_action_toggle_tree_rtl32" : "csui_action_toggle_tree32",
          toolItemAria: lang.ToolbarItemTreeBrowse,
          toolItemAriaExpand: false
        }
      ]
    }),

    filterToolbar: new ToolItemsFactory({
      filter: [
        {
          signature: "Filter",
          name: lang.ToolbarItemFilter,
          iconName: "csui_action_filter32",
          toolItemAria: lang.ToolbarItemFilterAria,
          toolItemAriaExpand: false,
          toolItemRole: 'button'
        }
      ]
    }),
    addToolbar: new ToolItemsFactory({
          add: []
        },
        {
          maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
          dropDownIconName: "csui_action_add32",
          dropDownText: lang.ToolbarItemAddItem,
          addTrailingDivider: false
        }),
    leftToolbar: new ToolItemsFactory(
        {
          main: [
            {
              signature: "CollectionCanCollect",
              name: lang.ToolbarItemAddItem,
              iconName: "csui_action_add32"
            }
          ]
        }),
    tableHeaderToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            }, {
              signature: "DocPreview",
              name: lang.ToolbarItemDocPreview,
              commandData: {ifNotOpenDelegate: true}
            },
            {signature: "CopyLink", name: lang.ToolbarItemCopyLink}
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
              signature: 'Shares',
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
			{signature: "Restructure", name: lang.ToolbarItemRestructure},

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
    captionMenuToolbar: new ToolItemsFactory({
          other: [
            {signature: "Properties", name: lang.MenuItemInformation},
            {signature: "CopyLink", name: lang.MenuItemCopyLink},
            {signature: "EmailLink", name: lang.ToolbarItemEmailLinkShort},
            {signature: "permissions", name: lang.ToolbarItemPermissions},
            {signature: "Rename", name: lang.MenuItemRename},
            {signature: "Copy", name: lang.MenuItemCopy},
            {signature: "Move", name: lang.MenuItemMove},
            {signature: "Delete", name: lang.MenuItemDelete},
            {signature: "Collect", name: lang.ToolbarCollect}
          ]
        },
        {
          maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
          dropDownIconName: "csui_action_caret_down32"
        }),
    inlineActionbar: new ToolItemsFactory({
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
              signature: "InlineEdit",
              name: lang.ToolbarItemRename,
              iconName: "csui_action_rename32"
            },
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
              iconName: "csui_action_unreserve32"
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
              signature: "RemoveCollectedItems",
              name: lang.ToolbarItemRemoveCollectionItems,
              iconName: "csui_action_collection_delete32"
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
            },
            {
              signature: "Restructure",
              name: lang.ToolbarItemRestructure
            }
          ]
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        }),
    rightToolbar: new ToolItemsFactory({
      main: [
        {
          signature: "Thumbnail",
          name: lang.ToolbarItemThumbnail,
          iconName: "csui_action_switch_thumb32",
          commandData: {useContainer: true},
          title: lang.ThumbnailTitle
        },
        {
          signature: "ToggleDescription",
          name: lang.ToolbarItemShowDescription,
          iconName: "csui_action_reveal_description32",
          commandData: {useContainer: true},
          toolItemRole: 'button'
        },
        {
          signature: "Comment",
          name: lang.ToolbarItemComment,
          iconName: "esoc_no_comment32",
          iconNameForOn: "esoc_comment32",
          className: "esoc-socialactions-comment",
          customView: true,
          commandData: {useContainer: true}
        },
        {
          signature: "VersionSettings",
          enabled: true,
          viewClass: VersionSettingsView,
          customView: true,
          commandData: {
            useContainer: true,
            viewOptions: {
              focusable: false
            }
          }
        },
        {
          signature: "Favorite2",
          enabled: true,
          viewClass: FavoriteStarView,
          customView: true,
          commandData: {
            useContainer: true,
            viewOptions: {
              focusable: false
            }
          }
        },
        {
          signature: "RestoreWidgetViewSize",
          name: lang.ToolbarItemRestoreWidgetViewSize,
          iconName: "csui_action_minimize32",
          commandData: {useContainer: true}
        },
        {
          signature: "MaximizeWidgetView",
          name: lang.ToolbarItemMaximizeWidgetView,
          iconName: "csui_action_expand32",
          commandData: {useContainer: true}
        }
      ]
    }, {
      hAlign: "right",
      addTrailingDivider: false
    })
  };

  if (extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar && key === 'otherToolbar') {
          targetToolbar = toolbarItems['tableHeaderToolbar'];
        }
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

  toolbarItems.clone = function () {
    return ToolItemsFactory.cloneToolbarItems(this);
  };

  return toolbarItems;
});
