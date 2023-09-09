/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/backbone',
  'csui/utils/url'
], function (Backbone, Url) {

  var HelloModel = Backbone.Model.extend({
    defaults: {
      name: 'Unnamed'
    },
    constructor: function HelloModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      if (options && options.connector) {
        options.connector.assignTo(this);
      }
    },
    url: function () {
      return Url.combine(this.connector.connection.url, '/auth');
    },
    parse: function (response) {
      return response.data;
    }

  });

  return HelloModel;

});
