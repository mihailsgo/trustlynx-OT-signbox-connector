csui.define([
    'csui/lib/underscore',
    'csui/models/command',
    'i18n!conws/utils/commands/nls/commands.lang'
], function (_, CommandModel, lang) {

    var EmailCommand = CommandModel.extend({

        defaults:{
            signature: 'Email',
            name: lang.CommandNameEmail,
            scope: 'multiple',
            email: 'business_email'
        },

        enabled: function(status){
            if (status && status.nodes && status.nodes.length > 0){
                return true;
            } else{
                return false;
            }
        },

        execute: function(status, options) {
            if (status && status.nodes && status.nodes.length > 0){
                var self = this;
                // prepare recipients string
                var recipients = '';
                _.each(status.nodes, function(node, index){
                    recipients += node.get(self.get('email')) + ',';
                });
                recipients = recipients.substr(0, recipients.length-1);
                // format 'mailto' link
                window.location.href = 'mailto:' + recipients;
            }
        }
    });

    return EmailCommand;
});

