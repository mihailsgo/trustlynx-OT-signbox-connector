/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["./test.permissions.lang.js"
], function (lang) {
    'use strict';
    return {
        inlineToolbar: [
            {
                signature: "AddOrEditRole",
                name: lang.CommandNameEditRole,
                iconName: "csui_action_view_column32"
            },
            {
                signature: "DeleteRole",
                name: lang.DeleteRoleTitleSingle,
                iconName: "csui_action_delete32"
            },
            {
                signature: "EditRolePermission",
                name: lang.ToolbarItemEditRolePermission,
                iconName: "csui_action_edit32"
            }
        ]
    };
});