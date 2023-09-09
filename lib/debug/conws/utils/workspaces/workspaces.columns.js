csui.define(['csui/lib/backbone'], function (Backbone) {

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

  // sequence:
  // 1-100: Fixed columns
  // 500-600: Dynamic columns (custom columns in widget configuration)
  // 900-1000: Special columns at the end (favorite, like, comment)
  // Hint: if the sequence of 'name' column is changed, the focused column in workspacestable.view
  // should be also adapted with the new id.
  // Current state is tableView.accFocusedState.body.column = 1

  var tableColumns = new TableColumnCollection([
    {
      key: 'type',
      sequence: 10
    },
    {
      key: 'name',
      sequence: 20
    },
    {
      key: 'size',
      sequence: 30
    },
    {
      key: 'modify_date',
      sequence: 40
    },
    {
      key: 'favorite',
      sequence: 910,
      noTitleInHeader: true, // don't display a column header
      permanentColumn: true // don't wrap column due to responsiveness into details row
    }
  ]);

  return tableColumns;

});
