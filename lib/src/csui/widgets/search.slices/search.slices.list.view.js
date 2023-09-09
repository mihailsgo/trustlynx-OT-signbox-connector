/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'csui/widgets/search.slices/search.slices.item.view'
], function (_, $, Marionette, SearchSlicesItemView) {
  'use strict';
  var SearchSlicesListView = Marionette.CollectionView.extend({
    className: 'csui-search-slice-container',
    childView: SearchSlicesItemView,
    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this
      };
    },

    constructor: function SearchSlicesListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },

    removePreviousSelection: function () {
      var _checkedEle = this.$el.find(".csui-search-popover-checked");
      $(_checkedEle).removeClass("icon-listview-checkmark");
     this.$el.find('.active').removeClass('active');
      return;
    },

    getSelectedSlice: function () {
      if (!this.options.originatingView.options.sliceString && this.options.originatingView.options.model && this.options.originatingView.options.model.get("slice")) {
        this.options.originatingView.options.sliceString = this.options.originatingView.options.model.get("slice");
      }
      this.$el.find(".csui-search-popover-checked").removeClass('icon-listview-checkmark');
      this._setSliceValue(this.options.originatingView.options.sliceString);
    },

    _setSliceValue: function (sliceVal) {
      sliceVal = sliceVal ? sliceVal : this.options.originatingView.namedLocalStorage.get('selectedSlice');
      if (!!sliceVal && sliceVal !== "{}") {
        this.$el.find("#" + sliceVal.substring(1, sliceVal.length - 1)).find('.csui-search-popover-checked').addClass(
          "icon-listview-checkmark");
        this.$el.find("#" + sliceVal.substring(1, sliceVal.length - 1)).find('.csui-slice-option').prop('checked', true);
      }
    },
  });
  return SearchSlicesListView;
});