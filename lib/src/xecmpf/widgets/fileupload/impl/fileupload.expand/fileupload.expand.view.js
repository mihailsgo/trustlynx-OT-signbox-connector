/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/marionette',
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
    'csui/utils/accessibility',
    'csui/behaviors/default.action/default.action.behavior',
    'csui/utils/contexts/factories/node',
    'xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.header.view',
    'xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.filter.view',
    'xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.table.view',
    'xecmpf/widgets/fileupload/impl/factory/fileupload.collection.factory',
    'hbs!xecmpf/widgets/fileupload/impl/fileupload.expand/fileupload.expand',
    'i18n!xecmpf/widgets/fileupload/impl/nls/lang',
    'css!xecmpf/widgets/fileupload/impl/fileupload'
], function (Marionette, _, $, LayoutViewEventsPropagationMixin, Accessibility,
    DefaultActionBehavior, NodeModelFactory, FileUploadHeaderView, FileUploadFilterView, FileUploadTableView, FileUploadCollectionFactory, template, lang) {
    'use strict';
    var accessibleTable = Accessibility.isAccessibleTable();

    var FileUploadExpandedView = Marionette.LayoutView.extend({
        className: 'csui-nodestable xecmpf-fileupload-expanded-view',

        template: template,

        regions: {
            headerRegion: '.csui-perspective-toolbar',
            filterRegion: '.csui-table-facetview',
            tableRegion: '.xecmpf-fileupload-table-view',
            paginationRegion: '#paginationviewMA'
        },

        behaviors: {
            DefaultAction: {
                behaviorClass: DefaultActionBehavior
            }
        },

        ui: {
            sidePanel: '.csui-side-panel',
            filterView: '.csui-table-facetview',
            paginationView: '.csui-table-paginationview'
        },

        events: {
            'click .fileupload-filter-icon': 'onClickFilter',
            'click .fileupload-add-icon': 'onClickAddItem',
            'click .xecmpf-fileupload-table-view tbody tr': 'onClickItem',
            'click .cs-go-back' : 'onClickBackButton',
            'keyup .xecmpf-fileupload-table-view tbody tr': 'onKeyInView'
        },

        constructor: function FileUploadExpandedView(options) {
            this.options = options;
            this.showFilter = false;
            options.node = options.context.getModel(NodeModelFactory, {
              'node': {
                'attributes': {
                  'id': this.options.context.wsid
                }
              }
            });
            this.completeCollection = this.options.context.getCollection(FileUploadCollectionFactory);
            this.context = this.options.context;
            Marionette.LayoutView.prototype.constructor.apply(this, arguments);
            this.propagateEventsToRegions();
            
        },

        initialize: function () {
            this._setPerspectiveHeaderView();
            this.fileuploadTableView = new FileUploadTableView({
                context: this.options.context,
                collection: this.completeCollection,
                extendedView: this
            });
            this.filterView = new FileUploadFilterView({
                context: this.options.context,
                collection: this.completeCollection,
                extendedView: this
            });
        },

        onRender: function () {
            this.fileuploadHeaderView && this.headerRegion.show(this.fileuploadHeaderView);
            this.tableRegion.show(this.fileuploadTableView.tableView);
            this.filterRegion.show(this.filterView);
            this.paginationRegion.show(this.fileuploadTableView.paginationView);
        },
        _setPerspectiveHeaderView: function () {
            this.fileuploadHeaderView = new FileUploadHeaderView({
                title: lang.dialogTitle,
                icon: 'title-icon xecmpf-fileupload-title-icon',
                context: this.options.context,
                connector: this.completeCollection.connector,
                node: this.options.node,
                extendedView: this
            });
        },
        onClickFilter: function () {
            this.showFilter = !this.showFilter;
            this._ensureFilterPanelViewDisplayed();
            if (this.showFilter) {
                this._showFilterPanelView();
                this.ui.sidePanel.removeClass('csui-sidepanel-hidden');
            } else {
                this._hideFilterPanelView();
                this.ui.sidePanel.addClass('csui-sidepanel-hidden');
            }
        },
        onClickBackButton: function () {
            var context = this.options.context,
            viewStateModel = context && context.viewStateModel;
            if (viewStateModel) {
                viewStateModel.restoreLastRouter();
            }
        },
        _showFilterPanelView: function () {
            this.showFilter = true;
            this.ui.sidePanel.removeClass('csui-sidepanel-hidden');
            this.ui.filterView.removeClass('csui-facetview-visibility');
            $(this.fileuploadHeaderView.el).find(".cs-filter-icon-container").attr("title", lang.hideFilterTitle);
            $(this.fileuploadHeaderView.el).find(".cs-filter-icon-container").attr("aria-label", lang.hideFilterTitle);
            if (accessibleTable) {
                this.ui.filterView.removeClass('csui-facetview-hidden');
                this.triggerMethod('dom:refresh');
            } else {
                this.ui.filterView.one(this._transitionEnd(),
                    function () {
                        this.triggerMethod('dom:refresh');
                    }.bind(this)).removeClass('csui-facetview-hidden');
            }
            this.listenTo(this.filterView, 'dom:refresh', _.bind(function () {
                $(window).trigger('resize.facetview');
            }, this));
        },
        _hideFilterPanelView: function () {
            this.showFilter = false;
            if (accessibleTable) {
                this.ui.filterView.addClass('csui-facetview-hidden');
                this.triggerMethod('dom:refresh');
                this.ui.filterView.hasClass('csui-facetview-hidden') &&
                    this.ui.filterView.addClass('csui-facetview-visibility');
                this._removeFilterPanelView();
            } else {
                this.ui.filterView.one(this._transitionEnd(),
                    function () {
                        this._removeFilterPanelView();
                        this.triggerMethod('dom:refresh');
                        this.ui.filterView.hasClass('csui-facetview-hidden') &&
                            this.ui.filterView.addClass('csui-facetview-visibility');
                    }.bind(this)).addClass('csui-facetview-hidden');
            }
            $(this.fileuploadHeaderView.el).find(".cs-filter-icon-container").attr("title", lang.showFilterTitle);
            $(this.fileuploadHeaderView.el).find(".cs-filter-icon-container").attr("aria-label", lang.showFilterTitle);

            this.listenTo(this.filterView, 'dom:refresh', _.bind(function () {
                $(window).trigger('resize.facetview');
            }, this));
        },
        _setFilterPanelView: function () {
            this.filterView = new FileUploadFilterView({
                context: this.options.context,
                extendedView: this
            });
            this.listenTo(this.filterView, 'remove:filter', this._removeFacetFilter)
                .listenTo(this.filterView, 'remove:all', this._removeAll)
                .listenTo(this.filterView, 'apply:filter', this._checkSelectionAndApplyFilter)
                .listenTo(this.filterView, 'apply:all', this._setFacetFilter);
        },
        _removeFilterPanelView: function () {
            !!this.thumbnailViewState ? this.thumbnail._adjustThumbnailWidth() : '';
            this.filterRegion.empty();
            this.filterView = undefined;
        },

        _transitionEnd: _.once(
            function () {
                var transitions = {
                    transition: 'transitionend',
                    WebkitTransition: 'webkitTransitionEnd',
                    MozTransition: 'transitionend',
                    OTransition: 'oTransitionEnd otransitionend'
                },
                    element = document.createElement('div'),
                    transition;
                for (transition in transitions) {
                    if (typeof element.style[transition] !== 'undefined') {
                        return transitions[transition];
                    }
                }
            }
        ),

        onClickItem: function (e) {
            var requestModel, currentRowEl = $(e.target).closest('tr'),
                index = $(currentRowEl).index();
            requestModel = this.completeCollection.models[index];
            requestModel.connector = this.completeCollection.connector;
            var targetEle = this.$el.find('.highlight-item');
            if (targetEle.length > 0) {
                for (var i = 0; i < targetEle.length; i++) {
                    $(targetEle[i]).removeClass('highlight-item');
                }
            }
            $(currentRowEl).addClass('highlight-item');

        },

        onKeyInView: function (event) {
            if (event.keyCode === 13 || event.keyCode === 32) {
                this.onClickItem(event);
            }
        },

    });

    _.extend(FileUploadExpandedView.prototype, LayoutViewEventsPropagationMixin);
    return FileUploadExpandedView;
});