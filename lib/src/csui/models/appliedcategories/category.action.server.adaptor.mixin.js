/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url', 'csui/models/version'
], function ($, _, Url, VersionModel) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          return Url.combine(this.node.urlBase(), this.options.urlResource);
        },

        parse: function () {
          if (this.node instanceof VersionModel) {
            return {};
          }
          if (this.node.get("id") === undefined || this.options.action) {
            return {categories_add: "dummy value"};
          }
          return this.constructor.__super__.parse.apply(this, arguments);
        }
      });
    }
  };


  return ServerAdaptorMixin;
});
