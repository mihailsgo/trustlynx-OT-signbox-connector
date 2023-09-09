csui.define([
  'csui/models/commands',
  'csui/utils/commands',
  'conws/utils/workspaces/close.expanded.view'
], function (
    CommandCollection,
    commands,
    CloseExpandedViewCommand) {

    /**
     * Append close command to standard commands list, to have it in the related items view only.
     */
    var relatedWorkspacesCommands = new CommandCollection([
      new CloseExpandedViewCommand()
    ].concat(commands.models));

  return relatedWorkspacesCommands;
});
