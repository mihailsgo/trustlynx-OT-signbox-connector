/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
'csui/lib/jquery',
'csui/lib/backbone',
'csui/lib/marionette',
'csui/utils/contexts/factories/connector',
'csui/controls/tile/behaviors/perfect.scrolling.behavior',
'csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view',
'csui/models/node/node.model',
'xecmpf/models/eac/eventactionplans.model',
'xecmpf/widgets/eac/impl/actionplan.list/impl/actionplan.toolbaritems',
'xecmpf/widgets/eac/impl/actionplan.list/actionplan.listitem.view',
'hbs!xecmpf/widgets/eac/impl/actionplan.list/impl/actionplan.list',
'i18n!xecmpf/widgets/eac/impl/nls/lang',
'css!xecmpf/widgets/eac/impl/actionplan.list/impl/actionplan.list'], function(_, $, Backbone, Marionette, ConnectorFactory, PerfectScrollingBehavior, TableRowSelectionToolbarView, NodeModel, EACEventActionPlans, toolbarItems, ActionPlanListItemView, ActionPlanListTemplate, lang) {
    var ActionPlanListItemCollectionView = Marionette.CollectionView.extend({
        className: 'xecmpf-action-plan-list-rows',
        tagName: 'ul',
        constructor: function ActionPlanListItemCollectionView(options) {
            options = options || {};
            this.options = options;
            this._focusIndex = 0;
            Marionette.CollectionView.prototype.constructor.call(this, options);

            
        },
        childView: ActionPlanListItemView,
        childEvents: {
            'click:actionplan:item': 'onActionPlanClickItem',
            'click:actionplan': 'onClickAddActionPlan',
            'click:actionplan:delete': 'onActionPlanDelete',
            'click:actionplan:rename':'onActionPlanRename',
            'keydown:action:rename':'onEditAction'
        },
        events:{
            'keydown' : 'onkeyInView'
        },
        onkeyInView: function (event) {
            var nextActionPlan, nextView,
               currentView =  this.children.findByModel(this.collection.at(this._focusIndex));
            switch (event.keyCode) {
                case 38: // up arrow key
                case 40: // down arrow key
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.keyCode === 38 && this._focusIndex > 0) {
                        this._focusIndex--;
                    } else if (event.keyCode === 40 && this._focusIndex < this.children.length-1) {
                        this._focusIndex++;
                    }
                    nextView = this.children.findByModel(this.collection.at(this._focusIndex));
                    this._changeTabIndexesAndSetFocus(currentView, nextView, true);
                    nextView._setFocus();
                    break;
                case 9:
                    if (event.shiftKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        if (this.options.originatingView.actionsRegion.$el.is(':visible')) {
                            this.options.originatingView.actionsRegion.$el.find('li[data-csui-command="delete"] > a').prop('tabindex', '0');
                            this.options.originatingView.actionsRegion.$el.find('li[data-csui-command="delete"] > a').trigger('focus');
                        } else if (event.target.classList.contains('actionplan-object-title-cancel')) {
                            $(event.target).siblings('.xecmpf-eac-action-plan-list-item-input').trigger('focus');
                        } else {
                            this.$el.closest('.xecmpf-actionplan-details').find('.xecmpf-back-button-container').prop('tabindex', '0');
                            this.$el.closest('.xecmpf-actionplan-details').find('.xecmpf-back-button-container').trigger('focus');
                        }
                        if (currentView.ui.actionPlanNameInput.is($(event.target))) {
                            currentView._submitDescription();
                        }
                    } else if (currentView.ui.actionPlanNameInput.is($(event.target))) {
                        event.preventDefault();
                        event.stopPropagation();
                        currentView.ui.actionPlanNameCancel.trigger('focus');
                    } else if (event.target.classList.contains('xecmpf-eac-action-plan-list-item-input')) {
                        event.preventDefault();
                        event.stopPropagation();
                        $(event.target).siblings('.actionplan-object-title-cancel').trigger('focus');
                    } else {
                        event.preventDefault();
                        event.stopPropagation();
                        this.$el.closest('.xecmpf-actionplan-details').find('li[role="presentation"] > .cs-tablink').first().trigger('focus');
                        if (currentView.ui.actionPlanNameCancel.is($(event.target))) {
                            currentView._submitDescription();
                        }
                    }
                    break;
                case 36: // home button
                    event.preventDefault();
                    event.stopPropagation();
                    this._focusIndex = 0;
                    nextView = this.children.findByModel(this.collection.at(this._focusIndex));
                    this._changeTabIndexesAndSetFocus(currentView, nextView, true);
                    nextView._setFocus();
                    break;
                case 35: // end button 
                    event.preventDefault();
                    event.stopPropagation();
                    this._focusIndex = this.children.length-1;
                    nextView = this.children.findByModel(this.collection.at(this._focusIndex));
                    this._changeTabIndexesAndSetFocus(currentView, nextView, true);
                    nextView._setFocus();
                    break;      
            }
        },
        _changeTabIndexesAndSetFocus: function (currentView, nextView, showDeleteIcon) {
            currentView.$el.find('a').prop('tabindex', -1)
            currentView.$el.find('.xecmpf-eac-action-plan-list-item-delete-btn').prop('tabindex', -1)
            currentView.$el.find('.xecmpf-eac-action-plan-list-item-delete-btn').hide();
            currentView._hasFocus = false;
            nextView.$el.find('a').prop('tabindex', 0);
            nextView.$el.find('.xecmpf-eac-action-plan-list-item-delete-btn').prop('tabindex', 0);
            if (showDeleteIcon) {
                nextView.$el.find('.xecmpf-eac-action-plan-list-item-delete-btn').show();
            }
            nextView._hasFocus = true;
        },
        onFocusoutActionPlan: function (childView, event) {
            if (event.relatedTarget) {
                if ($.contains(this.el, event.relatedTarget) === false) {
                    childView.$el.find('.xecmpf-eac-action-plan-list-item-delete-btn').hide();
                }
            }
        }

    });
    var ActionPlanListView = Marionette.LayoutView.extend({
        className:'xecmpf-eac-action-plan-list-view',
        constructor: function ActionPlanListView(options) {
            options = options || {};
            if (!!options.model && !options.model.action_plans) {
                options.model.attributes.action_plans = options.model.collection.models.map(function(action_plan) {
                    action_plan.namespace = options.model.attributes.system_name;
                    action_plan.event_name = options.model.attributes.name;
                    action_plan.event_def_id = options.model.attributes.id;
                    action_plan.event_id = options.model.attributes.id;
                    return action_plan;
                });
                options.collection = new Backbone.Collection(options.model.attributes.action_plans);
            }
            this.options = options;
          
            Marionette.LayoutView.prototype.constructor.call(this, options);
        },
        template: ActionPlanListTemplate,
        templateHelpers: function() {
            return {
                showAddActionPlan: !!this.options.showAddActionPlan,
                newActionPlanLabel: lang.newActionPlan,
                actionPlansListHeader:  lang.actionPlansListHeader,
                actionPlansGroup: lang.actionPlansGroup,
                addToWareHouse:lang.addToWareHouse,
                delete:lang.deleteActionPlanButton
            }
        },
        behaviors: {
            PerfectScrolling: {
                behaviorClass: PerfectScrollingBehavior,
                contentParent: '.xecmpf-action-plan-list-rows',
                suppressScrollX: true,
                scrollYMarginOffset: 15
            }
        },
        regions: {
            actionPlanListRegion: '.xecmpf-eac-action-plan-list',
            actionsRegion: ".xecmpf-action-plan-actions-list-container"
        },
        hideOptions: function () {
            if (!!event && $(event.target).closest('.xecmpf-more-action-plan-list-container').length === 0) {
                $('.xecmpf-more-action-plan-list-container').removeClass('binf-open');
            }
        },
        onRender: function() {            
            this.actionPlanListItemCollectionView = new ActionPlanListItemCollectionView({
                 collection: this.options.collection,
                 context: this.options.context,
                 originatingView: this
            });
            this.actionPlanListRegion.show(this.actionPlanListItemCollectionView);
            if (this.options.collection.length === 0 || this.options.model.get('isAddActionPlan')) {
                this.addNewActionPlan(); // to open first action plan item by default
            }
            this.$el.find('.xecmpf-action-plan-actions-list-container').addClass('binf-hidden');
            this.$el.on('click.dropdown.close', _.bind(this.hideOptions, this));
     
        },
        ui: {
            'addActionEle': '.xecmpf-eac-add-action-plan-btn',
            'ulelement':'.xecmpf-more-action-plan-list-container',
        },
        events: {
            'click @ui.addActionEle': 'onAddActionPlanClick',
            'keydown @ui.addActionEle': 'onAddActionPlanKeydown',
            'click @ui.ulelement': function (event) {
                if ($('.xecmpf-more-action-plan-list-container').hasClass('binf-open')) {
                    $('.xecmpf-more-action-plan-list-container').removeClass('binf-open');
                    $(event.currentTarget).addClass('binf-open');
                } else {
                    $(event.currentTarget).addClass('binf-open');
                }
            },
            'focusout @ui.ulelement': function (event) {

            }
        },
        childEvents: {
            'actionplan:click:item': 'onActionPlanClick',
            'click:add:actionplan': 'onClickAddActionPlan',
            'actionplan:click:delete': 'onActionPlanDelete',
            'actionplan:click:rename': 'onActionPlanRenameEdit',
            'actionplan:click:renamecancel': 'onActionPlanCancelRename',
            'keydown:action:rename':'onEditAction',
            'show:actionplan:moreButton':'showMoreBtn'

        },
         
        showMoreBtn: function (childView, src) {
            var res,
                that = this,
                selectedNodeCollection = new Backbone.Collection();
            res = _.filter(childView.model.collection.models, function (model) {
                if (model.get('checked')) {
                    selectedNodeCollection.add(model);
                    return model.get('checked') === true;
                }
            });
            if (res.length > 0) {
                this.showToolBar();
                if (!!this.model) {
                    that.tablerowselectiontoolbar = new TableRowSelectionToolbarView({
                        toolItemFactory: toolbarItems.headerActionbar,
                        selectedChildren: selectedNodeCollection,
                        container: that.model,
                        context: that.options.context,
                        originatingView: that.options.originatingView,
                        collection: that.collection
                    });
                    that.actionsRegion.show(that.tablerowselectiontoolbar);
                    that.listenTo(that.tablerowselectiontoolbar._commandController, 'after:execute:command', function (eventArgs) {
                       that.deleteActionPlan(eventArgs);
                    });
                }
            } else {
                this.hideToolBar();
            }
        },
        onEditAction: function (childView, src) {

            var editcancelClicked =
                    event.relatedTarget ? $(event.relatedTarget).find(
                        '.xecmpf-eac-action-plan-list-item-cancelrename-btn.cancelrename-write-mode') :
                    '';
            if (!!editcancelClicked) {
                this.onActionPlanCancelRename(childView, src);

            } else {
                src.$el.find(".xecmpf-eac-action-plan-list-item-text").removeClass(
                    'binf-active binf-edit-active');
                var value = event.target.value;
                childView.render();
            }

        },
        onActionPlanClick: function(childView, src) {
            this.trigger('actionplan:click:item', src);
        },

        onClickAddActionPlan: function(childView, src) {
            this.trigger('click:add:actionplan', src);
        },

        onActionPlanDelete: function(childView, src) {
            this.trigger('actionplan:click:delete', src);
        },

        onActionPlanRenameCancel: function(childView, src) {
            this.trigger('actionplan:click:renamecancel', src);
        },
        onActionPlanRenameEdit: function (childView, src) {
            src.$el.addClass('binf-edit-active');
            src.$el.find(".binf-flex-row.xecmpf-eac-action-plan-name-link").addClass('binf-hidden');
            src.$el.find(".xecmpf-eac-action-plan-list-item-text").removeClass('binf-hidden');
            var currentVaule = src.$el.find('.xecmpf-eac-action-plan-name').text();
            src.$el.find(".xecmpf-eac-action-plan-list-item-text")[0].value = currentVaule;
            src.$el.find(".binf-btn.xecmpf-eac-action-plan-list-item-cancelrename-btn").addClass(
                "cancelrename-write-mode").removeClass("binf-hidden");
            src.$el.find(".binf-btn.xecmpf-eac-action-plan-list-item-rename-btn").addClass(
                "binf-hidden");
            src.$el.find(".xecmpf-more-actions-container").addClass("binf-hidden");

        },

        onActionPlanCancelRename: function (childView, src) {
            src.$el.find(".xecmpf-more-actions-container").removeClass("binf-hidden");
            src.$el.removeClass('binf-edit-active');
            src.$el.find(".binf-flex-row.xecmpf-eac-action-plan-name-link").removeClass(
                'binf-hidden');
            src.$el.find(".xecmpf-eac-action-plan-list-item-text").addClass('binf-hidden');
            src.$el.find(".xecmpf-eac-action-plan-list-item-text").removeClass(
                'binf-active binf-edit-active');
            src.$el.find(".binf-btn.xecmpf-eac-action-plan-list-item-cancelrename-btn").removeClass(
                "cancelrename-write-mode").addClass("binf-hidden");
            src.$el.find(".binf-btn.xecmpf-eac-action-plan-list-item-rename-btn").removeClass(
                "binf-hidden");

        },
        addNewActionPlan: function() {
            var model = this.actionPlanListItemCollectionView.collection.findWhere({ plan_id: '' }),
                namespace = !!this.options.model.attributes.namespace ? this.options.model.attributes.namespace : this.options.model.attributes.system_name,
                event_name = !!this.options.model.attributes.event_name ? this.options.model.attributes.event_name : this.options.model.attributes.name,
                event_def_id = !!this.options.model.attributes.event_def_id ? this.options.model.attributes.event_def_id : this.options.model.attributes.id;
            if (!model) {
                var newActionListItemModel = new NodeModel(undefined, { connector: this.options.connector }),
                    newActionListItem;
                newActionListItemModel.set({
                    plan_id: '',
                    process_mode: '',
                    rule_id: '',
                    rules: [{}],
                    namespace: namespace,
                    event_name: event_name,
                    event_def_id: event_def_id,
                    event_id: this.options.model.attributes.event_id,
                    eventType: this.options.model.attributes.event_type,
                    hideCheckBox: true,
                    isAddActionPlan: true
                });
                this.actionPlanListItemCollectionView.collection.add(newActionListItemModel); // adding to collection
                newActionListItem = this.actionPlanListItemCollectionView.children.findByModel(newActionListItemModel);
                newActionListItem.trigger('click:actionplan');
                newActionListItem.$el.find('.xecmpf-eac-action-plan-list-item-input').trigger('focus');
            }
            else {
                model = this.actionPlanListItemCollectionView.children.findByModel(model);
                model.trigger('click:actionplan:item');
            }
        },
        fetchEventActionPlans: function() {
            var deferred = $.Deferred(),
                that = this,
                connector = this.options.context.getObject(ConnectorFactory),
                ajaxOptions;

            ajaxOptions = {
                type: 'GET',
                url: connector.getConnectionUrl().getApiBase('v2') + '/eventactioncenter/actionplandetails?action_plan_id=' + this.model.get('id')
            };
            connector.makeAjaxCall(ajaxOptions)
                .done(function (response, statusText, jqxhr) {
                    if (response) {
                        if (response.results.data) {
                            that.model.set('data', response.results.data);
                            that.model.set('event_def_id', that.model.get('event_def_id'));
                            var actionPlanModel = new NodeModel({ id: that.model.attributes.id },
                                {
                                    connector: that.options.connector,
                                    includeActions: true,
                                    commands: ["rename", "delete", "addToWarehouse"]
                                });
                            actionPlanModel.connector = that.options.connector;
                            actionPlanModel.fetch().done(function () {
                                that.options.originatingView.children.add(actionPlanModel);
                                actionPlanModel.set('data', that.model.get('data'));
                                actionPlanModel.set('event_def_id', that.model.get('event_def_id'));
                                actionPlanModel.set('eventType', response.results.data.eventType);
                                that.actionPlanListItemCollectionView.collection.remove(that.model);
                                that.actionPlanListItemCollectionView.collection.set(actionPlanModel, { remove: false });
                                deferred.resolve(that.actionPlanListItemCollectionView.collection);
                            });
                        }
                    }
                }).fail(function (jqXHR, statusText, error) {
                    deferred.reject();
                });
            return deferred.promise();
        },
        refreshCurrentActionPlanItem: function(eventInfo) {
            var planID = eventInfo.planID,
                modelToBeUpdated,
                $deferred = $.Deferred();
            if (eventInfo.operation === 'create') {
                modelToBeUpdated = this.actionPlanListItemCollectionView.collection.findWhere({ plan_id: '' });
            } else {
                modelToBeUpdated = this.actionPlanListItemCollectionView.collection.findWhere({ id: planID });
                this.model= modelToBeUpdated;
            }
            if (!!modelToBeUpdated) {
                var that = this;
                this.fetchEventActionPlans().then(function(eacPlansCollection) {
                    var eventModel = eacPlansCollection.findWhere({ id: eventInfo.planID });
                    if (eventModel ) {
                            eventModel.set('isAddActionPlan',false);
                            eventModel.set('planCreated',false);
                            that.actionListItemToRetrigger = that.actionPlanListItemCollectionView.children.findByModel(eventModel);
                            $deferred.resolve(that.actionListItemToRetrigger);
                        }
                        else {
                            modelToBeUpdated.trigger('delete:action:plan');
                            $deferred.reject();
                        }
                }, function() {
                    $deferred.reject();
                });
            } else {
                $deferred.reject();
            }
            return $deferred.promise();
        },
        hideToolBar: function(){
            this.$el.find('.xecmpf-action-plan-actions-list-container').addClass('binf-hidden');
            this.$el.find('.xecmpf-eac-action-plan-header').removeClass('binf-hidden');
        },
        showToolBar: function(){
            this.$el.find('.xecmpf-eac-action-plan-header').addClass('binf-hidden');
            this.$el.find('.xecmpf-action-plan-actions-list-container').removeClass('binf-hidden');
        },
        deleteActionPlan: function (eventArgs) {
            var model;
            if (eventArgs.commandSignature === 'Delete') {
                this.hideToolBar();
                 for (var index = 0; index < this.actionPlanListItemCollectionView.collection.length; index++) {
                     model = this.actionPlanListItemCollectionView.collection.models[index];
                    if (!!model && model.get('checked')) {
                         model.trigger('toggle:checkbox');   
                     }
                 }
               
            }
        }
    });

    return ActionPlanListView;
});
