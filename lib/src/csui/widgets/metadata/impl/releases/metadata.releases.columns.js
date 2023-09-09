/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/backbone", 'i18n!csui/widgets/metadata/impl/nls/lang'],
  function (Backbone, lang) {

    var TableColumnModel = Backbone.Model.extend({

      idAttribute: "key",

      defaults: {
        key: null,  // key from the resource definitions
        sequence: 0 // smaller number moves the column to the front
      }
    });

    var TableColumnCollection = Backbone.Collection.extend({

      model: TableColumnModel,
      comparator: "sequence",

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
        key: 'type',
        titleIconInHeader: 'mime_type',
        permanentColumn: true,
        sequence: 10
      },
      {
        key: 'name',
        sequence: 20
      },
      {
        key: 'reserved',
        title: 'State',
        sequence: 30,
        noTitleInHeader: true // don't display a column header
      },
      {
        key: 'release_value',
        title: lang.release,
        sequence: 40
      },
      {
        key: 'created',
        title: lang.created,
        sequence: 50
      },
      {
        key: 'createdBy',
        title: lang.createdBy,
        sequence: 60
      },
      {
        key: 'favorite',
        column_key: 'favorite',
        sequence: 70,
        title: lang.favorite,
        noTitleInHeader: true,
        permanentColumn: true
      }
    ]);

    return tableColumns;

  });
