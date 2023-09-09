csui.define([
    'csui/controls/form/fields/base/csformfield.states.behavior'
], function (FormFieldStatesBehavior) {

    var ReferenceFieldStatesBehavior = FormFieldStatesBehavior.extend({

        constructor: function ReferenceFieldStatesBehavior(options, view) {
            FormFieldStatesBehavior.apply(this, arguments);

        },

        // Reference Field is Readonly field
        isReadOnly: function () {
            return true;
        }

    });

    return ReferenceFieldStatesBehavior;

});
