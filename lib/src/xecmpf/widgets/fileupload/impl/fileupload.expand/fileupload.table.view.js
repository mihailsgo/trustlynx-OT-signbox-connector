/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module', 'csui/lib/jquery', 'csui/lib/underscore',
    'csui/utils/accessibility',
    'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
    'csui/widgets/nodestable/nodestable.view',
    'csui/controls/mixins/view.state/multi.node.fetch.mixin',
    'xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.toolbaritems',
    'xecmpf/widgets/fileupload/impl/factory/fileupload.column.factory',
    'xecmpf/widgets/fileupload/impl/factory/fileupload.collection.factory',
    'xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.columns',    
    'xecmpf/controls/table/cells/statusicon.view',
    'xecmpf/controls/table/cells/location.cell.view',
	'i18n!xecmpf/widgets/fileupload/impl/nls/lang',
    'css!xecmpf/widgets/fileupload/impl/fileupload'
], function (module, $, _, Accessibility, LayoutViewEventsPropagationMixin,
    NodesTable, MultiNodeFetchMixin, toolbarItems, FileUploadColumnFactory,
    FileUploadCollectionFactory, 
    FileUploadTableColumns, 
    lang) {

    'use strict';

    var accessibleTable = Accessibility.isAccessibleTable();

    var FileUploadTableView = NodesTable.extend({
        constructor: function FileUploadTableView(options) {
            _.defaults(options, {
                toolbarItems: toolbarItems
              });
            NodesTable.prototype.constructor.apply(this, arguments);

            this.propagateEventsToRegions();
        },

        template: _.template(""),

        initialize: function () {
            this.columns = this.context.getCollection(FileUploadColumnFactory);
            this.collection = this.context.getCollection(FileUploadCollectionFactory);
            _.defaults(this.options, {
                orderBy: 'classification_name asc',
                tableColumns: FileUploadTableColumns,
                urlParamsList: []
            });

            this.initSelectionMixin(this.options, this.collection);

            this.setTableView({
                nameEdit: false,
                selectRows: "none",
                selectColumn: false,
                orderBy: this.options.orderBy,
                haveDetailsRowExpandCollapseColumn: true,
                tableColumns: this.options.tableColumns,
                tableTexts: {
                    zeroRecords: lang.noDataToDisplay
                }
            });
            this.addTableViewSelectionEvents(this.tableView);

            this.setPagination();

            if (this.options.collection) {
                this.collection.fetched = false;
            }
        },

        _resetSortOrderBy: function () {
        },

        getDefaultUrlParameters: function () {
            return [];
        }

    });

    _.extend(FileUploadTableView.prototype, LayoutViewEventsPropagationMixin);
    _.extend(FileUploadTableView.prototype, MultiNodeFetchMixin);

    return FileUploadTableView;
});