csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/favorites/favorite.star.view',
  'css!conws/widgets/header/impl/favorite.icon'
], function (_, $, Marionette, TabableRegionBehavior, FavoriteStarView) {

  'use strict';

  var FavoriteIconView = FavoriteStarView.extend({

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function FavoriteIconView(options) {
      FavoriteStarView.prototype.constructor.call(this, options);
    },

    // Needed for keyboard accessibility by TabableRegionBehavior
    currentlyFocusedElement: function () {
      // get favorite icon button tag
      return this.$('.csui-favorite-star.csui-acc-focusable')
    },

    // We must override this to avoid that e.g. in case of press enter the browser navigates
    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space or enter key
        event.preventDefault();
        event.stopPropagation();
        this.enabled() && this.toggleFavorite();
      }
    }
  });

  return FavoriteIconView;

});