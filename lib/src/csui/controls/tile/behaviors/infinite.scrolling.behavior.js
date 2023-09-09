/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette'
], function (require, $, _, Marionette) {
  "use strict";

  var InfiniteScrollingBehavior = Marionette.Behavior.extend({

    defaults: {
      content: null,
      contentParent: null,
      fetchMoreItemsThreshold: 95
    },

    constructor: function ScrollingBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      var bindEvent = getOption.call(this,'bindEvent') || 'render';
      var unbindEvent = getOption.call(this,'unbindEvent') || 'before:destroy';
      this.listenTo(view, bindEvent, this._bindScrollingEvents);
      this.listenTo(view, unbindEvent, this._unbindScrollingEvents);
    },

    _bindScrollingEvents: function () {
      var contentParent = this.__contentParent = getOption.call(this, 'contentParent');
      if (this._contentParent) {
        this._contentParent.off('scroll.' + this.view.cid);
      }
      this._contentParent = contentParent ? this.view.$(contentParent) : this.view.$el;
      this._contentParent.on('scroll.' + this.view.cid, _.bind(this._checkScrollPosition, this));
    },

    _checkScrollPosition: function () {
      var content = getOption.call(this, 'content');
      this._content = content ? this.view.$(content) :
                      this.__contentParent ? this._contentParent.children().first() : this.view.$el;
      var fetchMoreItemsThreshold = getOption.call(this, 'fetchMoreItemsThreshold') || this.defaults.fetchMoreItemsThreshold;
      var contentHeight;
      if (this._content.length === 1) {
        contentHeight = this._content.outerHeight(true);
      } else {
        contentHeight = _.reduce(this._content, function (sum, el) {return sum + $(el).outerHeight(true)}, 0);
      }
      var parentHeight         = this._contentParent.height(),
          scrollTop            = this._contentParent.scrollTop(),
          scrollablePercentage;
      scrollablePercentage = (parentHeight - (contentHeight - scrollTop - parentHeight))*100/parentHeight;
      if (scrollablePercentage >= fetchMoreItemsThreshold) {
        this._checkScrollPositionFetch();
      }
    },

    _checkScrollPositionFetch: function () {
      var collection = this.view.collection;
      if (collection.length < collection.totalCount && !collection.fetching &&
          collection.skipCount < collection.length) {
        if (this.fetching) {
          return;
        }
        this.fetching = true;
        var self = this;
        this.view.trigger('before:collection:scroll:fetch');
        collection.setSkip(collection.length, false);
        collection.fetch({
          reset: false,
          remove: false,
          merge: false,
          success: function () {
            delete self.fetching;
            self.view.trigger('collection:scroll:fetch');
          },
          error: function() {
            delete self.fetching;
            self.view.trigger('collection:scroll:fetch:error');
          }
        });
      }
    },

    _unbindScrollingEvents: function () {
      if (this._contentParent) {
        this._contentParent.off('scroll.' + this.view.cid);
      }
    }

  });
  function getOption(property) {
    var options = this.options || {};
    var value = options[property];
    return _.isFunction(value) ? value.call(this.view) : value;
  }

  return InfiniteScrollingBehavior;

});
