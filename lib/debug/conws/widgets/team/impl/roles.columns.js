csui.define([
    'csui/lib/backbone'
], function (Backbone) {

    var RolesTableColumnModel = Backbone.Model.extend({

        idAttribute: 'key',

        defaults: {
            key: null,  // key from the resource definitions
            sequence: 0 // smaller number moves the column to the front
        }
    });

    var RolesTableColumnCollection = Backbone.Collection.extend({

        columnNames: {
            avatar: 'conws_roleavatar',
            name: 'conws_rolename',
            members: 'conws_rolemembers'
        },

        model: RolesTableColumnModel,
        comparator: 'sequence',

        getColumnKeys: function () {
            return this.pluck('key');
        },

        deepClone: function () {
            return new RolesTableColumnCollection(
                this.map(function (column) {
                    return column.attributes;
                }));
        }
    });

    // Fixed (system) columns have sequence number < 100, dynamic columns
    // have sequence number > 1000

    var tableColumns = new RolesTableColumnCollection([
        {
            key: RolesTableColumnCollection.prototype.columnNames.avatar,
            sequence: 10
        },
        {
            key: RolesTableColumnCollection.prototype.columnNames.name,
            sequence: 20
        },
        {
            key: RolesTableColumnCollection.prototype.columnNames.members,
            sequence: 30
        }
    ]);

    return tableColumns;

});

