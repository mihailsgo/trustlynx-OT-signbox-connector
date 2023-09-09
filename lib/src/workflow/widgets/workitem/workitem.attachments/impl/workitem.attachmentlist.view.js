/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/models/node/node.addable.type.collection',
  'csui/utils/log',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'workflow/behaviors/list.keyboard.behavior',
  'workflow/widgets/workitem/workitem.attachments/impl/workitem.attachments.draganddrop.view',
  'workflow/widgets/workitem/workitem.attachments/impl/workitem.attachmentitem.view',
  'workflow/widgets/workitem/workitem.attachments/impl/workitem.attachments.emptyDragAndDrop.view',
  'hbs!workflow/widgets/workitem/workitem.attachments/impl/workitem.attachmentlist',
  'i18n!workflow/widgets/workitem/workitem.attachments/impl/nls/lang',
  'css!workflow/widgets/workitem/workitem.attachments/impl/workitem.attachments'
], function ($, _, Marionette, TabableRegionBehavior, AddableTypeCollection, log,
    PerfectScrollingBehavior, DefaultActionBehavior, ListKeyboardBehavior, DragAndDrop,
    WorkItemAttachmentItemView, WorkItemDragAndDropEmptyView, template, lang) {
  'use strict';
  var WorkItemAttachmentListView = Marionette.CompositeView.extend({

    childViewContainer: '.workitem-attachments-itemlist',
    childView: WorkItemAttachmentItemView,
    emptyView: WorkItemDragAndDropEmptyView,
    childViewOptions: function () {
      var options         = this.options,
          originatingView = options.view;
      originatingView.collection = this.collection;
      return {
        defaultActionController: this.defaultActionController,
        context: options.context,
        view: originatingView,
        container: options.container
      };
    },
    childEvents: {
      'editmode:item': 'onEditModeItem',
      'click:item:brava': 'onClickItemBrava'
    },

    events: {
      'keydown': 'onKeyDown'
    },
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListKeyboard: {
        behaviorClass: ListKeyboardBehavior,
        currentlyFocusedElementSelector: '.workitem-attachments-item'
      },
      ScrollingInstructions: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.workitem-attachments-scrolling',
        suppressScrollX: true,
        scrollYMarginOffset: 16
      }
    },
    className: 'workflow-attachmentlist-form',
    template: template,
    ui: {
      dragAndDropArea: 'div.workitem-dragdrop-area'
    },

    templateHelpers: function () {
      var isAssignment = !this.wfstatus;
      return {
        messages: {
          dragAndDropEmptyMsg: lang.EmptyDragAndDropMessage,
          isAssignment: isAssignment
        }
      };
    },

    constructor: function WorkItemAttachmentListView(options) {
      this.options = options;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },

    onBeforeRenderEmpty: function() {
      this.ui.dragAndDropArea.addClass("workitem-dragdrop-area-empty");
    },

    onBeforeRemoveEmpty: function() { 
      this.ui.dragAndDropArea.removeClass("workitem-dragdrop-area-empty");
    },

    onShow: function () {
      if (this._canApplyDragAndDrop() && !this.dragNDrop) {
        this.setDragNDrop();
      }
      if (this.options.view.model.get('isAttachmentCentric') === true) {

        var initialView = this.children.findByIndex(0);

        this.options.attachmentcentricview._showNode(initialView.model);
        this._setCssItemSelected(initialView.$el);
        this.setCurrentNextActiveAttachmentModels(initialView.model);
        if(initialView.model && initialView.model.get("type") === 1){
          this.options.attachmentcentricview.mdn.trigger("load:item", initialView);
        }
      }
    },

    _canApplyDragAndDrop: function () {
      var model    = this.options.view.model,
          mapsList = model.get('mapsList');
      return !model.get('isDoc') || (mapsList && mapsList.length === 1);
    },
    onAddChild: function (row) {
      this.selectedIndex = 0;
      this.trigger('refresh:tabindexes');
      if (this._canApplyDragAndDrop()) {
        this._setDragNDropRow(row);
      }
      if (this.options.view.model.get('isAttachmentCentric') === true) {
        var $active = this.$el.find('[data-workflow-active]');
        if( $active.length === 0 ){
          if (this.collection.length > 0 ) {
            var initialView = this.children.findByIndex(0);
            if (initialView.model && initialView.model.isLocallyCreated && this.collection.singleFileUpload){
              this._showAttachmentMetadataBravaPreview(initialView);
            }
          }
        } else {
            this.setCurrentNextActiveAttachmentModels(this.currentActiveAttachmentModel);
        }
      }
    },
    onRemoveChild: function () {
      this.selectedIndex = 0;
      this.trigger('refresh:tabindexes');
      if (this.options.view.model.get('isAttachmentCentric') === true) {
        var $active = this.$el.find('[data-workflow-active]');
        if( $active.length === 0 ){
          if (this.collection.length > 0 ) {
            var view;
            if (this.nextAttachmentModel){
              view = this.children.findByModel(this.nextAttachmentModel);
            } else {
              view = this.children.findByIndex(0);
            }
            if (view) {
              this._showAttachmentMetadataBravaPreview(view);
            }
          } else {
            this.options.attachmentcentricview._emptyView();
            this.options.attachmentcentricview.mdn.trigger("clear:item");
          }
        } else {
          this.setCurrentNextActiveAttachmentModels(this.currentActiveAttachmentModel);
        }
      }
    },
    onEditModeItem: function (view) {
      if (_.isFunction(view.isEditMode) && !view.isEditMode()) {
        this.trigger('refresh:tabindexes');
      }
    },

    onClickItemBrava: function (src) {

      if (this.options.view.model.get('isAttachmentCentric') !== true) {
        return;
      }
      var activeElements = ($(':active').length) ? $(':active') : $(':hover'),
          activeElement  = $(activeElements[activeElements.length - 1]),
          id = this.options.attachmentcentricview.mdv.model.get('id');
      if (src.model.get('id') !== id && !src.isEditMode() && !(activeElement.hasClass('workitem-attachment-description') ||
              activeElement.hasClass('workitem-attachment-name') ||
              activeElement.hasClass('icon icon-toolbar-rename') || activeElement.hasClass('icon') || 
              activeElement.hasClass("csui-toolitem csui-toolitem-textonly") )){
        this._showAttachmentMetadataBravaPreview(src);
      }

    },

    setCurrentNextActiveAttachmentModels: function (model){
      this.currentActiveAttachmentModel = model;
      this.nextAttachmentModel = this.collection.at(this.collection.indexOf(this.currentActiveAttachmentModel) + 1);
    },

    _showAttachmentMetadataBravaPreview: function (view){

      if (this.options.view.model.get('isAttachmentCentric') !== true) {
        return;
      }
      if (this.options.attachmentcentricview) {
        this.options.attachmentcentricview._showNode(view.model);
        this._setCssItemSelected(view.$el);
        this.options.attachmentcentricview.mdn.trigger("load:item", view);
        this.setCurrentNextActiveAttachmentModels(view.model);
        this.removeFullExpand();
      }
    },

    removeFullExpand: function (){
      var bravaRegion  = this.options.view.$el.find('.workitem-bravaview');
      var workitemRegion = this.options.view.$el.find('.workitem-row-middle-section');
      if (bravaRegion.length > 0 && bravaRegion.parent().length > 0 && workitemRegion.length > 0 ){
        bravaRegion.parent().show();
        workitemRegion.removeClass('fullexpand');
      }
    },

    _setCssItemSelected: function ($item) {
      if (!($item instanceof $)) {
        return;
      }
      var $active = $item.siblings('[data-workflow-active]');
      $active.removeClass('workitem-attachment-active').removeAttr('data-workflow-active').removeAttr('aria-current');
      $item.addClass('workitem-attachment-active').attr('data-workflow-active', '').attr('aria-current', 'page');

    },

    _isDragNDropSupportedRow: function (rowNode) {
      return (rowNode && rowNode.get('type') === 0);
    },

    _setDragNDropRow: function (row) {
      var rowNode           = row && row.model,
          isSupportedRow    = this._isDragNDropSupportedRow(rowNode),
          context           = this.options.context,
          currentHoverView  = isSupportedRow ? row.el : this,
          target            = isSupportedRow ? rowNode : this.collection.node,
          highlightedTarget = isSupportedRow ? currentHoverView : this.ui.dragAndDropArea;

      this.addableTypes = new AddableTypeCollection(undefined, {node: target});

      this.addableTypes.fetch().done(_.bind(function () {

        if (isSupportedRow) {
          currentHoverView.dragNDrop = new DragAndDrop({
            container: target,
            collection: this.collection,
            addableTypes: this.addableTypes,
            context: context,
            highlightedTarget: highlightedTarget,
            originatingView: this,
            isSupportedRowView: isSupportedRow,
            hideDropMessage: true
          });
          this.listenTo(currentHoverView.dragNDrop, 'drag:over', this._addDragDropBorder, this);
          this.listenTo(currentHoverView.dragNDrop, 'drag:leave', this._removeDragDropBorder, this);
          currentHoverView.dragNDrop.setDragParentView(this, row.el);
        }

      }, this));

    },

    setDragNDrop: function () {
      this.addableTypes = new AddableTypeCollection(undefined, {node: this.collection.node});
      this.addableTypes.fetch().done(_.bind(function () {
        this.dragNDrop = new DragAndDrop({
          container: this.collection.node,
          collection: this.collection,
          context: this.options.context,
          addableTypes: this.addableTypes
        });
        this.listenTo(this.dragNDrop, 'drag:over', this._addDragDropBorder, this);
        this.listenTo(this.dragNDrop, 'drag:leave', this._removeDragDropBorder, this);
        if (this.csuiDropMessage) {
          this.csuiDropMessage.remove();
          this.csuiDropMessage = undefined;
        }
        this.dragNDrop.setDragParentView(this, this.ui.dragAndDropArea);
      }, this));

    },

    _addDragDropBorder: function (view, options) {
      var disableMethod     = options && options.disabled ? 'addClass' : 'removeClass',
          highlightedTarget = options && options.highlightedTarget ? options.highlightedTarget :
                              this.ui.dragAndDropArea;
      $(highlightedTarget).addClass('drag-over')[disableMethod]('csui-disabled');
    },

    _removeDragDropBorder: function (options) {
      var highlightedTarget = this.ui.dragAndDropArea;
      options && options.highlightedTarget && options.valid ?
      $(options.highlightedTarget).removeClass('drag-over') :
      $(highlightedTarget).removeClass('drag-over');
    },

    onDomRefresh: function () {
      if (this.collection.propertiesAction) {
        Marionette.CollectionView.prototype._renderChildren.call(this);
        this.collection.propertiesAction = false;
        this.onShow();
      }
    }
  });

  return WorkItemAttachmentListView;

});
