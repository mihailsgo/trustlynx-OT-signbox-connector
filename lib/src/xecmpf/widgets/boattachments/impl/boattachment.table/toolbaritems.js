/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module',
    'csui/lib/underscore',
    'csui/controls/toolbar/toolitem.model',
    'csui/controls/toolbar/toolitems.factory',
    'i18n!xecmpf/widgets/boattachments/impl/nls/lang',
    'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
    'csui-ext!xecmpf/widgets/boattachments/toolbaritems'
], function (module, _, ToolItemModel, ToolItemsFactory, lang, _lang, extraToolItems) {

    var toolbarItems = {

        tableHeaderToolbar: new ToolItemsFactory({
                main: [
                    {signature: "Snapshot", name: lang.CommandSnapshot}
                ]
            },
            {
                maxItemsShown: 15,
                dropDownIcon: "icon icon-toolbar-more",
                lazyActions: true
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
              toolItem = new ToolItemModel(toolItem);
              targetToolbar.addItem(toolItem);
            });
          });
        });
    }

    return toolbarItems;

});
