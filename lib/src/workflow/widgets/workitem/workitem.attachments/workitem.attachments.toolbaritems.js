/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui-ext!workflow/widgets/workitem/workitem.attachments/toolbaritems'
], function (_, ToolItemsFactory, ToolItemModel, lang, extraToolItems) {
  'use strict';

  var toolbarItems = {
    inlineActionbar: new ToolItemsFactory({
      other: [
        {
          signature: "Properties",
          name: lang.ToolbarItemInfo,
          icon: "icon icon-toolbar-metadata"
        },
        {
          signature: "Edit",
          name: lang.ToolbarItemEdit,
          icon: "icon icon-toolbar-edit"
        },
        {
          signature: "Download",
          name: lang.ToolbarItemDownload,
          icon: "icon icon-toolbar-download"
        },
        {
          signature: "OpenShortlink",
          name: lang.ToolbarItemOpen,
          icon: "icon icon-toolbar-shortcut"
        },
        {
          signature: "InlineEdit",
          name: lang.ToolbarItemRename,
          icon: "icon icon-toolbar-rename"
        },
        {
          signature: "Copy",
          name: lang.ToolbarItemCopy,
          icon: "icon icon-toolbar-copy"
        },
        {
          signature: "Move",
          name: lang.ToolbarItemMove,
          icon: "icon icon-toolbar-move"
        },
        {
          signature: "AddVersion",
          name: lang.ToolbarItemAddVersion,
          icon: "icon icon-toolbar-add-version"
        },
        {
          signature: "Delete",
          name: lang.ToolbarItemDelete,
          icon: "icon icon-toolbar-delete"
        }
      ]
    },
      {
        maxItemsShown: 4,
        dropDownText: lang.ToolbarItemMore,
        dropDownIcon: "icon icon-toolbar-more"
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
          toolItem = new ToolItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;
});
