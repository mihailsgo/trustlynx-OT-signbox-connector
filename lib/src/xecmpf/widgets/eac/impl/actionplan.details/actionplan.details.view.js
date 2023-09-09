/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module",
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/lib/backbone",
  "csui/lib/marionette",
  'csui/models/node/node.model',
  'csui/utils/contexts/factories/node',
  'csui/behaviors/default.action/default.action.behavior',
  "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin",
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/url',
  'csui/models/nodechildren',
  'csui/utils/contexts/factories/connector',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/progressblocker/blocker',
  "xecmpf/widgets/eac/impl/actionplan.list/actionplan.list.view",
  "xecmpf/widgets/eac/impl/actionplan.header/actionplan.header.view",
  "xecmpf/widgets/eac/impl/actionplan.tab.content/actionplan.tabbed.view",
  "hbs!xecmpf/widgets/eac/impl/actionplan.details/impl/actionplan.details",
  "i18n!xecmpf/widgets/eac/impl/nls/lang",
  "css!xecmpf/widgets/eac/impl/actionplan.details/impl/actionplan.details"
], function (module, $, _, Backbone, Marionette, NodeModel, NodeModelFactory, DefaultActionBehavior, LayoutViewEventsPropagationMixin, ModalAlert, Url, NodeChildrenCollection, ConnectorFactory, GlobalMessage, BlockingView, 
    ActionPlanListView, ActionPlanHeaderView, ActionPlanTabbedView, template, lang) {
  'use strict';

  var ActionPlanDetailsView = Marionette.LayoutView.extend({

    className: 'xecmpf-actionplan-details',
    template: template,

    regions: {
      headerRegion: '.xecmpf-actionplan-header-view',
      actionPlanListRegion: '.xecmpf-actionplan-list-view',
      actionPlanDetailsRegion: '.xecmpf-actionpan-details-view'
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    initialize: function (options) {
      this.options.connector = this.options.context.getModel(ConnectorFactory);
      this.options.model = this.options.context.model ?
        this.options.context.model : options.context.getModel(NodeModelFactory);
      var that = this;
      that.children = new NodeChildrenCollection(undefined, {
        node: that.options.model,
        commands: 'rename,delete,addToWarehouse',
      });
      that.children.fetch().done(function () {
        that.setHeaderView();
        that.setActionPlanListView();
        that.onShow();
      });
    },

    constructor: function ActionPlanDetailsView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions(); // propagate dom:refresh to child views
    },
    onShow: function () {
      if (this.children.fetched) {
        var that = this;

        this.listenTo(this.actionPlanListView, 'actionplan:click:item', function (eventSrc) {
          this.isContentViewCanbeUpdated(eventSrc.model).then(function () {
            that.updateContentView(eventSrc);
          });
        });

        this.listenTo(this.actionPlanListView, 'click:add:actionplan', function (eventSrc) {
          this.isContentViewCanbeUpdated(eventSrc.model).then(function () {
            that.updateContentView(eventSrc, true);
          });
        });

        this.listenTo(this.actionPlanListView, 'actionplan:add:item', function (eventSrc) {
          this.isContentViewCanbeUpdated().then(function () {
            if (!!that.actionplanTabbedView) { that.actionplanTabbedView.destroy(); }
            that.actionPlanListView.addNewActionPlan(); // adds new action plan
          });
        });

        this.listenTo(this.actionPlanListView, 'actionplan:click:delete', function (eventSrc) {
          this.deleteActionPlan(eventSrc);
        });

        this.listenTo(this.actionPlanListView, 'actionplan:click:rename', function (eventSrc) {

        });

        this.listenTo(this.actionPlanListView, 'actionplan:click:renamecancel', function (eventSrc) {
          this.deleteActionPlan(eventSrc);
        });
        this.listenTo(this.actionPlanListView, 'keydown:action:rename', function (eventSrc) {
          that.updateContentView(this.actionPlanListView);
        });

        this.actionPlanListRegion.on('show', _.bind(this.onActionPlanListShown, this));

        this.headerRegion.show(this.headerView);
        this.actionPlanListRegion.show(this.actionPlanListView);
      }
    },
    isContentViewCanbeUpdated: function( nextModel ) {
      var $deferred = $.Deferred(),
        currentModel = null,
        isPlanId = nextModel ? nextModel.get("plan_id") !== "": true;
      if (this.actionplanTabbedView && !this.actionplanTabbedView.isDestroyed) {
        this.currentModel = this.actionplanTabbedView.options.model;
        this.hasNewActionPlanModel = this.currentModel.get('plan_id') === '';
        if (currentModel === nextModel) {
          $deferred.reject();
        } else if ((this.actionplanTabbedView.tabbedViewContainsChanges || this.hasNewActionPlanModel) && isPlanId) {
          ModalAlert.confirmQuestion( lang.warningMsgOnActionPlanNavigation, 
            lang.actionPlanNavigationDialogTitle, { buttons: ModalAlert.OkCancel })
            .done(_.bind(function () {
              if (this.currentModel.attributes.plan_id && !this.currentModel.attributes.rule_id) {
                var that = this,
                actionPlanUrl = this.options.connector.getConnectionUrl().getApiBase('v2') + '/nodes/' + this.currentModel.attributes.plan_id;
                this.options.connector.makeAjaxCall({
                  type: "Delete",
                  url: actionPlanUrl,
                  processData: false,
                  contentType: false
                }).then(function (response) {
                  that.actionPlanListView.actionPlanListItemCollectionView.collection.remove(that.currentModel);
                  $deferred.resolve();
                }, function (xhr) {
                  $deferred.reject();
                })
              }
              else {
                if(this.currentModel.attributes.plan_id === ''){
                this.actionPlanListView.actionPlanListItemCollectionView.collection.remove(this.currentModel);
                }
                $deferred.resolve();
              }

            }, this))
          .fail(function() {
            $deferred.reject();
          });
        } else {
          $deferred.resolve();  
        }
      } else {
        $deferred.resolve();
      }
      return $deferred.promise();
    },
    updateContentView: function(eventSrc, isAddActionPlan) {
      if (!this.actionPlanListView.$el.find('.binf-active').hasClass("xecmpf-new-eac-action-plan-list-item")) {
        this.actionPlanListView.$el.find('.binf-active').removeClass('binf-active');
        var actionPlanActive = this.actionPlanListView.actionPlanListItemCollectionView.children.findByModel(eventSrc.model);
        actionPlanActive.$el.addClass('binf-active');
      }
      this.setActionPlanTabbedView(eventSrc.model, isAddActionPlan);
      if (!eventSrc.model.attributes.plan_id) {
        eventSrc.model.set('create', true);
      }
      else {
        eventSrc.model.set('create', false);
        eventSrc.model.set('hideCheckBox', false);
        eventSrc.model.trigger('show:inline:action:bar');
      }
    },

    setHeaderView: function () {
      this.headerView = new ActionPlanHeaderView(this.options);
      this.listenTo(this.headerView, "actionplan:click:back", function () {
        this.isContentViewCanbeUpdated().then((function() {
          history.back();
        }).bind(this));
      });
    },
    setActionPlanListView: function () {
      this.options.connector = this.options.context.getObject(ConnectorFactory);
      var that = this;
      var item = that.children.models.filter(function (Item) {
        return Item.attributes.type !== 144;
      });
      that.children.models = item;
      that.children.totalCount = item.length;
      that.children.length = item.length;
      that.options.model.collection = that.children;
      that.actionPlanListView = new ActionPlanListView({
        showAddActionPlan: true,
        context: that.options.context,
        model: that.options.model,
        originatingView: that,
        connector: that.options.connector,
        isAddActionPlan: that.options.isAddActionPlan
      }
      );
    },
    setActionPlanTabbedView: function (model, isAddActionPlan) { 
      var that = this,
        emptymodel = this.actionPlanListView.actionPlanListItemCollectionView.collection.findWhere({ 'isAddActionPlan': true });
      if (isAddActionPlan && !model.get('id')) {
        model.set('isAddActionPlan', isAddActionPlan);
      }
      if (this.actionplanTabbedView && !emptymodel) {
        this.actionplanTabbedView.destroy();
      }
      if (!model.get('isAddActionPlan') && !model.get('planCreated') && !emptymodel) {
        var ajaxOptions = {
          type: 'GET',
          url: this.options.connector.getConnectionUrl().getApiBase('v2') + '/eventactioncenter/actionplandetails?action_plan_id=' + model.get('id')
        };
        this.options.connector.makeAjaxCall(ajaxOptions)
          .done(function (response, statusText, jqxhr) {
            if (response) {
              if (response.results.data) {
                model.set('data', response.results.data);
                model.set('event_def_id', model.get('parent_id'));
                model.set('eventType', response.results.data.eventType);
                that.actionplanTabbedView = new ActionPlanTabbedView({
                  context: that.options.context,
                  model: model,
                  eventname: that.options.eventname,
                  apData: response.results.data,
                  namespace: that.options.namespace,
                  originatingView: that.options.originatingView,
                  isAddActionPlan: model.get('isAddActionPlan')
                });
                that.actionPlanDetailsRegion.show(that.actionplanTabbedView);
                that.listenTo(that.actionplanTabbedView, "actionplan:click:back", function () {
                  that.isContentViewCanbeUpdated().then((function () {
                    history.back();
                  }).bind(this));
                });
                that.listenTo(that.actionplanTabbedView, 'actionplan:click:link', function (ele, self) {
                  that.isContentViewCanbeUpdated().then(function () {
                    ele.off('click.' + self.cid);
                    ele.trigger('click');
                  });
                });
                that.listenTo(that.actionplanTabbedView, "refresh:current:action:plan:item", function (data) {
                  that.actionPlanListView.refreshCurrentActionPlanItem(data).then(function (actionPlanListItem) {
                    that.updateContentView(actionPlanListItem);
                  });
                });
              }
            }
          })
          .fail(function (jqXHR, statusText, error) {
          });
      }
      else {
        model.set('event_def_id', this.options.model.attributes.id);
        that.actionplanTabbedView = new ActionPlanTabbedView({
          context: that.options.context,
          model: model,
          eventname: that.options.eventname,
          namespace: that.options.namespace,
          originatingView: that.options.originatingView,
          isAddActionPlan: model.get('isAddActionPlan')
        });
        that.actionPlanDetailsRegion.show(that.actionplanTabbedView);
        that.listenTo(that.actionplanTabbedView, "actionplan:click:back", function () {
          that.isContentViewCanbeUpdated().then((function () {
            history.back();
          }).bind(this));
        });
        that.listenTo(that.actionplanTabbedView, 'actionplan:click:link', function (ele, self) {
          that.isContentViewCanbeUpdated().then(function () {
            ele.off('click.' + self.cid);
            ele.trigger('click');
          });
        });
        that.listenTo(that.actionplanTabbedView, "refresh:current:action:plan:item", function (data) {
          that.actionPlanListView.refreshCurrentActionPlanItem(data).then(function (actionPlanListItem) {
            that.updateContentView(actionPlanListItem);
          });
        });
      }
    },
    onActionPlanListShown: function(actionPlanListView) {      
      var firstActionPlan = actionPlanListView.actionPlanListRegion.currentView.children.findByIndex(0),
      emptymodel =  actionPlanListView.actionPlanListItemCollectionView.collection.findWhere({'plan_id':''});
      if (firstActionPlan && !emptymodel) {
        if (this.options.model.get('isAddActionPlan')) {
          firstActionPlan.trigger('click:actionplan');
        } else {
          firstActionPlan.trigger('click:actionplan:item');
        }
      }  
      this.actionPlanListView.$el.find('.xecmpf-eac-action-plan-list-item-input').trigger('focus'); 
    },
    deleteActionPlan: function(eventSrc) {
      this.updateActionPlanSelection(eventSrc);
    },
    updateActionPlanSelection: function(actionPlan) {
      var actionPlanCollectionView = this.actionPlanListView.actionPlanListItemCollectionView;
      var actionPlanListChildren = actionPlanCollectionView.children;
      var index = actionPlan._index;
      var nextView = actionPlanListChildren.findByIndex(index + 1);
      var prevView = actionPlanListChildren.findByIndex(index - 1);
      var nextActiveView = nextView ? nextView : (prevView ? prevView : undefined);
      var isActive = actionPlan.$el.hasClass('binf-active');
      if (nextActiveView && actionPlan._hasFocus) {
        actionPlanCollectionView._changeTabIndexesAndSetFocus(actionPlan, nextActiveView, false);
      }
      this.actionPlanListView.actionPlanListItemCollectionView.collection.remove(actionPlan.model);
      if (isActive === true) {
        this.actionplanTabbedView.destroy(); // destroying tab view as corresponding model is already destroyed
        if (nextActiveView) {
          nextActiveView.trigger('click:actionplan:item');
        }
      }
    }
  });

  _.extend(ActionPlanDetailsView.prototype, LayoutViewEventsPropagationMixin);

  return ActionPlanDetailsView;
});
