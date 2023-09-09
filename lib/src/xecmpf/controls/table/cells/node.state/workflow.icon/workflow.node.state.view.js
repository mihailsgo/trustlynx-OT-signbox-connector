/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'i18n',
  'csui/lib/underscore', 'csui/lib/marionette3', 'csui/utils/base',
  'xecmpf/models/workflows/metadata.workflow.collection', 
  'csui/utils/contexts/factories/connector',
  'csui/controls/mixins/keyboard.navigation/modal.keyboard.navigation.mixin',
  'hbs!xecmpf/controls/table/cells/node.state/impl/workflow.node.state',
  'xecmpf/controls/table/cells/node.state/workflow.icon/popover/workflow.popover.list.view',
  'i18n!xecmpf/controls/table/cells/node.state/workflow.icon/impl/nls/lang',
  'css!xecmpf/controls/table/cells/node.state/impl/workflow.node.state'
], function ($, i18n, _, Marionette, base,
   WorkflowModelCollection, ConnectorFactory, ModalKeyboardNavigationMixin, template, WorkflowPopover, lang) {
  'use strict';

  var WorkflowNodeState = Marionette.View.extend({
    tagName: 'li',
    className: 'csui-node-state-workflow',

    template: template,

    templateContext: function () {
      return{
        workflow: lang.workflow
      }
    },

    events: {
      'click button': 'onClickShowFlyout'
    },

    constructor: function WorkflowNodeState() {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.windowResizeHandler = _.bind(this._onWindowResize, this);
      $(window).on('resize', this.windowResizeHandler);
      $(window).on('resize', _.bind(this.closePopover, this));
    },

    initialize: function () {
      this.collection = new WorkflowModelCollection(undefined, {
        connector: this.options.context.getObject(ConnectorFactory),
        node: this.options.model,
        status: 'in progress'
      });
      this.collection.fetch();
    },

    _onWindowResize: function () {
      this.popoverEl && this.closePopover();
    },
   
    onClickShowFlyout: function (event) {
      var popoverEl = this.$el.find('button');
      this.openPopover(event, popoverEl);
    },

    openPopover: function (event, popoverEl) {
      if (!this.collection.length) {
        return;
      }
      var self=this,
      rightOffset, placement,
      widgetWidth = $('.workflow-list').width(),
      isWidthDiff = ($(window).width() !== widgetWidth),
      isRtl = i18n && i18n.settings.rtl;
      this.popoverEl = popoverEl ? popoverEl : $(event.currentTarget);
      this.WorkflowPopoverView = new WorkflowPopover({
        originatingView: this,
        collection: this.collection
      });
      this.WorkflowPopoverView.render();

      if (isRtl && isWidthDiff) {
        rightOffset = ($(window).width() - this.popoverEl.offset().left
          - this.popoverEl.width());
      } else {
        var tableRowEleWidth = $('.csui-nodestable').width() || 
                                  $('.csui-search-results').width();
        rightOffset = (tableRowEleWidth - this.popoverEl.offset().left
          - this.popoverEl.width());
      }
      placement = rightOffset < 260 ? 'left' : 'right'; // width of popover(260)
      this.popoverEl.binf_popover({
        content: this.WorkflowPopoverView.$el,
        html: true,
        placement: placement,
        trigger: 'manual',
        title: (this.collection.length >= 2) ?  lang.workflows : lang.workflow
      });
      this.popoverEl.binf_popover('show');
      this.popover = this.popoverEl.siblings(".binf-popover");

      this.onShowOverviewFlyout(),
      this.popoverEl.on('shown.binf.popover', _.bind(function () {
        var originatingView = this.options.originatingView ? this.options.originatingView : this.options.tableView;
        this.scrollEle = originatingView && originatingView.thumbnailView ? this.options.tableView.thumbnail.$el.find('.csui-thumbnail-results') : this.options.tableView.$el.find('tbody');
        this.scrollEle.on('scroll.popover', {view: this}, this._handleScrollEvent);
        $(document).on('mouseup.popover', { view: this }, this._handleClickEvent);
        $(this.WorkflowPopoverView.$el.find('.workflow-title .csui-title-link')[0]).trigger('focus');
      }, this));
      this.engageModalKeyboardFocusOnOpen(this.WorkflowPopoverView.el);
    },
    
    onShowOverviewFlyout: function () {
      var flyOutTarget = this.popoverEl,
        popoverContainer = flyOutTarget.parent().find(".binf-popover"),
        popoverArrowEl = popoverContainer.find('.binf-arrow'),
        popoverTitle = popoverContainer.find('.binf-popover-title'),
        popoverContent = popoverContainer.find('.binf-popover-content'),
        popoverArrowWidth = parseInt(popoverArrowEl.css('border-top-width')),
        navBarHeight = $('nav.csui-navbar').length ? $('nav.csui-navbar').innerHeight() :
          $(".binf-nav").parents('nav') && $(".binf-nav").parents('nav').length ?
            $(".binf-nav").parents('nav').innerHeight() : 0,
        paginationHeight = $('.csui-table-paginationview').innerHeight() || $('.csui-pagination').innerHeight(),
        breadcrumbHeight = $('#breadcrumb-wrap').innerHeight() || 0,
        flyOutTopPosition, workflowListHeight, popoverArrowTop,
        iconWidth = $('.csui-workflow-button').width(),
        workflowList = popoverContainer.find(".workflow-list"),
        workflowListOuterHeight = popoverTitle.outerHeight() + popoverContent.outerHeight() - popoverContent.height();
      popoverContainer.addClass('csui-workflow-popover');
      workflowListHeight = window.innerHeight - (workflowListOuterHeight + navBarHeight + paginationHeight + breadcrumbHeight);
      flyOutTopPosition = flyOutTarget.offset().top - (navBarHeight + parseInt(popoverArrowEl.css('top')) + workflowListOuterHeight);
      if (flyOutTopPosition < navBarHeight) {
        flyOutTopPosition = navBarHeight - workflowListOuterHeight;
        popoverArrowTop = flyOutTarget.offset().top - navBarHeight;
      } else {
        popoverArrowTop = parseInt(popoverArrowEl.css('top')) + navBarHeight;
      }
      var perspectivePanel = $(".cs-perspective-panel"),
        perspectivePanelClientTop = perspectivePanel.length > 0 ?
          perspectivePanel[0].getBoundingClientRect().top : 0;
      if (base.isIE11()) {
        flyOutTopPosition += workflowListOuterHeight;
        popoverArrowTop = (flyOutTarget.offset().top - flyOutTopPosition) + (perspectivePanelClientTop - navBarHeight) + popoverArrowWidth / 2;
      }
      workflowList.css({ 'max-height': workflowListHeight });
      popoverContainer.css({
        'position': 'fixed',
        'top': flyOutTopPosition
      });
      popoverArrowEl.css('top', popoverArrowTop);
      var flyOutLeft,
        flyOutTargetLeft,
        popoverContainerLeft = parseInt(popoverContainer.css('left')),
        originatingView = this.options.originatingView ? this.options.originatingView : this.options.tableView;
      if (originatingView) {
        flyOutTargetLeft = flyOutTarget.offset().left;
        if (popoverContainer.hasClass('binf-left')) {
          flyOutLeft = flyOutTargetLeft - (popoverContainer.outerWidth() + popoverArrowWidth / 2);
        }
        else {
          flyOutLeft = flyOutTargetLeft + flyOutTarget.width();
        }
      } else {
        if (popoverContainer.hasClass('binf-left')) {
          flyOutLeft = popoverContainerLeft - popoverArrowWidth / 2;
        } else {
          flyOutLeft = popoverContainerLeft + popoverArrowWidth;
        }
      }
      if(!!$('.csui-search-results').length){
        flyOutLeft += iconWidth/2;
      }
      popoverContainer.css({
        'right': 'auto',
        'left': flyOutLeft
      });
    },

  _handleClickEvent: function (event) {
    if (!$(event.target).closest('.binf-popover').length) {
      var view = event.data.view;
      $(document).off('mouseup.popover', this._handleClickEvent);
      view.closePopover(event.data.view);
    }
  },

    _handleScrollEvent: function (event) {
      var self = event.data.view;
      if (!$(event.target).closest('.binf-popover').length) {
        self.scrollEle.off('scroll.popover', self._handleScrollEvent);
        self && self.closePopover();
      }
    },

    closePopover: function (view) {
      view = view ? view : this;
      this.disengageModalKeyboardFocusOnClose();
      this.popover && this.popover.addClass('binf-hidden');
      this.popoverEl && this.popoverEl.binf_popover('destroy');
      if (view.WorkflowPopoverView) {
        view.WorkflowPopoverView.destroy();
      }
    },
  },
    {
      enabled: function (status) {
        var model = status.node,
          data = model && model.get('data');
        return data && data.showworkflowicon;
      },

      getModelFields: function (options) {
        return { showworkflowicon: '' };
      }
    });
  ModalKeyboardNavigationMixin.mixin(WorkflowNodeState.prototype);
  return WorkflowNodeState;
});