csui.define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone'
], function ($, _, Backbone) {

  var FilterModel = Backbone.Model.extend({

    defaults: {
      // the filter header control caption
      caption: '',
      // the tooltip for the filter control
      tooltip: '',
      // the filter value
      filter: '',
      // defines whether the filter elements are active or not
      active: true,
      // defines whether the search box is visible or not
      showSearch: false
    },

    constructor: function FilterModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });

  // return the model
  return FilterModel;

});

