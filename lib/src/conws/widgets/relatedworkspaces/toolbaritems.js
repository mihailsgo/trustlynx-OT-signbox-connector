/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'i18n!conws/utils/workspaces/impl/nls/lang',
  'i18n!conws/widgets/relatedworkspaces/impl/nls/lang',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'csui/widgets/favorites/favorite.star.view',
  'csui-ext!conws/widgets/relatedworkspaces/toolbaritems'
], function (_, wksplang, lang, ToolItemsFactory, TooItemModel, FavoriteStarView,
    extraToolItems) {
  'use strict';
  var toolbarItems = {

    addToolbar: new ToolItemsFactory(
        {
          main: [
            {
              signature: "AddRelation",
              name: lang.ToolbarItemAddRelation,
              iconName: "csui_action_add32"
            }
          ]
        },
        {
          maxItemsShown: 2,
          dropDownIconName: "csui_action_more32",
          dropDownText: "...",
          addTrailingDivider: false
        }),
    tableHeaderToolbar: new ToolItemsFactory({
        main: [
          {
            signature: "RemoveRelation",
            name: lang.ToolbarItemRemoveRelation
          }
        ]
      },
      {
        maxItemsShown: 15,
        dropDownIconName: "csui_action_more32",
        dropDownText: "...",
        addGroupSeparators: false,
        lazyActions: true
      }),
    rightToolbar: new ToolItemsFactory({
      main: [
        {
          signature: "CloseExpandedView",
          name: wksplang.ToolbarItemCloseExpandedView,
          iconName: "csui_action_minimize32"
        }
     ]
    }, {
      hAlign: "right",
      maxItemsShown: 5,
      dropDownIconName: "csui_action_more32",
      dropDownText: "...",
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

  return toolbarItems;
});
