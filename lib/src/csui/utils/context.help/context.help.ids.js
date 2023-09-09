/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'csui-ext!csui/utils/context.help/context.help.ids'
], function (_, Backbone, RulesMatchingMixin, extraHelpIds) {

  var ContextHelpIdModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      important: false,
      module: null
    },

    constructor: function ContextHelpIdModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(ContextHelpIdModel.prototype);

  var ContextHelpIdCollection = Backbone.Collection.extend({

    model: ContextHelpIdModel,
    comparator: "sequence",

    constructor: function ContextHelpIdCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByApplicationScope: function (options) {
      return this.find(function (item) {
        return item.matchRules(options, item.attributes);
      });
    }

  });

  var helpIds = new ContextHelpIdCollection([
    { // versions page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel && options.context.viewStateModel.get('state').dropdown === 'versions';
      },
      contextHelpId: 'qs-versionpg-bg'
    },
    { // audit page : properties dropdown
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'properties' &&
        options.context.viewStateModel && options.context.viewStateModel.get('state').dropdown === 'audit';
      },
      contextHelpId: 'qs-audithistory-bg'
    },
    { // Collection
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 298;
      },
      contextHelpId: 'qs-addtocollection-bg'
    },
    { // Compound documents
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 136;
      },
      contextHelpId: 'compound-documents-so' 
    },
    { // email folder
      sequence: 50,
      decides: function (options) {
        return options.context.getModel('applicationScope').id === 'node' &&
          options.context.getModel('node').get('type') === 751;
      },
      contextHelpId: 'qs-itemtypes-bg' 
    },
    { // permissions dialog
      sequence: 50,
      decides: function (options) {
        return options.context.viewStateModel.get('session_state') && options.context.viewStateModel.get('session_state').permissions;
      },
      contextHelpId: 'qs-permissions-bg'
    }
  ]);

  if (extraHelpIds) {
    helpIds.add(_.flatten(extraHelpIds, true));
  }

  return helpIds;

});
