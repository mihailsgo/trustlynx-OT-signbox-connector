csui.define( [
    'conws/utils/commands/navigate/impl/navigateup.arrow.view',
    'i18n!conws/utils/commands/nls/commands.lang'
  ], function (NavigateupArrowView, lang) {

  var toolbarItems = {
    navigationToolbar: [
      {
        signature: "ConwsNavigateUp",
        name: lang.CommandNameNavigateUp,
        toolItemAria: lang.CommandNameNavigateUp,
        iconName: "conws_action_navigate_up",
        customView: true,
        viewClass: NavigateupArrowView,
        group: 'main'
      }
    ]
  };
  return toolbarItems;
});