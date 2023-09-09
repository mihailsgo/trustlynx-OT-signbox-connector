/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'hbs!csui/widgets/search.slices/impl/search.slices'
], function (_, $, Marionette, SearchSlicesTemplate) {
  'use strict';
  var SearchSlicesItemView = Marionette.View.extend({
    className: 'csui-search-popover-row',
    template: SearchSlicesTemplate,
    attributes: function () {
      return {
        id: this.model.get('sliceId'),
        title: this.model.get('sliceTooltip'),
        'aria-label': this.model.get('sliceDisplayName'),
        tabindex: "-1",
      };
    },

    templateContext: function () {
      var sliceDisplayName = this.model && this.model.get('sliceDisplayName'),
        sliceId = this.model && this.model.get('sliceId');
      return {
        sliceDisplayName: sliceDisplayName,
        sliceId: sliceId
      };
    },

    events: {
      'click .csui-search-popover-row-body': 'setSlices',
      'keydown .csui-search-popover-row-body': 'accessibility',
      'keyup .csui-search-popover-row-body': 'keyUpHandler',
    },

    constructor: function SearchSlicesItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
    },

    setSlices: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var sliceId = this.model.get('sliceId'),
        _currentEleChecked = this.$el.find('.icon-listview-checkmark').length;
      this.options.originatingView.options.sliceString = "";
      this.options.parentView.removePreviousSelection();
      if (!_currentEleChecked) {
        this.$el.find('.csui-search-popover-checked').addClass("icon-listview-checkmark");
        this.options.originatingView.options.sliceString = "{" + sliceId + "}";
        this.$el.find('.csui-slice-option').prop("checked", true);
      }
      else{
        this.$el.find('.csui-slice-option').prop("checked", false);
      }
      this.options.originatingView.namedLocalStorage.set('selectedSlice',  this.options.originatingView.options.sliceString);
      this.options.originatingView.options.model.attributes.slice = this.options.originatingView.options.sliceString;
    },

    accessibility: function (event) {
      switch (event.keyCode) {
        case 9:
          if (event.shiftKey) {
            if (this.options.originatingView.$el.find('.csui-selected-checkbox').length) {
              this.options.originatingView.$el.find('.csui-selected-checkbox').addClass('active');
              this.options.originatingView.$el.find('.csui-selected-checkbox input[type="checkbox"]')[0].focus();
            }
            else {
              this.options.originatingView.ui.input[0].focus();
            }
          } else {
            if (this.options.originatingView.$el.find('.csui-slices-more').hasClass('binf-hidden') || !this.options.originatingView.$el.find('.csui-slices-more').length) {
              if (this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-popover-row').length) {
                this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-popover-row')[0].focus();
              }
              else {
                $(this.options.originatingView.searchFormsContainerView.$el.find('.csui-searchforms-show-more')[0]).focus();
              }
            } else {
              this.options.originatingView.$el.find('.csui-slices-more')[0].focus();
            }
          }
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          break;
        case 38:
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          if (this.$el.prev().length) {
            this.$el.prev().find('.csui-search-popover-row-body').addClass('active');
            this.$el.prev().find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          } else {
            var el = this.options.parentView.$el.find('.csui-search-popover-row-body');
            $(el[el.length - 1]).addClass('active');
            $(el[el.length - 1]).find('input[type="radio"]')[0].focus();
          }
          break;
        case 40:
          this.$el.find('.csui-search-popover-row-body').removeClass('active');
          if (this.$el.next().length) {
            this.$el.next().find('.csui-search-popover-row-body').addClass('active');
            this.$el.next().find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          } else {
            $(this.options.parentView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
            $(this.options.parentView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
          }
          break;
        case 32:
          this.setSlices(event);
          this.$el.find('.csui-search-popover-row-body').addClass('active');
          this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          break;
        case 27:
          this.$el.removeClass('active');
          if (this.options.originatingView.options.data.showOptionsDropDown) {
            this.options.originatingView.hideSearchOptionsDropDown();
          }
          break;
        case 13:
          this.setSlices(event);
          this.$el.find('.csui-search-popover-row-body').addClass('active');
          this.$el.find('.csui-search-popover-row-body input[type="radio"]')[0].focus();
          break;
      }
      event.preventDefault();
    },
     keyUpHandler: function (event) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (event.keyCode == 32 && isFirefox) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
  });
  return SearchSlicesItemView;
});