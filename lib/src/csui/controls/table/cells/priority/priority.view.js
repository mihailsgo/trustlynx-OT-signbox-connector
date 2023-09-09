/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'csui/utils/accessibility', // Accessibility
  'i18n!csui/controls/table/cells/priority/impl/nls/lang',
  'hbs!csui/controls/table/cells/priority/impl/priority',
  'css!csui/controls/table/cells/priority/impl/priority'
], function (TemplatedCellView, cellViewRegistry, Accessibility, lang, template) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();

  var PriorityCellView = TemplatedCellView.extend({
      template: template,
      needsAriaLabel: true,

      getValueData: function () {
        var priorityObj = this._getPriorityObject();
        return {
          priority: priorityObj.priority,
          priority_name: priorityObj.priority_name,
          priority_high: priorityObj.priority_high,
          priority_medium: priorityObj.priority_medium,
          priority_low: priorityObj.priority_low
        };
      },
      getValueText: function () {
        return this._getPriorityObject().priority_name;
      },

      _getPriorityObject: function () {
        var priorityObj = {};
        priorityObj.priority = this.model.get(this.options.column.name);
        var priority_name_clientside;
        var priority_name_from_server = this.model.get(this.options.column.name + "_name");
        priorityObj.priority_high = false;
        priorityObj.priority_medium = false;
        priorityObj.priority_low = false;
        if (priorityObj.priority === null) {
          priority_name_clientside = '';
          if(accessibleTable){
            priority_name_clientside = lang.priority_no_value;
          }
        }else if (priorityObj.priority > 50) {
          priorityObj.priority_high = true;
          priority_name_clientside = lang.priority_name_high;
        } else if (priorityObj.priority === 50) {
          priorityObj.priority_medium = true;
          priority_name_clientside = lang.priority_name_medium;
        } else if (priorityObj.priority < 50) {
          priorityObj.priority_low = true;
          priority_name_clientside = lang.priority_name_low;
        }
        priorityObj.priority_name = priority_name_clientside || priority_name_from_server;

        return priorityObj;
      }
    },
    {
      hasFixedWidth: true,
      columnClassName: 'csui-table-cell-priority'
    }
  );

  cellViewRegistry.registerByColumnKey("priority", PriorityCellView);

  return PriorityCellView;
});
