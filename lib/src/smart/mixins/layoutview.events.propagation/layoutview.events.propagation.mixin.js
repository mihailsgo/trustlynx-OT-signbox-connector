/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/marionette'
], function (_, Marionette) {
  'use strict';

  var LayoutViewEventsPropagationMixin = {

    propagateEventsToRegions: function () {
      _.each(this._eventsToPropagateToRegions,
          _.bind(this._propagateEventToRegions, this));
    },

    _propagateEventToRegions: function (name) {
      this.listenTo(this, name, function () {
        var regions;
        if (this.regionManager) {
          regions = this.regionManager.getRegions();
        } else {
          regions = this.getRegions();
        }

        _.each(regions, function (region) {
          var view = region.currentView;
          if (view && (view._isShown || view._isAttached) && view._isRendered &&
              Marionette.isNodeAttached(view.el)) {
            var parameters = Array.prototype.slice.call(arguments);
            parameters.unshift(region.currentView, name);
            Marionette.triggerMethodOn.apply(Marionette, parameters);
          }
        }, this);
      });
    },
    mixin: function (prototype) {
      _.extend(prototype, {
        propagateEventsToRegions: this.propagateEventsToRegions,
        _propagateEventToRegions: this._propagateEventToRegions,
        _eventsToPropagateToRegions: this._eventsToPropagateToRegions
      });
    },
    _eventsToPropagateToRegions: ['dom:refresh']

  };

  return LayoutViewEventsPropagationMixin;

});
