/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/backbone", "i18n!csui/models/impl/nls/lang"], function (Backbone, lang) {

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

  var SearchResultsTableColumns = new TableColumnCollection([
    {
      key: 'OTMIMEType',
      titleIconInHeader: 'mime_type',
      sequence: 10
    },
    {
      key: 'OTName',
      sequence: 20,
      isNaming: true
    },
    {
      key: 'version_id',
      column_key: 'version_id',
      title: lang.version,
      noTitleInHeader: true,
      permanentColumn: true,
      sequence: 25
    },
    {
      key: 'reserved',
      sequence: 30,
      noTitleInHeader: true // don't display a column header
    },
    {
      key: 'parent_id',
      sequence: 60
    },
    {
      key: 'access_date_last',
      sequence: 70
    },
    {
      key: 'size',
      sequence: 40
    },
    {
      key: 'modify_date',
      sequence: 50
    },
    {
      key: 'favorite',
      sequence: 910,
      noTitleInHeader: true, // don't display a column header
      permanentColumn: true // don't wrap column due to responsiveness into details row
    }
  ]);

  return SearchResultsTableColumns;

});
