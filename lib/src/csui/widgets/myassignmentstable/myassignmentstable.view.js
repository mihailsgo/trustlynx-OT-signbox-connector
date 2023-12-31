/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone",
  "csui/lib/marionette", "csui/utils/log", "csui/utils/accessibility",
  'csui/utils/contexts/factories/myassignmentscolumns',
  'csui/utils/contexts/factories/myassignments',
  'csui/controls/table/rows/description/description.view',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/widgets/myassignments/myassignments.columns',
  'csui/widgets/nodestable/nodestable.view',
  'csui/controls/perspective.header/perspective.header.view',
  'csui/controls/mixins/view.state/multi.node.fetch.mixin',
  'csui/controls/mixins/view.state/node.selection.restore.mixin',
  'hbs!csui/widgets/myassignmentstable/impl/myassignmentstable',
  'i18n!csui/widgets/myassignmentstable/impl/nls/lang',
  'css!csui/widgets/myassignmentstable/impl/myassignmentstable'
], function (module, $, _, Backbone, Marionette, log, Accessibility,
    MyAssignmentsColumnCollectionFactory, MyAssignmentsCollectionFactory,
    DescriptionRowView, LayoutViewEventsPropagationMixin,
    myAssignmentsTableColumns, NodesTable, PerspectiveHeaderView,
    MultiNodeFetchMixin, NodeSelectionRestoreMixin, template, lang) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();

  var MyAssignmentsTableView = NodesTable.extend({

    template: template,

    className: 'csui-my-assignments-table-view',

    regions: {
      tableRegion: '#tableviewMA',
      paginationRegion: '#paginationviewMA',
      headerRegion: '.csui-perspective-toolbar'
    },

    constructor: function MyAssignmentsTableView(options) {
      options.enableViewState = false;
      options.tableAria = lang.tableAria;
      NodesTable.prototype.constructor.apply(this, arguments);

      this.propagateEventsToRegions();
    },

    initialize: function () {
      this.collection = this.options.collection;
      if (!this.collection) {
        var collectionState = this._restoreCollectionOptionsFromViewState();
        this.collection = this.context.getCollection(MyAssignmentsCollectionFactory, {
          options: collectionState
        });
        if (!!collectionState.orderBy) {
          this.options.orderBy = collectionState.orderBy;
        }
      }
      this.columns = this.collection.columns ||
                     this.context.getCollection(MyAssignmentsColumnCollectionFactory);

      this.collection.setExpand('assignments',
          ['from_user_id', 'location_id', 'workflow_id',
            'workflow_subworkflow_id', 'workflow_subworkflow_task_id']
      );

      _.defaults(this.options, {
        orderBy: 'date_due asc',
        tableColumns: myAssignmentsTableColumns,
        urlParamsList: []
      });

      if (!this.options.isExpandedView) {
        this._setPerspectiveHeaderView();
      }

      this.initSelectionMixin(this.options, this.collection);

      this.setTableView({
        nameEdit: false,
        descriptionRowView: DescriptionRowView,
        descriptionRowViewOptions: {
          firstColumnIndex: 1, lastColumnIndex: 2,
          showDescriptions: !accessibleTable,
          collapsedHeightIsOneLine: false
        },
        selectRows: "none",
        selectColumn: false,
        haveDetailsRowExpandCollapseColumn: false,
        columnsWithSearch: ["name","location_id"],
        tableColumns: this.options.tableColumns,
        tableTexts: {
          zeroRecords: lang.emptyListText
        },
        inlineBar: {
          options: {}
        }
      });
      this.addTableViewSelectionEvents(this.tableView);

      this.setPagination();

      if (this.options.collection) {
        this.collection.fetched = false;
      }

    },

    _setPerspectiveHeaderView: function () {
      this.perspectiveHeaderView = new PerspectiveHeaderView({
        title: lang.dialogTitle,
        icon: 'title-assignments',
        context: this.context
      });
    },

    _resetSortOrderBy: function () {
    },

    onRender: function () {
      this.perspectiveHeaderView && this.headerRegion.show(this.perspectiveHeaderView);
      this.tableRegion.show(this.tableView);
      this.paginationRegion.show(this.paginationView);
    },

    getDefaultUrlParameters: function () {
      return [];
    }
  });

  _.extend(MyAssignmentsTableView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(MyAssignmentsTableView.prototype, NodeSelectionRestoreMixin);

  return MyAssignmentsTableView;

});
