/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'xecmpf/models/eac/eac.planproperties.model'
], function (_, Backbone,
  CollectionFactory, ConnectorFactory,
  EACPlanPropertiesCollection) {
    var EACPlanPropertiesFactory = CollectionFactory.extend({
      propertyPrefix: 'EACPlanPropertiesCollection',
      constructor: function EACPlanPropertiesFactory(context, options) {
        CollectionFactory.prototype.constructor.apply(this, arguments);
        var eacCollection = this.options.EACPlanPropertiesCollection || {};
        if (!(eacCollection instanceof Backbone.Collection)) {
          var event_definition_id;
          if(!!options.eventModel){
            event_definition_id = !!options.eventModel.get('event_def_id') ? options.eventModel.get('event_def_id') : options.eventModel.get('id');
          } else {
            event_definition_id = !!options.eventModel.get('event_def_id') ? options.eventModel.attributes.event_def_id : options.eventModel.attributes.id;
          }
          eacCollection = new EACPlanPropertiesCollection(eacCollection.models, _.extend({
            connector: context.getModel(ConnectorFactory),
            query: {
              event_definition_id: event_definition_id
            },
            autofetch: true
          }, eacCollection.options));
        }
        this.property = eacCollection;
      },
      fetch: function (options) {
        return this.property.fetch(options);
      }
    });
    return EACPlanPropertiesFactory;
  });