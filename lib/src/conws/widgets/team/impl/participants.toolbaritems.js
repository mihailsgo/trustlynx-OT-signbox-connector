/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  "csui/controls/toolbar/toolitem.model",
  'csui/controls/toolbar/toolitems.factory',
  'i18n!conws/utils/commands/nls/commands.lang'
], function (module, ToolItemModel, ToolItemsFactory, lang) {

  var toolbarItems = {

    otherToolbar: new ToolItemsFactory({
          first: [
            {
              signature: "AddParticipant",
              name: lang.CommandNameAddParticipant,
              iconName: "csui_action_add32"
            }
          ],
          second: [
            {
              signature: "PrintParticipants",
              name: lang.CommandNamePrintParticipants,
              iconName: "csui_action_print32"
            },
            {
              signature: "ExportParticipants",
              name: lang.CommandNameExportParticipants,
              iconName: "csui_action_download32"
            }
          ],
          third: [
            {
              signature: "ShowRoles",
              name: lang.CommandNameShowRoles
            },
            {
              signature: "RemoveParticipant",
              name: lang.CommandNameRemoveParticipant
            }
          ]
        })
  };

  return toolbarItems;

});
