/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore',
    'csui/lib/marionette',
    'csui/utils/base',
    'csui/controls/list/list.view',
    'csui/controls/listitem/listitemstandard.view',
    'csui/controls/progressblocker/blocker',
    'webreports/widgets/nodeslistreport/impl/expanding.behavior',
    'csui/behaviors/default.action/default.action.behavior',
    'csui/behaviors/collection.state/collection.state.behavior',
    'csui/controls/list/list.state.view',
    'webreports/utils/contexts/factories/nodestablereport',
    'webreports/controls/nodestablereport/nodestablereport.view',
    'webreports/widgets/nodeslistreport/nodeslistreport.toolbaritems',
    'csui/utils/accessibility',
    'csui/controls/node-type.icon/node-type.icon.view',
    'webreports/mixins/webreports.view.mixin',
    'hbs!webreports/widgets/nodeslistreport/impl/nodeslistreport.contentview',
    'i18n!webreports/widgets/nodeslistreport/impl/nls/lang',
    'css!webreports/style/webreports.css'
], function (_,
    Marionette,
    base,
    ListView,
    StandardListItem,
    BlockingView,
    ServerExpandingBehavior,
    DefaultActionBehavior,
    CollectionStateBehavior,
    ListStateView,
    NodesTableReportChildrenCollectionFactory,
    NodesTableReportView,
    toolbarItems,
    Accessibility,
    NodeTypeIconView,
    WebReportsViewMixin,
    template,
    lang) {

    var accessibleTable = Accessibility.isAccessibleTable();

    var NodesListReportContentView = ListView.extend({

        constructor: function NodesListReportContentView(options) {
            options || (options = {});
            options.data || (options.data = {});
            options.data.titleBarIcon = (_.has(options.data, 'titleBarIcon') && options.data.titleBarIcon !== "") ? 'title-icon ' + options.data.titleBarIcon : 'title-icon title-webreports';
            options.data.header = false;

            options.toolbarItems = toolbarItems;

            var modelOptions = this.setCommonModelOptions(options),
                factory = this.getWidgetFactory(options, NodesTableReportChildrenCollectionFactory, modelOptions);

            this.setFactory(factory);

            this.collection = options.context.getCollection(NodesTableReportChildrenCollectionFactory, { attributes: modelOptions }) || this.options.collection;
            this.collection.setExpand('properties', ['parent_id', 'reserved_user_id']);

            BlockingView.imbue({
                parent: this
            });

            if (options.originatingView) {
                this.listenTo(options.originatingView, 'edit:prompt:clicked', this.searchFieldClearerClicked);
            }

            ListView.prototype.constructor.apply(this, arguments);

            this.listenTo(this.collection, "request", this.blockActions);
            this.listenTo(this.collection, "sync error", this.unblockActions);

            this.showInlineActionBar = !accessibleTable;

            this.contentViewOptions = options;
        },

        template: template,

        events: function () {
            return _.extend({}, ListView.prototype.events, {
                'click @ui.moreLink': 'onMoreLinkClick',
                'keyup @ui.searchBox': 'onSearchKeyUp',
                'keydown @ui.searchBox': 'onSearchKeyDown'
            });
        },

        triggers: {
            'click @ui.openPerspectiveButton': 'click:open:perspective'
        },

        ui: function () {
            return _.extend({}, ListView.prototype.ui, {
                'moreLink': '.cs-more.tile-expand'
            });
        },

        initialize: function () {

            this.listenTo(this.collection, 'reset', this.enableMoreLink);

            this.listenTo(this, 'change:filterValue', this.synchronizeCollections);

        },

        enableMoreLink: function () {
            var enable = !this.collection.isEmpty();
            this.ui.moreLink[enable ? 'removeClass' : 'addClass']('binf-hidden');
        },

        childEvents: {
            'click:item': 'onClickItem',
            'render': 'onRenderItem',
            'before:destroy': 'onBeforeDestroyItem'
        },

        templateHelpers: function () {
            return {
                title: base.getClosestLocalizedString(this.options.data.title, lang.dialogTitle),
                icon: this.options.data.titleBarIcon,
                searchPlaceholder: base.getClosestLocalizedString(this.options.data.searchPlaceholder, lang.searchPlaceholder),
                showParameterEditBtn: this.options.data.parameterPrompt === 'showPromptForm'
            };
        },

        childView: StandardListItem,

        childViewOptions: function () {
            var toolbarData = this.showInlineActionBar ? {
                toolbaritems: this.options.toolbarItems,
                collection: this.collection
            } : null;

            return {
                templateHelpers: function () {
                    return {
                        name: this.model.get('name'),
                        enableIcon: true,
                        showInlineActionBar: this.showInlineActionBar,
                        itemLabel: _.str.sformat(lang.dialogTitle, this.model.get('name'))
                    };

                },
                context: this.getOption("context"),
                checkDefaultAction: true,
                toolbarData: toolbarData,
            };
        },

        behaviors: {
            ExpandableList: {
                behaviorClass: ServerExpandingBehavior,
                expandedView: NodesTableReportView,
                expandedViewOptions: function () {
                    return {
                        context: this.getOption("context"),
                        data: this.getOption("data")
                    };
                },

                orderBy: 'name asc',
                titleBarIcon: function () {
                    return this.options.data.titleBarIcon;
                },
                dialogTitle: function () {
                    return base.getClosestLocalizedString(this.options.data.title, lang.dialogTitle);
                },
                dialogTitleIconRight: "icon-tileCollapse",
                dialogClassName: 'webreports-nodeslistreport-table'
            },

            DefaultAction: {
                behaviorClass: DefaultActionBehavior
            },

            CollectionState: {
                behaviorClass: CollectionStateBehavior,
                stateView: ListStateView,
                stateMessages: {
                    empty: lang.emptyListText,
                    loading: lang.loadingListText,
                    failed: lang.failedListText
                }
            }

        },
        filterNodeList: function (filterValue) {
            this.options.filterValue = filterValue;
            this.trigger('change:filterValue');
            this.ui.searchInput.focus();
        },

        onSearchKeyUp: function (event) {
            clearTimeout(this.keyTimer);
            if (event.which === 27) {
                this.searchFieldClearerClicked();
            }
            else {
                this.keyTimer = setTimeout(_.bind(this.filterNodeList, this, this.ui.searchInput.val()), 600);
            }
        },

        onSearchKeyDown: function (event) {
            if (event.which === 13) {
                event.preventDefault();
                return false;
            }
            clearTimeout(this.keyTimer);
        },

        searchFieldClearerClicked: function () {
            this.ui.searchInput.val('');
            this.filterNodeList('');
        },

        searchInput: function (event) {
        },
        _onCollapseExpandedView: function () {
            this.view.triggerMethod('collapse');
        },

        onBeforeDestroyItem: function (childView) {
            if (childView._nodeIconView) {
                childView._nodeIconView.destroy();
            }
        },

        onClickItem: function (target) {
            this.triggerMethod('execute:defaultAction', target.model);
        },

        onClickHeader: function (target) {
            if (!this.collection.isEmpty()) {
                this.triggerMethod('expand');
            }
        },

        onMoreLinkClick: function (event) {
            event.preventDefault();
            event.stopPropagation();
            this.triggerMethod('expand');
        },

        onRender: function () {
            var listViewOnRender = ListView.prototype.onRender;

            if (listViewOnRender) {
                listViewOnRender.apply(this, arguments);
            }

            if (_.has(this.collection.filters, "name")) {
                this.ui.searchInput.show();
                this.ui.clearer.toggle(true);

                this.ui.searchInput.val(this.collection.filters.name);
                this.ui.searchInput.focus();
                this.ui.headerTitle.toggle();
            }

        },

        onRenderItem: function (childView) {
            childView._nodeIconView = new NodeTypeIconView({
                el: childView.$('.csui-type-icon').get(0),
                node: childView.model
            });
            childView._nodeIconView.render();
        },

        synchronizeCollections: function () {
            var keyword = this.options.filterValue;
            if (!keyword.length && _.has(this.collection.filters, "name")) {
                this.collection.clearFilter();
            }

            if (keyword.length >= 3) {
                this.collection.setFilter({ name: keyword }, { fetch: true });
            } else {
                this.collection.reset(this.collection.models);
            }
        }

    });
    WebReportsViewMixin.mixin(NodesListReportContentView.prototype);

    return NodesListReportContentView;

});
