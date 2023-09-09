/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/controls/toolbar/toolitems.factory',
    'csui/controls/toolbar/toolitem.model',
    'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
    'i18n!xecmpf/widgets/eac/impl/nls/lang',
    'css!xecmpf/widgets/eac/impl/actionplan.list/impl/actionplan.listitem'
  ], function (_, ToolItemsFactory, ToolItemModel, lang, EacLang) {
    'use strict';
  
    var toolbarItems = {
      inlineActionbar: new ToolItemsFactory({
            main: [
              {
                signature: "InlineEdit",
                name: lang.ToolbarItemRename
              },
              {
                signature: "Delete",
                name: lang.ToolbarItemDelete
              }
            ]
          },
          {
            maxItemsShown: 1,
            dropDownText: lang.ToolbarItemMore,
            dropDownIcon: "icon xecmpf-more-actions-inline"
          }),
          headerActionbar: new ToolItemsFactory({
            main: [
              {
                signature: "addToWarehouse",
                name: EacLang.addToWareHouse
              },
              {
                signature: "Delete",
                name: lang.ToolbarItemDelete
              }
            ]
          },
          {
            maxItemsShown: 2,
            dropDownText: lang.ToolbarItemMore,
            dropDownIcon: "icon xecmpf-more-action-plan-inline"
          })
    };
  
    return toolbarItems;
  });
  