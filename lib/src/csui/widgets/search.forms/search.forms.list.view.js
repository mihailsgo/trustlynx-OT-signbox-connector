/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/marionette3',
  'csui/widgets/search.forms/search.forms.item.view',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (_, Marionette, SearchFormsItemView) {
  'use strict';
  var SearchFormsListView = Marionette.CollectionView.extend({
    className: 'csui-search-form-list',
    childView: SearchFormsItemView,
    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this,
      };
    },
    constructor: function SearchFormsListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
  });
  return SearchFormsListView;
});