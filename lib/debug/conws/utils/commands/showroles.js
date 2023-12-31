csui.define([
    'csui/lib/underscore',
    'csui/models/command',
    'i18n!conws/utils/commands/nls/commands.lang'
], function (_, CommandModel, lang) {

    var ShowRolesCommand = CommandModel.extend({

        defaults:{
            signature: 'ShowRoles',
            name: lang.CommandNameShowRoles,
            scope: 'single'
        },

        enabled: function(status){
            if (status && status.nodes && status.nodes.length === 1){
                return true;
            } else{
                return false;
            }
        },

        execute: function (status, options) {
            throw new Error('The \'' + this.get('signature') + '\' action must be handled by the caller.');
        }
    });

    return ShowRolesCommand;
});


