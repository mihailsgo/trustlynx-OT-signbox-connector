/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/models/mixins/rules.matching/rules.matching.mixin'
], function (_, Backbone, RulesMatchingMixin) {
  'use strict';

  var ActionItemModel = Backbone.Model.extend({

    idAttribute: null,

    defaults: {
      sequence: 100,
      signature: null
    },

    constructor: function ActionItemModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    },

    enabled: function (node) {
      var type = this.get('type');
      if (type !== undefined) {
        return type == node.get('type');
      }
      return this.matchRules(node, this.attributes);
    }

  });

  RulesMatchingMixin.mixin(ActionItemModel.prototype);

  return ActionItemModel;

});
