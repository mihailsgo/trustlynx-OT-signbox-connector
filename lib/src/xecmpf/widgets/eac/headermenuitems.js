/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
    'csui/controls/toolbar/toolitems.factory',
    'csui/controls/toolbar/toolitem.model',
    'csui-ext!xecmpf/widgets/eac/headermenuitems'
  ], function (_, lang, ToolItemsFactory, TooItemModel, extraMenuItems) {
    'use strict';
  
    var toolbarItems = {
      headerMenuToolbar: new ToolItemsFactory({
            
          },
          {
            maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
            dropDownIcon: "icon icon-expandArrowDown",
            dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_caret_down32"
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
  