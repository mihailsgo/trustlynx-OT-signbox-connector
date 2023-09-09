/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',  
    'i18n!xecmpf/widgets/eac/impl/nls/lang',
    'csui/controls/toolbar/toolitems.factory',
    'csui/controls/toolbar/toolitem.model',
    'csui-ext!csui/widgets/nodestable/toolbaritems'
  ], function (_, lang, ToolItemsFactory,TooItemModel,extraToolItems) {
    'use strict';
  
    var toolbarItems = {
  
      leftToolbar: new ToolItemsFactory(
        {
          main: [          
           
            {
              signature: "EACBack",
              name: lang.toolbarItemBack,
              toolItemAria: lang.ToolbarItemBackAria,
              iconName: "csui_action_back32"
    
            },
            
            {
              signature: "addEvents",
              name: lang.addEvents,
              type: 806,
              iconName: "csui_action_add32",
            },
           
          ]
        }),
  
        tableHeaderToolbar: new ToolItemsFactory({
          info: [
            {signature: "addActionPlan", name: lang.addActionPlan},
            {signature: "addToWarehouse", name: lang.addToWareHouse},
            {signature: "deleteEvent", name: lang.delete}
          ],
        },
        {
          maxItemsShown: 15,
          dropDownIcon: "icon icon-toolbar-more",
          dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
          dropDownText: lang.ToolbarItemMore,
          addGroupSeparators: false,
          lazyActions: true
        }),
  
        inlineActionbar:  new ToolItemsFactory({
          main: [           
            {
              signature:'addActionPlan',
              name:'Add Action Plan',
              icon: "icon icon-toolbarAdd",
              svgId: "themes--carbonfiber--image--generated_icons--action_add32"
              
            }
          ],
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIcon: "icon icon-toolbar-more",
          dropDownSvgId: "themes--carbonfiber--image--generated_icons--action_more32",
          addGroupSeparators: false
        }),


  
  
     
    };

    return toolbarItems;
  });
  