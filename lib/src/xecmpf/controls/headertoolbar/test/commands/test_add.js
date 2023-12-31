/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/models/command'
], function (CommandModel) {

    var AddCommand = CommandModel.extend({

        defaults: {
            signature: 'test_add',
            name: "Add",
            scope: 'multiple',
            doneVerb: "created"
        },

        enabled: function (status) {
            return true;
        },

        execute: function (status, options) {
            alert("Add Command is executing..");
        }
    });

    return AddCommand;
});