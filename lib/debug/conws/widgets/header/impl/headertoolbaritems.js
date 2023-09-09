csui.define(['module',
  'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'conws/widgets/header/impl/favorite.icon.view',
  'conws/widgets/header/impl/commenting.icon.view',
  'csui-ext!conws/widgets/header/headertoolbaritems'
], function (module, _, ToolItemsFactory, ToolItemModel, Lang, FavoriteIconView, CommentingIconView, extraToolItems) {

  var headerToolbarItems = {

    rightToolbar: new ToolItemsFactory({
      main: [
        {
          signature: "Comment",
          name: Lang.ToolbarItemComment,
          icon: "icon icon-socialComment",
          enabled: true,
          className: "esoc-socialactions-comment",
          customView: true,
          viewClass: CommentingIconView,
          commandData: { useContainer: true },
          index: 4 // Leaving first three positions for extensions
        },
        {
          signature: "Favorite2",
          enabled: true,
          viewClass: FavoriteIconView,
          customView: true,
          commandData: { useContainer: true },
          index: 5
        }
      ]
    }),

    delayedActionsToolbar: new ToolItemsFactory({
      menu: [
        {
          signature: "CopyLink",
          name: Lang.ToolbarItemCopyLink,
          icon: "icon icon-toolbar-copylink",
          svgId: "themes--carbonfiber--image--generated_icons--action_copy_link32"
        },
        {
          signature: "EmailLink",
          name: Lang.ToolbarItemEmailLinkShort,
          icon: "icon icon-toolbar-share",
          svgId: "themes--carbonfiber--image--generated_icons--action_share32"
        }
      ]
    },
      {
        maxItemsShown: 0,
        dropDownIconName: "csui_action_more32",
        addGroupSeparators: false,
        dropDownText: Lang.ToolbarItemMore,
        customView: true
      })

  };

  if (!!extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = headerToolbarItems[key];
        if (!!targetToolbar) {
          _.each(toolItems, function (toolItem) {
            toolItem = new ToolItemModel(toolItem);
            targetToolbar.addItem(toolItem);
          });
        }
      });
    });
  }

  headerToolbarItems['rightToolbar'].collection.comparator = function (model) {
    return model.get('index');
  }
  headerToolbarItems['rightToolbar'].collection.sort();

  return headerToolbarItems;
});
