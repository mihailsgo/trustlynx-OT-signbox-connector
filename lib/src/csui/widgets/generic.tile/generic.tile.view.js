/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore',
    'csui/controls/list/list.view',
    'csui/controls/listitem/listitemstandard.view',
    'csui/behaviors/limiting/limiting.behavior',
    'csui/behaviors/default.action/default.action.behavior',
    'csui/behaviors/keyboard.navigation/tabable.region.behavior',
    'csui/controls/list/behaviors/list.view.keyboard.behavior',
    'csui/behaviors/collection.state/collection.state.behavior',
    'csui/controls/list/list.state.view',
    'csui/controls/node-type.icon/node-type.icon.view',
    'csui/controls/progressblocker/blocker',
    'csui/utils/contexts/factories/application.scope.factory',
    'csui/utils/commands',
    'csui/widgets/generic.tile/tileview.toolbaritems',
    'csui/controls/globalmessage/globalmessage',
    'csui/utils/base',
    'i18n!csui/widgets/generic.tile/nls/lang',
    'i18n!csui/controls/listitem/impl/nls/lang',
], function (module, _, ListView, ListItemStandard,
    LimitingBehavior, DefaultActionBehavior, TabableRegionBehavior,
    ListViewKeyboardBehavior, CollectionStateBehavior, ListStateView,
    NodeTypeIconView, BlockingView, ApplicationScopeModelFactory,
    commands, tileViewToolbarItems, GlobalMessage, base, lang, listItemLang) {
    'use strict';

    var config = _.defaults({}, module.config(), {
        openInPerspective: true,
        filterByProperty : "name"
    });
    var GenericTileView = ListView.extend({

        constructor: function GenericTileView(options) {
            options || (options = {});
            options.data || (options.data = {});

            _.defaults(options, {
                titleBarIconName: 'title-icon title-customviewsearch',
                loadingText: lang.loadingText
            });

            options.data.titleBarIcon = options.data.showTitleIcon === false ?
                undefined : options.titleBarIconName;

            options.tileViewToolbarItems = tileViewToolbarItems;
            this.context = options.context;
            this.showInlineActionBar = options.showInlineActionBar === false ?
                options.showInlineActionBar : true;

            var viewStateModel = this.context && this.context.viewStateModel;
            this._enableOpenPerspective = config.openInPerspective &&
                viewStateModel && viewStateModel.get('history');

            this.options = options;

            var nonPromotedActionCommands = commands.getSignatures(tileViewToolbarItems);
            var factoryUID = this.options.data.savedSearchQueryId + Math.floor(Math.random() * 100);
            this.collection = this.options.collection ||
                this.options.context.getCollection(this.options.collectionFactory, {
                    options: {
                        promotedActionCommands: [],
                        nonPromotedActionCommands: nonPromotedActionCommands,
                        factoryUID: factoryUID,
                        query_id: this.options.data.savedSearchQueryId,
                        limit: this.options.limit,
                        isTileView: this.options.isTileView
                    }
                });
            var limitedRS = this.options.collectionFactory.getLimitedResourceScope();
            limitedRS && limitedRS.commands && limitedRS.commands.push('editpermissions');
            this.collection.setEnabledDelayRestCommands(false);
            this.collection.setEnabledLazyActionCommands(false);

            ListView.prototype.constructor.call(this, options);
            this.loadingText = options.loadingText;
            BlockingView.imbue(this);
            this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
        },

        childEvents: {
            'click:item': 'onClickItem',
            'render': 'onRenderItem',
            'before:destroy': 'onBeforeDestroyItem'
        },

        templateHelpers: function () {
            return {
                title: this.options.displayName || this.options.data.title || lang.dialogTitle,
                icon: this.options.titleBarIconName,
                searchPlaceholder: this.options.searchPlaceholder || lang.searchPlaceholder,
                searchTitle: lang.searchTitle,
                searchAria: lang.searchAria,
                expandAria: lang.expandAria,
                openPerspectiveAria: lang.openSearchCustomResultsView,
                openPerspectiveTooltip: lang.openSearchCustomResultsView,
                enableOpenPerspective: this._enableOpenPerspective
            };
        },

        childView: ListItemStandard,


        childViewOptions: function () {
            var toolbarData = this.showInlineActionBar ? {
                toolbaritems: this.options.tileViewToolbarItems,
                collection: this.collection
            } : undefined;

            return {
                templateHelpers: function () {
                    return {
                        name:  this.model.get('short_name') || this.model.get('name'),
                        enableIcon: true,
                        showInlineActionBar: this.showInlineActionBar,
                        itemLabel: _.str.sformat(listItemLang.itemTitleLabel,  this.model.get('short_name') || this.model.get('name'))
                    };
                },
                context: this.context,
                checkDefaultAction: true,
                toolbarData: toolbarData,
                refetchNodeActions: true
            };
        },

        behaviors: {
            DefaultAction: {
                behaviorClass: DefaultActionBehavior
            },
            TabableRegion: {
                behaviorClass: TabableRegionBehavior
            },
            ListViewKeyboardBehavior: {
                behaviorClass: ListViewKeyboardBehavior
            },
            CollectionState: {
                behaviorClass: CollectionStateBehavior,
                collection: function () {
                    return this.completeCollection;
                },
                stateView: ListStateView,
                stateMessages: function() {
                    return {
                        empty: this.options.emptyListText || lang.emptyListText,
                        loading:this.options.loadingListText || lang.loadingListText,
                        failed: this.options.failedListText || lang.failedListText
                    };
                }
            }
        },

        onRender: function () {
            ListView.prototype.onRender.apply(this, arguments);
            if (this.collection.delayedActions) {
                this.listenTo(this.collection.delayedActions, 'error',
                    function (collection, request, options) {
                        var error = new base.Error(request);
                        GlobalMessage.showMessage('error', error.message);
                    });
            }
            this.listenTo(this, 'change:filterValue', this.filterCollection);
            this.listenTo(this.collection, 'sync', function () {
                this.completeCollection = this.collection.clone();
            });
        },
        
        filterCollection: function () {
            var models;
            if (this.options.filterValue && this.options.filterValue.length > 0) {
                var keywords = this.options.filterValue.toLowerCase().split(' ');
                var filterByProperty = config.filterByProperty;

                this.currentFilter = {};
                this.currentFilter[filterByProperty] = this.options.filterValue.toLowerCase();

                models = this.completeCollection.filter(function (item) {
                    var name = item.get(filterByProperty),
                        isMatch;
                    if (name) {
                        name = name.trim().toLowerCase();
                        isMatch = _.reduce(keywords, function (result, keyword) {
                            return result && name.indexOf(keyword) >= 0;
                        }, true);
                    }
                    return isMatch;
                });
            } else {
                this.currentFilter = undefined;
                models = this.completeCollection.models;
            }
            this.collection.reset(models);
        },

        onRenderItem: function (childView) {
            childView._nodeIconView = new NodeTypeIconView({
                el: childView.$('.csui-type-icon').get(0),
                node: childView.model
            });
            childView._nodeIconView.render();

            childView.$el.attr('role', 'option');
            childView.$el.attr('aria-label',
                _.str.sformat(listItemLang.typeAndNameAria, childView._nodeIconView.model.get('title'),
                    childView.model.get('short_name') ? childView.model.get('short_name') : childView.model.get('name') )); 
        },

        onBeforeDestroyItem: function (childView) {
            if (childView._nodeIconView) {
                childView._nodeIconView.destroy();
            }
        },

        onClickItem: function (target) {
            this.triggerMethod('execute:defaultAction', target.model);
        },

    });

    return GenericTileView;

});