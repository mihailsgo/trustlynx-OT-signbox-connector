/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore',
  'csui/widgets/generic.tile/generic.tile.view',
  'csui/utils/namedlocalstorage',
  'csui/utils/contexts/factories/search.results.table.factory',
  'csui/controls/tile/behaviors/infinite.scrolling.behavior',
  'csui/behaviors/collection.error/collection.error.behavior',
  'i18n!csui/widgets/search.results.tile/impl/nls/lang',
], function (module, _, GenericTileView, NamedLocalStorage,
    SearchResultsCollectionFactory, InfiniteScrollingBehavior, CollectionErrorBehavior, lang) {
  'use strict';

  var config = _.extend({
    limit: 20
  }, module.config());
  var SearchResultsTileView = GenericTileView.extend({

    namedLocalStorage: new NamedLocalStorage('widgetOptions'),

    constructor: function SearchResultsTileView(options) {
      options || (options = {});
      options.titleBarIcon = options.data.showTitleIcon === false ?
        undefined : 'title-icon title-customviewsearch';
      options.isTileView = true;
      options.loadingText = lang.loadingText;
      options.displayName = options.data.displayName;
      options.limit = config.limit;
      options.collectionFactory = SearchResultsCollectionFactory;
      this.behaviors = _.extend({
        InfiniteScrolling: {
          behaviorClass: InfiniteScrollingBehavior,
          contentParent: ".tile-content"
        },
        CollectionError: {
          behaviorClass: CollectionErrorBehavior
        }
      }, this.behaviors);
      GenericTileView.prototype.constructor.call(this, options);
      this.bindEventListeners();
    },

    bindEventListeners: function () {
      this.listenTo(this, 'before:collection:scroll:fetch', _.bind(function () {
        this.blockActions();
      }, this));
      this.listenTo(this, 'collection:scroll:fetch', function () {
        this.scrollTop = this.$el.find(".tile-content").scrollTop();
        this.render();
      });
      this.listenTo(this, 'render', _.bind(function () {
        if (this.scrollTop) {
          this.$el.find(".tile-content").scrollTop(this.scrollTop);
        }
      }, this));

    },

    handleError: function () {
      this.errorExists = true;
      this.$el.addClass('csui-list-view-error');
      this.$el.find('.csui-message').html(this.collection.error.message);
    },

    onClickOpenPerspective: function (target) {
      var query_id          = this.options.data.savedSearchQueryId ||
                              this.options.savedSearchQueryId,
          widgetDisplayName = this.options.data.displayName || lang.dialogTitle,
          options           = this.namedLocalStorage.get(query_id) || {};
      if (!!widgetDisplayName) {
        var widgetOptions = _.extend(options, {name: widgetDisplayName});
        this.namedLocalStorage.set(query_id, widgetOptions);
      }
      this.applicationScope.set('query_id', query_id);
      this.applicationScope.set('id', 'searchresults');
      this.trigger('open:searchresults:perspective');
    }

  });

  return SearchResultsTileView;

});