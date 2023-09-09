/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'csui-ext!csui/inlineform/inlineform.schemas'
], function (_, Backbone, RulesMatchingMixin, externalFormSchemas) {
  'use strict';

  var InlineFormSchemaModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      form: null
    },

    constructor: function InlineFormSchemaModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(InlineFormSchemaModel.prototype);

  var InlineFormSchemaCollection = Backbone.Collection.extend({
    model: InlineFormSchemaModel,

    comparator: 'sequence',

    constructor: function NodeSpriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    findByNode: function (node) {
      return this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
    },

    getFormFieldsSchema: function (options) {
      var node = this.findByNode(options.node);
      return node;
    }
  });

  var inlineFormSchemas = new InlineFormSchemaCollection();

  if (externalFormSchemas) {
    inlineFormSchemas.add(_.flatten(externalFormSchemas, true));
  }

  return inlineFormSchemas;
});
  