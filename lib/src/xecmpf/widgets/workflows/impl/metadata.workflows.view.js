/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/marionette',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/table/table.view', 'csui/utils/contexts/factories/connector',
  'xecmpf/models/workflows/metadata.workflow.collection',
  'xecmpf/utils/commands/workflows',
  'csui/utils/commandhelper',
  'csui/models/actionitems',
  'xecmpf/widgets/workflows/impl/metadata.workflow.columns',
  'csui/behaviors/default.action/default.action.behavior',
  'hbs!xecmpf/widgets/workflows/impl/metadata.workflows',
  'i18n!xecmpf/widgets/workflows/nls/workflows.lang',
  'css!xecmpf/widgets/workflows/impl/metadata.workflows'

], function (_, Marionette,
    LayoutViewEventsPropagationMixin,
    TableView,
    ConnectorFactory,
    workflowModelCollection,
    commands,
    CommandHelper,
    ActionItems,
    workflowColumns,
    DefaultActionBehavior,
    template,
    lang) {

  'use strict';

  var MetadataWorkflowsTableView = Marionette.LayoutView.extend({

    className: 'metadata-inner-wrapper',
    template: template,

    ui: {
      tableView: '#workflow-tableview',
      workflowName: '#workflow-tableview .binf-table tbody tr [data-csui-attribute="WorkflowTitle"]'
    },

    regions: {
      tableRegion: '#workflow-tableview'
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    constructor: function MetadataWorkflowsTableView(options) {
      options || (options = {});
      this.commands = commands;
      MetadataWorkflowsTableView.__super__.constructor.call(this, options);

      this.collection.fetch();
      this.propagateEventsToRegions();
    },

    initialize: function () {

      this.collection = new workflowModelCollection(undefined, {
        connector: this.options.context.getObject(ConnectorFactory),
        node: this.options.model,
        commands: commands.getAllSignatures(),
        autoreset: true,
        status: 'all'
      });

      this._setTableView();

    },

    onRender: function () {
      this.tableRegion.show(this.tableView);
    },

    _setTableView: function () {
      this.options || (this.options = {});
      var self = this,
        args = _.extend({

        connector: this.model.connector,
        tableColumns: workflowColumns,
        collection: this.collection,
        orderBy: "InitiatedDate desc",
        selectColumn: false,
        selectRows: false,
        actionItems: this.defaultActionItems,
        customLabels: {
          emptyTableText: lang.emptyTableText,
        },
        focusView: 'tableHeader',
        originatingView: this.options.originatingView,
        commands: commands
      }, this.options);

      this.tableView = new TableView(args);

      var cmdOption = {context: this.options.context, originatingView: this};

      if (this.tableView.collection && this.tableView.collection.length === 0 && this.collection.fetched) {
        this.tableView._showEmptyViewText = true;
      }

      this.listenTo(this.tableView, 'execute:defaultAction', function (node) {
        self.previousFocusElm = document.activeElement;
        var status  = {nodes: new workflowModelCollection([node])},
            command = commands.get('WorkflowOpen');
        var promise = command.execute(status, cmdOption);
        CommandHelper.handleExecutionResults(
            promise, {
              command: command,
              suppressSuccessMessage: "Error Eecuting command",
              suppressFailMessage: "Fecting commands data failed"
            });
      });

    },

  });
  _.extend(MetadataWorkflowsTableView.prototype, LayoutViewEventsPropagationMixin);

  return MetadataWorkflowsTableView;

});
