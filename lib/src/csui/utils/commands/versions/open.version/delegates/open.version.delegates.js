/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore', 'csui/lib/backbone',
    'csui/models/mixins/rules.matching/rules.matching.mixin',
    'csui-ext!csui/utils/commands/versions/open.version/delegates/open.version.delegates'
  ], function (_, Backbone, RulesMatchingMixin, rules) {
    'use strict';

    var OpenVersionDelegateModel = Backbone.Model.extend({
      defaults: {
        sequence: 100,
        command: null
      },

      constructor: function OpenVersionDelegateModel(attributes, options) {
        Backbone.Model.prototype.constructor.apply(this, arguments);
        this.makeRulesMatching(options);
      },

      enabled: function (node, status, options) {
        var context = status.context || options && options.context;
        var matchOptions = { context: context };
        return this.matchRules(node, this.attributes, matchOptions) &&
          this.get('command').enabled(status, options);
      }
    });

    RulesMatchingMixin.mixin(OpenVersionDelegateModel.prototype);

    var OpenVersionDelegateCollection = Backbone.Collection.extend({
      model: OpenVersionDelegateModel,
      comparator: 'sequence',

      constructor: function OpenVersionDelegateCollection(models, options) {
        Backbone.Collection.prototype.constructor.call(this, models, options);
      },

      findByNode: function (node, status, options) {
        var rule = this.find(function (rule) {
          return rule.enabled(node, status, options);
        });
        return rule && rule.get('command');
      }
    });

    var openVersionDelegates = new OpenVersionDelegateCollection();

    if (rules) {
      openVersionDelegates.add(_
        .chain(rules)
        .flatten(rules)
        .map(function (rule) {
          return _.defaults({
            command: new rule.command()
          }, rule);
        })
        .value());
    }

    return openVersionDelegates;
  });
