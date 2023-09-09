/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module",
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/lib/marionette",
  "hbs!csui/controls/facet.bar/impl/facet.bar.item"
], function (module, $, _, Marionette, template) {

  var FacetBarItemView = Marionette.ItemView.extend({

    className: 'csui-facet-item',

    tagName: 'li',

    template: template,

    ui: {
      'item': '.csui-facet-item',
      'content': '.csui-facet-item-content'
    },

    events: {
      'click @ui.item': 'cancelClick',
      'click @ui.content': 'cancelClick'
    },

    templateHelpers: function () {
      return {
        enableCloseIcon : this.enableCloseIcon
      };
    },

    constructor: function FacetBarItemView(options) {
      this.options = options || {};
      this.enableCloseIcon = this.options.model && this.options.model.get('readOnlyFilter') ? false : true;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    cancelClick: function (event) {
      if (!$(event.target).hasClass('binf-close')) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  return FacetBarItemView;
});
