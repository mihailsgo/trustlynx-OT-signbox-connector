/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/browsable/client-side.mixin',
  'csui/models/browsable/v1.request.mixin',
  'xecmpf/models/workflows/server.adaptor.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model'
], function (_, $, Backbone, ConnectableMixin, FetchableMixin, ClientSideBrowsableMixin,
    BrowsableV1RequestMixin, ServerAdaptorMixin, NodeChildrenColumnModel,
    NodeChildrenColumnCollection, NodeModel) {

  var workflow = {
    WorkflowTitle: 'WorkflowTitle',
    WorkflowStatusName: 'workflowStatusName',
    ModifiedByName: 'ModifiedByName',
    InitiatedDate: 'InitiatedDate',
    InitiatedByName: 'InitiatedByName',
    dateType: -7
  };

  var WorkflowColumnModel = NodeChildrenColumnModel.extend({

    constructor: function WorkflowColumnModel(attributes, options) {
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }
  });

  var WorkflowColumnCollection = NodeChildrenColumnCollection.extend({

    model: WorkflowColumnModel,

    resetColumnsV2: function (response, options) {
      if (!this.models.length) {// Stopping reset as event data is static and doesn't change after first fetch
        this.resetCollection(this.getV2Columns(response), options);
      }
    },

    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
          this, columnKeys, definitions);
      _.each(columns, function (column) {
        var columnKey = column['column_key'];
        column.sort = true;

        if (columnKey === 'WorkflowTitle') {
          column.default_action = true;
        }
      });
      return columns;
    },

    getV2Columns: function (response) {

      var definitions  = {},
          workflowKeys = Object.keys(workflow);
      _.each(workflowKeys, function (column) {
        definitions[column] = {};
        definitions[column].key = workflow[column];
      });

      definitions.InitiatedDate.type = workflow.dateType;

      var columnKeys = _.keys(definitions);
      return this.getColumnModels(columnKeys, definitions);
    }

  });

  var WorkflowModel = NodeModel.extend({});

  var WorkflowCollection = Backbone.Collection.extend({

    model: WorkflowModel,

    constructor: function WorkflowCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeBrowsable(options)
          .makeBrowsableV1Request(options)
          .makeServerAdaptor(options);

      this.columns = new WorkflowColumnCollection();
    }

  });

  ConnectableMixin.mixin(WorkflowCollection.prototype);
  FetchableMixin.mixin(WorkflowCollection.prototype);
  ClientSideBrowsableMixin.mixin(WorkflowCollection.prototype);
  BrowsableV1RequestMixin.mixin(WorkflowCollection.prototype);
  ServerAdaptorMixin.mixin(WorkflowCollection.prototype);

  return WorkflowCollection;

});