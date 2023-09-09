/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/marionette',
'csui/controls/table/cells/search/category/category.popover.item.view',
 'csui/controls/tile/behaviors/perfect.scrolling.behavior',
'hbs!csui/controls/table/cells/search/category/impl/category.list'
], function (_, Marionette, CategoryPopverItemView,PerfectScrollingBehavior,template) {
  'use strict';
  var CategoryPopverView = Marionette.CompositeView.extend({
    className: 'csui-category-collection',
    template: template,
    childViewContainer: '.csui-category-list',
    childView: CategoryPopverItemView,

    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this,
      };
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: 'ul.csui-category-list',
        suppressScrollX: true
      }
    },

    constructor: function CategoryPopverView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },
  });
  return CategoryPopverView;
});