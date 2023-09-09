/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'csui/controls/table/cells/search/category/category.popover.list.view',
  'csui/utils/base','i18n',
  'hbs!csui/controls/table/cells/search/category/impl/category',
  'i18n!csui/controls/table/cells/search/category/impl/nls/lang',
  'css!csui/controls/table/cells/search/category/impl/category'
], function ($, _, Backbone, TemplatedCellView, cellViewRegistry, CategoryPopover, base, i18n
  , template, lang) {
  'use strict';

  var CategoryCellView = TemplatedCellView.extend({
    template: template,
    className: 'csui-category',
    templateHelpers: function () {
      return {
        count: this.collection.length
      };
    },
    events: {
      focus: 'onFocus',
      'blur .csui-table-cell-categories-text': 'onBlur',
      'click .csui-count': 'openPopover',
      'keydown .csui-table-cell-categories-text': 'onKeyInView',
    },

    constructor: function CategoryCellView() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
      this.categories = this.model.get("OTDCategory_expand"),
      this.formattedValue = this.model.get("OTDCategory_formatted");
      this.windowResizeHandler = _.bind(this._onWindowResize, this);
      $(window).on('resize', this.windowResizeHandler);
    },
    getValueText: function () {
      return this.getValueData().formattedValueForExpandView;
    },

    _createCategoryCollection: function () {
      var model,
        collection = new Backbone.Collection();
      _.each(this.model.get("OTDCategory_expand").values, function (item) {
        model = new Backbone.Model({
          value: item.value,
          value_formatted: item.value_formatted,
        });
        collection.add(model);
      });
      return collection;
    },

    _onWindowResize: function () {
      this.popoverEl && this.closePopover();
    },

    openPopover: function (event, popoverEl) {
      if (!this.collection) {
        return;
      }
      var self = this,
        rightOffset, placement,
        widgetWidth = $('.csui-result-list').width() || $('.csui-search-results-table-view'),
        isWidthDiff = ($(window).width() !== widgetWidth),
        isRtl = i18n && i18n.settings.rtl;
      this.popoverEl = popoverEl ? popoverEl : $(event.currentTarget);
      this.categoryPopoverView = new CategoryPopover({
        originatingView: this,
        collection: this.collection
      });
      this.categoryPopoverView.render();
      if (this.options.searchMetadataView) {
        placement = isRtl ? 'right' : 'left';
      }
      else {
        if (isRtl && isWidthDiff) {
          rightOffset = ($(window).width() - this.popoverEl.offset().left
            - this.popoverEl.width());
        } else {
          var searchEleWidth = $('.csui-search-results').width() || 
                                    $('.csui-search-results-table-view').width();
          rightOffset = (searchEleWidth - this.popoverEl.offset().left
            - this.popoverEl.width());
        }
        placement = rightOffset < 260 ? 'left' : 'right'; // width of popover(260)
      }
      this.popoverEl.binf_popover({
        content: this.categoryPopoverView.$el,
        html: true,
        placement: placement,
        trigger: 'manual'
      });
      this.popoverEl.binf_popover('show');
      this.popover = this.popoverEl.siblings(".binf-popover");
      this.popover.addClass('binf-invisible');//making the popover invisible to apply css
      var popoverLabelElemId = _.uniqueId('popoverLabelId'),
      popoverHeaderTitle = _.has(this.options.column.attributes, 'completeName') && this.options.column.attributes.completeName,
      popoverHeader = this.popover.find('>.binf-popover-title');
      this.popover.attr('role', 'dialog');
      if (popoverHeader) {
        popoverHeader.attr('id', popoverLabelElemId);
        popoverHeader.html(popoverHeaderTitle);
        this.popover.attr('aria-labelledby', popoverLabelElemId);
      }
      this.onShowOverviewFlyout();
      this.popoverEl.on('shown.binf.popover', _.bind(function () {
        var originatingView = this.options.originatingView ? this.options.originatingView : this.options.tableView;
        this.listenTo(originatingView, 'scroll', function () {
          self.closePopover();
        });
        $(document).on('mouseup.popover', { view: this }, this._handleClickEvent);
        $(this.categoryPopoverView.$el.find('.csui-category-value')[0]).prop('tabindex', 0).trigger('focus');
      }, this));
      this.popover.removeClass('binf-invisible');
    },

    onKeyInView: function(event){
      if(event.keyCode == 32 || event.keyCode == 13){
        event.preventDefault();
        event.stopPropagation();
        var popoverE1 = $(event.target).find('.csui-count');
        this.openPopover(event,popoverE1);
      }
    },

    onFocus: function (event) {
      if (!!this.$el.find('.csui-count').length) {
        var textWrapper = this.$el.find('.csui-table-cell-categories-text');
        textWrapper.attr('tabindex', 0);
        textWrapper.focus();
        event.preventDefault();
        event.stopPropagation();
      }
    },

    onBlur: function () {
      this.$el.find('.csui-table-cell-categories-text').attr('tabindex', -1);
    },

    onRender: function () {
      if (this.collection) {
        var textWrapper = this.$el.find(".csui-table-cell-categories-text"),
          value = _.str.sformat(lang.categoryTooltip, this.formattedValue, this.collection.length - 1);
        textWrapper.attr("role", "button");
        textWrapper.attr('aria-label', value);
        this.el.setAttribute('title', value);
      } else if (!!this.formattedValue) {
        this.el.setAttribute('aria-label', this.formattedValue);
        this.el.setAttribute('title', this.formattedValue);
      }
    },

    closePopover: function (view) {
      view = view ? view : this;
      this.popover.addClass('binf-hidden');
      this.popoverEl.binf_popover('destroy');
      if (view.categoryPopoverView) {
        view.categoryPopoverView.destroy();
      }
    },

    _handleClickEvent: function (event) {
      if (!$(event.target).closest('.binf-popover').length) {
        var view = event.data.view;
        $(document).off('mouseup.popover', this._handleClickEvent);
        view.closePopover(event.data.view);
      }
    },

    onShowOverviewFlyout: function () {
        var flyOutTarget = this.popoverEl,
        popoverContainer = flyOutTarget.parent().find(".binf-popover"),
        popoverArrowEl = popoverContainer.find('.binf-arrow'),
        popoverArrowWidth = parseInt(popoverArrowEl.css('border-top-width')),
        popoverArrowTop = parseInt(popoverArrowEl.css('top')),
        navBarHeight = $('nav.csui-navbar').length ? $('nav.csui-navbar').innerHeight() :
          $(".binf-nav").parents('nav') && $(".binf-nav").parents('nav').length ?
            $(".binf-nav").parents('nav').innerHeight() : 0,
        flyOutTopPosition;
      flyOutTopPosition = flyOutTarget.offset().top - (navBarHeight + parseInt(popoverArrowEl.css('top'))) + popoverArrowWidth / 2;
      if (flyOutTopPosition < navBarHeight) {
        flyOutTopPosition = navBarHeight;
        popoverArrowTop = flyOutTarget.offset().top - (navBarHeight + flyOutTopPosition);
      }
      var perspectivePanel = $(".cs-perspective-panel"),
        perspectivePanelClientTop = perspectivePanel.length > 0 ?
          perspectivePanel[0].getBoundingClientRect().top : 0;
      if (base.isIE11()) {
        flyOutTopPosition = flyOutTarget[0].getBoundingClientRect().top - parseInt(popoverArrowEl.css('top')) + popoverArrowWidth;
        popoverArrowTop = (flyOutTarget.offset().top - flyOutTopPosition) + (perspectivePanelClientTop - navBarHeight) + popoverArrowWidth / 2;
      }
      popoverContainer.css({
        'position': 'fixed',
        'top': flyOutTopPosition
      });
      popoverArrowEl.css('top', popoverArrowTop);
      var flyOutLeft,
        flyOutTargetLeft,
        popoverContainerLeft = parseInt(popoverContainer.css('left')),
        facetView = this.$el.parents('.csui-search-results') && this.$el.parents('.csui-search-results').find('.csui-search-left-panel');
      if (this.options.originatingView) {
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
      if (facetView.hasClass("csui-is-visible")) {
        flyOutLeft = flyOutLeft + facetView.width();
      }
        popoverContainer.css({
          'right': 'auto',
          'left': flyOutLeft
        });
    },

    getValueData: function () {
      var categoryCount, categoryNames = "";
      if (!!this.categories) {
        categoryCount = this.categories.values.length;
        this.collection = this.categories && this._createCategoryCollection();
      }
      if (this.categories && this.categories.values.length > 0) {
        this.categories.values.forEach(function (category,index) {
          if(index === categoryCount-1){
            categoryNames += category.value_formatted;
          }else{
            categoryNames += category.value_formatted + ";  ";
          }
        });
      }
      return {
        formattedValue: this.formattedValue,
        formattedValueForExpandView: categoryCount ? categoryNames : this.formattedValue,
        value: this.collection ? _.str.sformat(lang.categoryTooltip,
          this.formattedValue, this.collection.length - 1) : this.formattedValue,
        count: categoryCount && categoryCount - 1,
        collection:this.collection,
      };
    },
  }, {
    columnClassName: 'csui-table-cell-category',
    hasFixedWidth: true
  });

  cellViewRegistry.registerByColumnKey('OTDCategory', CategoryCellView);
  return CategoryCellView;
});