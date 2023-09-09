/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'hbs!xecmpf/controls/table/cells/impl/statusicon',
  'css!xecmpf/controls/table/cells/impl/statusicon'
], function (_, TemplatedCellView,
  cellViewRegistry, template) {
  'use strict';

  var TypeIconCellView = TemplatedCellView.extend({

    template: template,

    getValueData: function () {
      var statusIcon = this.model.get("icon"),
        statusLabel = this.model.get("label");
      return { 'statusLabel': statusLabel, 'statusIcon': statusIcon };
    }
  });

  cellViewRegistry.registerByColumnKey('label', TypeIconCellView);

  return TypeIconCellView;
});
