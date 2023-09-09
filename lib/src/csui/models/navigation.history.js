/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module','csui/lib/underscore', 'csui/lib/backbone', 'csui/models/view.state.model'
], function (module, _, Backbone, viewStateModel) {
  'use strict';


  var NavigationHistory = Backbone.History.extend({
    constructor: function NavigationHistory(options) {
      Backbone.History.prototype.constructor.apply(this, arguments);

      var config = _.extend({
        urlCanChange: true
      }, module.config());

      this.urlCanChange = config.urlCanChange;
    },

    is: 'CSUINavigationHistory',

    checkUrl: function(e) {
      if (this.urlCanChange) {
        Backbone.History.prototype.checkUrl.call(this, e);
      }
    },

    _updateHash: function (location, fragment, replace) {
      if (this.urlCanChange) {
        Backbone.History.prototype._updateHash.call(this, location, fragment, replace);
      }
    },

    matchRoot: function () {
      if (this.urlCanChange) {
        return Backbone.History.prototype.matchRoot.call(this);
      }
      return true;
    }

  });

  var history = new NavigationHistory();
  Backbone.history = history;
  return history;
});
