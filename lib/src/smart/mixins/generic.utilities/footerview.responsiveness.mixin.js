/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/marionette',
  'nuc/lib/backbone',
  'nuc/lib/jquery',
  'smart/mixins/dropdown/dropdown.view'
], function (_, Marionette, Backbone, $, DropDownView) {
  'use strict';

  var FooterViewResponsiveMixin = {


    updateFooterView: function (view, availableWidth) {
      this.view = view;
      this.availableWidth = availableWidth || (view.$el.width());
      this._getDisplayWidth();
      var length = this.view.displayWidth.length;
      this.dropdown = new DropDownView({
        collection: new Backbone.Collection(),
      }, view);
      if (view.$el.is(":visible") && length && this.availableWidth <= this.view.displayWidth[0]) {
        this.shrink(this.availableWidth, length);
        this.view._addChildView(this.dropdown, this.view.collection.length);
      } else {
        this.expand();
      }
    },

    shrink: function (availableWidth, length) {
      var lastEle = this.view.displayWidth[0],
        filteredCollection =  this.view.completeCollection && _.filter(this.view.completeCollection.models, function (item) {
          return !item.get('hidden');
        });
      for (var i = length - 1; i >= 0; i--) {
        if (availableWidth >= (lastEle - this.view.displayWidth[i]) + 48 && filteredCollection) {
          this.dropdown.options.collection.add(filteredCollection.slice(i, length));
          this.view.collection.reset(filteredCollection.slice(0, i));
          break;
        }
      }
    },

    expand: function () {
      if (this.view && this.view.completeCollection) {
        this.view.collection.reset(this.view.completeCollection.models);
      }
      this.dropdown && this.dropdown.destroy();
    },

    _getDisplayWidth: function (flag) {
      if ((this.view.displayWidth && this.view.displayWidth.length != 0) && !this.view.flag) {
        return this.view.displayWidth;
      }
      this._calculateDisplayWidth();
      return this.view.displayWidth;
    },

    _calculateDisplayWidth: function () {
      this.view.displayWidth = [];
      var childs = this.view.el.children,
        displayWidth = 0;
      for (var i = childs.length - 1; i >= 0; i--) {
        if ($(childs[i]) && $(childs[i]).is(":visible")) {
          displayWidth += (childs[i].offsetWidth + 16);
          this.view.displayWidth.unshift(displayWidth);
        }
      }
      this.view.flag = false;
    }
  };

  return FooterViewResponsiveMixin;

});
