csui.define([
    'csui/lib/backbone'
], function (Backbone) {

    var ParticipantsTableColumnModel = Backbone.Model.extend({

        idAttribute: 'key',

        defaults: {
            key: null,  // key from the resource definitions
            sequence: 0 // smaller number moves the column to the front
        }
    });

    var ParticipantsTableColumnCollection = Backbone.Collection.extend({

        columnNames: {
            avatar: 'conws_participantavatar',
            name: 'conws_participantname',
            roles: 'conws_participantroles',
            login: 'conws_participantlogin',
            email: 'conws_participantemail',
            department: 'conws_participantdepartment'
        },

        model: ParticipantsTableColumnModel,
        comparator: 'sequence',

        getColumnKeys: function () {
            return this.pluck('key');
        },

        deepClone: function () {
            return new ParticipantsTableColumnCollection(
                this.map(function (column) {
                    return column.attributes;
                }));
        }
    });

    // Fixed (system) columns have sequence number < 100, dynamic columns
    // have sequence number > 1000

    var tableColumns = new ParticipantsTableColumnCollection([
        {
            key: ParticipantsTableColumnCollection.prototype.columnNames.avatar,
            sequence: 10
        },
        {
            key: ParticipantsTableColumnCollection.prototype.columnNames.name,
            sequence: 20
        },
        {
            key: ParticipantsTableColumnCollection.prototype.columnNames.roles,
            sequence: 30
        },
        {
            key: ParticipantsTableColumnCollection.prototype.columnNames.login,
            sequence: 40
        },
        {
            key: ParticipantsTableColumnCollection.prototype.columnNames.email,
            sequence: 50
        },
        {
            key: ParticipantsTableColumnCollection.prototype.columnNames.department,
            sequence: 60
        }
    ]);

    return tableColumns;

});

