csui.define([
    'csui/lib/jquery',
    'csui/lib/underscore',
    'csui/utils/commands/delete'
], function ($, _, DeleteCommand, lang) {
    // SAPRM-8700 Default DeleteCommand extended for related workspaces where
    // delete must be disabled
    var origEnabled = DeleteCommand.prototype.enabled;
    var DeleteCommandRelatedWorkspaceCheck = DeleteCommand.extend({
        enabled: function (status) {
            if (status.container === undefined ||
                status.container.get("type") !== 854) {
                return origEnabled.call(this, status);
            } else {
                return false;
            }
        }
    });
    DeleteCommand.prototype = DeleteCommandRelatedWorkspaceCheck.prototype;
    return DeleteCommand;
});