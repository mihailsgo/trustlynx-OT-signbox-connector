/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/controls/toolbar/toolitems.factory',
  'csui-ext!csui/widgets/metadata/versions.toolbaritems',
  'csui/controls/toolbar/toolitem.model'
], function (_, lang, ToolItemsFactory, extraToolItems, TooItemModel) {

  var toolbarItems = {

    tableHeaderToolbar: new ToolItemsFactory(
        {
          info: [
            {
              signature: "VersionProperties",
              name: lang.ToolbarItemVersionInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "DocVersionPreview",
              name: lang.ToolbarItemDocVersionPreview,
              commandData: {ifNotOpenDelegate: true}
            },
            {signature: "CopyLink", name: lang.ToolbarItemCopyLink}
          ],
          main: [
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink
            },
            {
              signature: "VersionDownload",
              name: lang.ToolbarItemVersionDownload
            },
            {
              signature: "VersionDelete",
              name: lang.ToolbarItemVersionDelete
            },
            {
              signature: "PromoteVersion",
              name: lang.ToolbarItemPromoteVersion
            }
          ]
        },
        {
          maxItemsShown: 10,
          dropDownIconName: "csui_action_more32"
        }),
    inlineActionbar: new ToolItemsFactory(
      {
        info: [
          {
            signature: 'VersionProperties',
            name: lang.ToolbarItemVersionInfo,
            iconName: 'csui_action_properties32'
          },
          {
            signature: "DocVersionPreview",
            name: lang.ToolbarItemDocVersionPreview,
            iconName: "csui_action_preview32",
            commandData: {ifNotOpenDelegate: true}
          },
          {
            signature: "CopyLink",
            name: lang.ToolbarItemCopyLink,
            iconName: "csui_action_copy_link32"
          }
        ],
        main: [
          {
            signature: 'EmailLink',
            name: lang.ToolbarItemEmailLink,
            iconName: 'csui_action_email32'
          },
          {
            signature: 'VersionDownload',
            name: lang.ToolbarItemVersionDownload,
            iconName: 'csui_action_download32',
          },
          {
            signature: 'VersionDelete',
            name: lang.ToolbarItemVersionDelete,
            iconName: 'csui_action_delete32',
          },
          {
            signature: 'PromoteVersion',
            name: lang.ToolbarItemPromoteVersion,
            iconName: 'csui_action_promote32',
          },
        ],
      },
      {
        maxItemsShown: 5,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: 'csui_action_more32',
        addGroupSeparators: false,
      }
    ),
    dropdownMenuList: new ToolItemsFactory(
      {
        info: [
          {
            signature: "VersionProperties",
            name: lang.ToolbarItemVersionInfo
          },
          {signature: "CopyLink", name: lang.ToolbarItemCopyLink}
        ],
        main: [
          {
            signature: 'EmailLink',
            name: lang.ToolbarItemEmailLink
          },
          {
            signature: "VersionDownload",
            name: lang.ToolbarItemVersionDownload
          },
          {
            signature: "VersionDelete",
            name: lang.ToolbarItemVersionDelete
          },
          {
            signature: "PromoteVersion",
            name: lang.ToolbarItemPromoteVersion
          }
        ]
      },
      {
        maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
        dropDownIconName: "csui_action_caret_down32"
      }
    ),
    rightToolbar: new ToolItemsFactory(
        {
          main: [
            {
              signature: "PurgeAllVersions",
              name: lang.ToolbarItemVersionPurgeAll
            }
          ]
        },
        {
          hAlign: "right"
        }
    )
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
