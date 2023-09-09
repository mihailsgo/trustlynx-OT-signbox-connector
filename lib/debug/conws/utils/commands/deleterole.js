csui.define([
  'csui/lib/underscore',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/models/command',
  'i18n!conws/utils/commands/nls/commands.lang'
], function (_, ModalAlert, CommandModel, lang) {

  var DeleteRoleCommand = CommandModel.extend({

    defaults: {
      signature: 'DeleteRoles',
      name: lang.CommandNameDeleteRole,
      scope: 'multiple'
    },

    enabled: function (status) {
      if (status && status.nodes && status.nodes.length > 0) {
        // if at least one role doesn't allow deletion, disable the action
        var allowed = true;
        _.each(status.nodes.models, function (role) {
          // is the user allowed to delete the role
          if (!role.canDelete()) {
            allowed = false;
          }
          // the leader role can only be deleted in case it is the one and only role
          if ((role.get('leader') === true) && (role.collection.length > 1)) {
            allowed = false;
          }
        });
        return allowed;
      } else {
        return false;
      }
    },

    execute: function (status, options) {

      // get the unique memberships that would be removed from the workspace
      // if the roles they are member of are deleted.
      var count = this._evaluateMembersRemoved(status).length;

      // format confirmation dialog title ...
      var title = (status.nodes.length === 1)
          ? lang.DeleteRoleTitleSingle
          : lang.DeleteRoleTitleMultiple;
      // ... and message
      var message = lang.DeleteRoleMessageNoParticipantsAffected;
      if (count === 1) {
        message = lang.DeleteRoleMessageParticipantsAffectedSingle;
      } else if (count > 1) {
        message = lang.DeleteRoleMessageParticipantsAffectedMultiple.replace('{0}', count);
      }

      // confirm and delete
      var self = this;
      ModalAlert.confirmQuestion(message, title)
          .always(function (answer) {
            if (answer) {
              _.each(_.clone(status.nodes.models), function (model) {
                model.destroy({
                  wait: true,
                  success: function () {
                    if (status.nodes.length === 0) {
                      self._refreshCollections(status);
                    }
                  }
                });
              });
            }
          });
    },

    _evaluateMembersRemoved: function (status) {
      // get the collections
      var participants = status.originatingView.participantCollection;
      var roles = status.originatingView.roleCollection;

      // get all participants from the roles to be deleted
      var affectedParticipants = [];
      _.each(status.nodes.models, function (role) {
        role.members.each(function (member) {
          affectedParticipants.push(member.get('id'));
        });
      });
      affectedParticipants = _.uniq(affectedParticipants);

      // get all participants from the roles not to be deleted
      var unaffectedParticipants = [];
      _.each(roles.models, function (role) {
        if (status.nodes.findWhere({id: role.get('id')}) === undefined) {
          // role isn't to be deleted, therefore get members
          role.members.each(function (member) {
            unaffectedParticipants.push(member.get('id'));
          });
        }
      });
      unaffectedParticipants = _.uniq(unaffectedParticipants);

      // get the difference. the participants that are left
      // over, are removed from the team.
      var difference = _.difference(affectedParticipants, unaffectedParticipants);
      return difference;
    },

    _refreshCollections: function (status) {
      // refresh both collections
      status.originatingView.roleCollection.fetch({
           success: function() {
             // trigger as custom event to signal the save of the collection
             status.originatingView.participantCollection.trigger('saved', status.originatingView.participantCollection);
           }
          });

    }
  });

  return DeleteRoleCommand;
});



