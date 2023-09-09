/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
    'csui/models/mixins/node.resource/node.resource.mixin'
], function (_, Backbone, Url, NodeResourceMixin) {
  'use strict';

  var HelloTemplateModel = Backbone.Model.extend({

    constructor: function HelloTemplateModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    
    parse: function (response, options) {
      return response.data.properties;
    }

  });

  var HelloTemplateCollection = Backbone.Collection.extend({

    model: HelloTemplateModel,

    constructor: function HelloTemplateCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeNodeResource(options);
    },

    isFetchable: function () {
      return this.node.isFetchable();
    },

    url: function () {
      var url = this.node.urlBase().replace('/v1/', '/v2/');
      return Url.combine(url, '/hellotemplates');
    },

    parse: function (response, options) {
      return response.results;
    }

  });

  NodeResourceMixin.mixin(HelloTemplateCollection.prototype);

  return HelloTemplateCollection;

});
