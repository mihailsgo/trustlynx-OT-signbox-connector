csui.define([
  'csui/lib/underscore',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/models/command',
  'i18n!conws/utils/commands/nls/commands.lang'
], function (_, ModalAlert, CommandModel, lang) {

  var RemoveParticipantCommand = CommandModel.extend({

    defaults: {
      signature: 'RemoveParticipant',
      name: lang.CommandNameRemoveParticipant,
      scope: 'multiple'
    },

    enabled: function (status) {
      if (status && status.nodes && status.nodes.length > 0) {
        var allowed = true;
        _.each(status.nodes.models, function (participant) {
          if (!participant.canRemove()) {
            allowed = false;
          }
        });
        return allowed;
      } else {
        return false;
      }
    },

    execute: function (status, options) {

      // format confirmation dialog title ...
      var title = (status.nodes.length === 1)
          ? lang.RemoveParticipantTitleSingle
          : lang.RemoveParticipantTitleMultiple;
      // ... and message
      var message = lang.RemoveParticipantMessage;

      // confirm and remove
      var self = this;
      ModalAlert.confirmQuestion(message, title)
          .always(function (answer) {
            if (answer) {
              var count = status.nodes.length;
              var error = false;
              _.each(status.nodes.models, function (participant) {
                participant.save({
                  add: [],
                  remove: participant.roles.models
                }, {
                  success: function (response) {
                    // update collections when all participants are removed
                    if ((--count) === 0) {
                      self._refresh(status, error);
                    }
                  },
                  error: function (response) {
                    // update collections when all participants are removed
                    error = true;
                    if ((--count) === 0) {
                      self._refresh(status, error);
                    }
                  }
                });
              });
            }
          });
    },

    _refresh: function (status, error) {
      // notify on error
      if (error === true) {
        ModalAlert.showError(lang.RemoveParticipantErrorMessageDefault);
      }
      // refresh both collections
      status.originatingView.roleCollection.fetch();
      status.originatingView.participantCollection.fetch({
        success: function () {
          status.originatingView.participantCollection.setNewParticipant();

          // trigger as custom event to signal the save of the collection
          status.originatingView.participantCollection.trigger('saved', status.originatingView.participantCollection);
        }
      });
    }
  });

  return RemoveParticipantCommand;
});



