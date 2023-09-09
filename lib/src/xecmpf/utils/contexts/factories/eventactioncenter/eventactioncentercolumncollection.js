/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/nodechildrencolumn', 'csui/models/nodechildrencolumns',
  'i18n!xecmpf/utils/commands/nls/localized.strings'
], function (_, Backbone, NodeChildrenColumnModel, NodeChildrenColumnCollection, lang) {

  var EventActionCenterColumnModel = NodeChildrenColumnModel.extend({

    constructor: function EventActionCenterColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = attributes.column_key;
        attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }

  });

  var EventActionCenterColumnCollection = NodeChildrenColumnCollection.extend({

    model: EventActionCenterColumnModel,

    constructor: function EventActionCenterColumnCollection(models, options) {
      if (!models) {
        models = [

          {
            key: 'system_name',
            contextual_menu: false,
            name: lang.system_name
          },
          {
            key: 'name',
            align: 'left',
            title: lang.Event,
          },
          {
            key: 'action_plan_text',
            name: lang.ActionPlans,
            isNaming: true
          }
        ];
        models.forEach(function (column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      NodeChildrenColumnCollection.prototype.constructor.call(this, models, options);

    }

  });

  return EventActionCenterColumnCollection;

});