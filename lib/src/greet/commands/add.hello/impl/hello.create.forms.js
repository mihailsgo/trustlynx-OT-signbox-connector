/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/url', 'csui/models/form',
  'csui/models/mixins/node.resource/node.resource.mixin'
], function (_, $, Backbone, Url, FormModel, NodeResourceMixin) {
  'use strict';

  var HelloCreateFormCollection = Backbone.Collection.extend({

    model: FormModel,

    constructor: function HelloCreateFormCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeNodeResource(options);
      this.template = options.template;
    },

    url: function () {
      var query = {
        parent_id: this.node.get('id'),
        template_id: this.template.get('id')
      };
      return Url.combine(this.node.connector.connection.url,
          'forms/hello/create?') + $.param(query);
    },
  
    parse: function (response, options) {
      return response.forms;
    }

  });

  NodeResourceMixin.mixin(HelloCreateFormCollection.prototype);

  return HelloCreateFormCollection;

});
