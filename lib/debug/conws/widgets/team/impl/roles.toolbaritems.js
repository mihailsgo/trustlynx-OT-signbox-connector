csui.define([
  'module',
  "csui/controls/toolbar/toolitem.model",
  'csui/controls/toolbar/toolitems.factory',
  'i18n!conws/utils/commands/nls/commands.lang'
], function (module, ToolItemModel, ToolItemsFactory, lang) {

  var toolbarItems = {

    otherToolbar: new ToolItemsFactory({
          first: [
            {
              signature: "AddRole",
              name: lang.CommandNameAddRole,
              iconName: "csui_action_add32"
            }
          ],
          second: [
            {
              signature: "PrintRoles",
              name: lang.CommandNamePrintRoles,
              iconName: "csui_action_print32"
            },
            {
              signature: "ExportRoles",
              name: lang.CommandNameExportRoles,
              iconName: "csui_action_download32"
            }
          ],
          third: [
            {
              signature: "ShowDetails",
              name: lang.CommandNameShowDetails
            },
            {
              signature: "DeleteRoles",
              name: lang.CommandNameDeleteRole
            }
          ]
        })
  };

  return toolbarItems;

});
