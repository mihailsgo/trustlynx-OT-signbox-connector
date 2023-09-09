/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'hbs!csui/controls/table/cells/search/category/impl/category.item'
], function (_, $, Marionette, template) {
  'use strict';
  var CategoryPopverItemView = Marionette.ItemView.extend({
    className: 'csui-category-item',
    tagName: 'li',
    template: template,
    templateHelpers: function () {
      return {
        value: this.model && this.model.has('value_formatted') && this.model.get('value_formatted')
      };
    },

    attributes: {
      role: 'none',
    },

    events: {
      'keydown .csui-category-value': 'accessibility',
    },

    constructor: function CategoryPopverItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    accessibility: function (event) {
      var el;
      event.preventDefault();
      event.stopPropagation();
      this.$el.find('.csui-category-value').prop('tabindex', -1);
      switch (event.keyCode) {
        case 38:
          if (this.$el.prev().length) {
            this.$el.prev().find('.csui-category-value').prop('tabindex', 0).trigger('focus');
          } else {
            el = this.options.parentView.$el.find('.csui-category-value');
            $(el[el.length - 1]).prop('tabindex', 0).trigger('focus');
          }
          break;
        case 40:
          if (this.$el.next().length) {
            this.$el.next().find('.csui-category-value').prop('tabindex', 0).trigger('focus');
          } else {
            el = this.options.parentView.$el.find('.csui-category-value');
            $(el[0]).prop('tabindex', 0).trigger('focus');
          }
          break;
        case 27:
          var searchMetadata = this.options.originatingView.popoverEl.closest('.csui-search-metadata-value');
          searchMetadata.length ? searchMetadata.trigger('focus') : this.options.originatingView.$el.trigger('focus');
          this.options.originatingView.closePopover();
          break;
      }
    },
  });
  return CategoryPopverItemView;
});
