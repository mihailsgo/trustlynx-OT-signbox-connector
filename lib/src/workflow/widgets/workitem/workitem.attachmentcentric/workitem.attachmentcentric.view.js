/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette', 'csui/lib/jquery',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/metadata/metadata.view',
  'csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
  'workflow/widgets/workitem/workitem.attachmentcentric/impl/workitem.attachmentcentric.list.behavior',
  'workflow/widgets/workitem/workitem.tabPanel/workitem.tabPanel.view',
  'csui/controls/progressblocker/blocker',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/utils/contexts/factories/next.node',
  'csui/models/nodeversions',
  'workflow/widgets/workitem/workitem.attachmentcentric/impl/empty.attachmentcentric.view',
  'hbs!workflow/widgets/workitem/workitem.attachmentcentric/impl/workitem.attachmentcentric'
], function (_, Backbone, Marionette, $, TabableRegionBehavior, MetadataView, MetadataNavigationView,
    MetadataNavigationListBehavior, WorkItemTabPanelView, BlockingView,
    MetadataModelFactory, NextNodeModelFactory, NodeVersionCollection, EmptyAttachmentCentricView, template
     ) {
  'use strict';

  var WorkItemAttachmentCentricView = MetadataNavigationView.extend({

    template: template,

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 100
      },
      MetadataNavigationListBehavior: {
        behaviorClass: MetadataNavigationListBehavior
      }
    },

    constructor: function MetadataNavigationView(options) {
      options || (options = {});
      BlockingView.imbue(this);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      this.enableViewState = true;

      if (options.enableViewState === false) {
        this.enableViewState = false;
      }

      this.context = options.context;

      this.collection = options.collection;
      this.container = options.container;
      this.containerCollection = options.containerCollection;
      this.originatingView = options.originatingView;

      var initiallySelectedModel = this._getInitiallySelectedModel();

      this.mdv = (this.options.data && this.options.data.contentView) ?
                 this.options.data.contentView :
                 new MetadataView({
                   model: initiallySelectedModel,
                   container: this.container,
                   containerCollection: this.containerCollection,
                   collection: this.collection,
                   context: this.context,
                   originatingView: this,
                   metadataNavigationView: this,
                   enableViewState : this.enableViewState
                 });

      if (!this.options.data || !this.options.data.contentView) {
        this.mdv.internal = true;
      }

      this._subscribeToMetadataViewEvents(initiallySelectedModel);

      this.mdn =  new WorkItemTabPanelView({
            collection: this.options.tabPanelCollection
          });

      var activetab = this.mdn.activeTab.get('tabIndex');
      var tabModel = this.mdn.collection.at(activetab);
      tabModel.get('viewToRenderOptions').attachmentcentricview = this;
      tabModel.get('viewToRenderOptions').attachmentCollection = this.collection;

      if (this.options.originatingView &&
          (!_.isFunction(this.options.originatingView.cascadeDestroy) ||
           this.options.originatingView.cascadeDestroy())) {
        this.listenTo(this.options.originatingView, 'before:destroy', function () {
          this._closeMetadata();
        });
      }
      this.propagateEventsToRegions();
      if (this.options.parentView) {
        this.listenTo(this.options.parentView, 'show:workflowAttributes', function () {
          this.emptyAttachmentCentricView.trigger('show:workflowAttributes:tab:content');
        });
      }
    },

    onRender: function () {
      return;
    },

    _moveToNextItemAfterDeleteOrMove: function () {
      return;
    },

    _currentIndex: function () {
      return;
    },

    _emptyView: function(){
      this.contentRegion.empty();
      var bravaRegion  = this.options.parentView.$el.find('.workitem-bravaview');
      var workitemRegion = this.options.parentView.$el.find('.workitem-row-middle-section');
      if (bravaRegion.length > 0 && bravaRegion.parent().length > 0 && workitemRegion.length > 0 ){
          bravaRegion.parent().hide();
          workitemRegion.addClass('fullexpand');
      }
      var emptyAttachmentCentricView = this.emptyAttachmentCentricView = new EmptyAttachmentCentricView(this.options);
      this.contentRegion.show(emptyAttachmentCentricView);
    },

    _showNode: function (model) {

      if (this.mdv && this.mdv.internal) {
        this.mdv.destroy();
      }
      model.set('showWfPropertyMenuItem', true);
      this.mdv = new MetadataView({
        model: model,
        container: this.container,
        containerCollection: this.containerCollection,
        collection: this.collection,
        context: this.context,
        originatingView: this,
        metadataNavigationView: this,
        enableViewState : this.enableViewState
      });

      this.mdv.internal = true;
      this.selectedProperty = undefined;
      this._subscribeToMetadataViewEvents(model);
      if (this.collection.length > 0 || (model && Object.keys(model.attributes).length > 0 && model.collection.length > 0)){
        this.contentRegion.show(this.mdv);
        this.listenTo(this.mdv.metadataTabView, 'before:activate:tab', this._toggleBravaView);
      } else {
        var emptyAttachmentCentricView = this.emptyAttachmentCentricView = new EmptyAttachmentCentricView(this.options);
        this.contentRegion.show(emptyAttachmentCentricView);
      }
    },

    _toggleBravaView: function(tabContent, tabPane, tabLink){
      var bravaRegion  = this.options.parentView.$el.find('.workitem-bravaview');
      var workitemRegion = this.options.parentView.$el.find('.workitem-row-middle-section');
      if (bravaRegion.length > 0 && bravaRegion.parent().length > 0 && workitemRegion.length > 0 ){
        if (tabLink.model.get('name') === 'workflow-properties'){
          bravaRegion.parent().hide();
          workitemRegion.addClass('fullexpand');
        } else {
          bravaRegion.parent().show();
          workitemRegion.removeClass('fullexpand');
        }
      }
    }

  });

  return WorkItemAttachmentCentricView;
});
