/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/jquery',
  'nuc/lib/marionette',
  'hbs!smart/controls/error/impl/error',
  'smart/lib/binf/js/binf',
  'css!smart/controls/error/impl/error',
], function ($, Marionette, template) {
  'use strict';

  var ErrorView = Marionette.ItemView.extend({
    className: function () {
      var className = 'csui-error content-tile csui-error-container';
      if (this.options.low) {
        className += ' csui-low';
      }
      return className;
    },

    template: template,

    modelEvents: {
      change: 'render'
    },

    ui: {
      messageArea: '.csui-message',
      iconArea: '.csui-error-icon-parent'
    },

    events: {
      "mouseenter": 'showPopover',
      "mouseleave": 'hidePopover'
    },
    constructor: function ErrorView(options) {
      options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    getPopoverEle: function () {
      return this.ui.iconArea;
    },
    canShowPopover: function () {
      return (!!this.options.model.get('title'));
    },
    onShow: function () {
      if (this.canShowPopover()) {
        var that = this;
        this.$el.closest('.csui-disabled').removeClass('csui-disabled');
        this.getPopoverEle().binf_popover({
          content: this.options.model.get('title'),
          html: true,
          placement: function () {
            var popOverSource = !!that.options.low ? that.ui.messageArea : that.ui.iconArea,
                maxWidth      = popOverSource.width(),
                maxHeight     = popOverSource.height(),
                offset        = popOverSource.offset(),
                window_left   = offset.left,
                window_top    = offset.top,
                window_right  = (($(window).width()) -
                                 (window_left + popOverSource.outerWidth(true))),
                window_bottom = (($(window).height()) -
                                 (window_top + popOverSource.outerHeight(true)));
            if (window_right > maxWidth) {
              return "right";
            } else if (window_left > maxWidth) {
              return "left";
            } else if (window_bottom > maxHeight) {
              return "bottom";
            } else {
              return "top";
            }
          }
        });
      }
    },
    showPopover: function (e) {
      if (this.canShowPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.getPopoverEle().binf_popover('show');
      }
    },
    hidePopover: function (e) {
      if (this.canShowPopover()) {
        e.preventDefault();
        e.stopPropagation();
        this.getPopoverEle().binf_popover('hide');
      }
    }

  });

  return ErrorView;

});
