/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/controls/table/cells/cell/cell.view',
  'csui/controls/table/cells/cell.registry',
  'csui/controls/table/table.columns',
  'i18n!greet/controls/cells/hello/impl/nls/lang'
], function (CellView, cellViewRegistry, tableColumns, lang) {
  var HelloCellView = CellView.extend({

    getValueText: function () {
      var mimeType = this.model.get('mime_type');
      return lang[mimeType] || mimeType || '';
    }

  });
  cellViewRegistry.registerByColumnKey('mime_type', HelloCellView);
  tableColumns.add({
    key: 'mime_type',
    sequence: 600
  });

  return HelloCellView;

});
