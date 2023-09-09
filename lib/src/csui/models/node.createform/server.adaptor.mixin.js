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
          var path = 'forms/nodes/create',
              params = {
                parent_id: this.docParentId ? this.docParentId : this.node.get("id"),
                type: this.type
              },
              resource = path + '?' + $.param(params);
          return Url.combine(this.node.connector.connection.url, resource);
        },

        parse: function (response) {
          var forms = response.forms;
          _.each(forms, function (form) {
            form.id = form.schema.title;
          });
          forms && forms.length && (forms[0].id = "general");

          return forms;
        }

      });
    }
  };


  return ServerAdaptorMixin;
});
