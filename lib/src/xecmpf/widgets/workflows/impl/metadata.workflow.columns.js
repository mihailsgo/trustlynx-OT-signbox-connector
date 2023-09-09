/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/backbone", "i18n!xecmpf/widgets/workflows/nls/workflows.lang"],
    function (Backbone, lang) {

      var workflowTableColumnModel = Backbone.Model.extend({

        idAttribute: "key",

        defaults: {
          key: null,  // key from the resource metadata
          sequence: 0 // smaller number moves the column to the front
        }

      });

      var workflowTableColumnCollection = Backbone.Collection.extend({

        model: workflowTableColumnModel,
        comparator: "sequence",

        getColumnKeys: function () {
          return this.pluck('key');
        },

        deepClone: function () {
          return new workflowTableColumnCollection(
              this.map(function (column) {
                return column.attributes;
              }));
        }
      });

      var tableColumns = new workflowTableColumnCollection([

        {
          key: 'WorkflowTitle',
          title: lang.workflowTitle,
          isNaming: true,
          widthFactor: 3,
          sequence: 10
        },
        {
          key: 'WorkflowStatusName',
          title: lang.workflowStatus,
          sequence: 20
        },
        {
          key: 'ModifiedByName',
          title: lang.lastModified,
          sequence: 30
        },
        {
          key: 'InitiatedDate',
          title: lang.initiatedDate,
          sequence: 40
        },
        {
          key: 'InitiatedByName',
          title: lang.initiatedBy,
          sequence: 50
        }
      ]);

      return tableColumns;

    });
