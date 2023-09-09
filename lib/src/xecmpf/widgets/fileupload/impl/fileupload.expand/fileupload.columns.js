/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/backbone',
    'i18n!xecmpf/widgets/fileupload/impl/nls/lang',
], function (Backbone, lang) {

    var TableColumnModel = Backbone.Model.extend({

        idAttribute: 'key',

        defaults: {
            key: null,  // key from the resource definitions
            sequence: 0 // smaller number moves the column to the front
        }

    });

    var TableColumnCollection = Backbone.Collection.extend({

        model: TableColumnModel,

        comparator: 'sequence',

        getColumnKeys: function () {
            return this.pluck('key');
        },

        deepClone: function () {
            return new TableColumnCollection(
                this.map(function (column) {
                    return column.attributes;
                }));
        }
    });

    var tableColumns = new TableColumnCollection([
        {
            key: 'classification_name',
            title: lang.documentType,
            sequence: 10,
            position: 'absolute',
            widthFactor: 0.7
        },
        {
            key: 'label',
            align: 'left',
            title: lang.status,
            sequence: 30,
            widthFactor: 0.7
        },
        {
            key: 'name',
            align: 'left',
            title: lang.documentName,
            sequence: 40,
            widthFactor: 0.7
        },
        {
            key: 'location_name',
            align: 'left',
            title: lang.locations,
            sequence: 50,
            widthFactor: 0.7
        }

    ]);

    return tableColumns;

});