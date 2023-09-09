csui.define([
  'csui/lib/underscore',
  'csui/models/command',
  'conws/widgets/team/impl/dialogs/modaldialog/modal.dialog.view',
  'conws/widgets/team/impl/dialogs/addparticipants/addparticipants.view',
  'i18n!conws/utils/commands/nls/commands.lang',
  'i18n!conws/widgets/team/impl/nls/team.lang'
], function (_, CommandModel, ModalDialogView, AddParticipantsView, lang, teamlang) {

  var AddParticipantCommand = CommandModel.extend({

    defaults: {
      signature: 'AddParticipant',
      name: lang.CommandNameAddParticipant,
      scope: 'multiple'
    },

    constructor: function (options) {
      // initialize options
      options || (options = {});
      this.roles = options.roles;
      // apply arguments to parent
      CommandModel.prototype.constructor.apply(this, arguments);
    },

    enabled: function (status) {
      // initialize false
      var ret = false;
      // evaluate if at least one role has the edit permission
      if (this.roles) {
        var editable = this.roles.filter(function (role) {
          return (role.get('actions').actionEdit && _.isNull(role.get('inherited_from_id')));
        });
        ret = (editable.length !== 0)
      }
      // return
      return ret;
    },

    execute: function (status, options) {
      // show the add participants view in the modal dialog
      var dialog = new ModalDialogView({
        dialogTxtAria: teamlang.addParticipantsTitle,
        body: new AddParticipantsView({
          view: status.originatingView
        }),
        modalClassName: 'conws-addparticipants'
      });
      dialog.show();
    }
  });

  return AddParticipantCommand;
});



