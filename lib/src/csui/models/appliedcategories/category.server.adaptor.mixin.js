/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url'
], function ($, _, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var id = this.id, url;
          if (id) {
            url = Url.combine(this.node.urlBase(), 'categories', id);
          } else {
            url = Url.combine(this.node.urlBase(), 'categories');
          }
          return url;
        },

        parse: function (response, options) {
          return this.sortInitially(response.data);
        },

        sortInitially: function (data) {
          return _.isArray(data) ? _.sortBy(data, function (ele) {return ele.name.toLowerCase()}) :
                 data;
        }
      });
    }
  };


  return ServerAdaptorMixin;
});
