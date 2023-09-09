/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'csui-ext!csui/utils/commands/preview.plugins/preview.plugins'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var PreviewPluginModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      plugin: null
    },

    constructor: function OpenPluginModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(PreviewPluginModel.prototype);

  var PreviewPluginCollection = Backbone.Collection.extend({
    model: PreviewPluginModel,
    comparator: 'sequence',

    constructor: function PreviewPluginCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    findByNode: function (node, options) {
      var rule = this.find(function (item) {
        return item.matchRules(node, item.attributes, options);
      });
      return rule && rule.get('plugin');
    }
  });

  var previewPlugins = new PreviewPluginCollection();

  if (rules) {
    previewPlugins.add(_
      .chain(rules)
      .flatten(true)
      .map(function (rule) {
        return _.defaults({
          plugin: new rule.plugin()
        }, rule);
      })
      .value());
  }

  return previewPlugins;
});
