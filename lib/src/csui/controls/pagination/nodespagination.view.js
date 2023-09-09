/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'smart/controls/pagination/nodespagination.view'
], function (_, TabableRegionBehavior, SmartPaginationView) {
  var NodesPaginationView = SmartPaginationView.extend({
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function NodesPaginationView(options) {
      if (options.collection) {
        this.listenTo(options.collection, 'collection:set:limit',
            _.bind(this.collectionReset, this));
        if (options.collection.node) {
          this.listenTo(options.collection.node, 'change:id', this.onChangeId);
        }
      }
      SmartPaginationView.prototype.constructor.call(this, options);
    },
    collectionReset: function (resetObj) {
      this.collection.setLimit(resetObj.skipItems, resetObj.pageSize, resetObj.autoFetch,
          resetObj.paginationView);
    },

    onChangeId: function () {
      this.trigger('reset:attributes');
      if (this.options.setPageInfoFromViewState) {
        this.options.setPageInfoFromViewState();
      } else {
        this.resetCollection(0, this.pageSize, false);
      }
    }

  });

  return NodesPaginationView;
});