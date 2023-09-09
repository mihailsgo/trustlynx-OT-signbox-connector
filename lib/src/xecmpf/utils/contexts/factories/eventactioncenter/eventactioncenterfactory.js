/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'xecmpf/utils/contexts/factories/eventactioncenter/eventactioncentercollection',
  'csui/utils/commands',
], function (module, _, Backbone, ModelFactory, ConnectorFactory,
    EventActionCenterCollection, commands) {
  'use strict';

  var EventActionCenterFactory = ModelFactory.extend({

    propertyPrefix: 'eventactioncenterfeed',

    constructor: function NotificationCollectionFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var eventactioncenterfeed = this.options.eventactioncenterfeed || {};
      if (!(eventactioncenterfeed instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options);

        eventactioncenterfeed = new EventActionCenterCollection(eventactioncenterfeed.models, _.extend(
            {connector: connector},
            eventactioncenterfeed.options,
            {autoreset: true}));
      }
      this.property = eventactioncenterfeed;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  }, {

    getDefaultResourceScope: function () {
      return _.deepClone({
        stateEnabled: true,
        commands: commands.getAllSignatures()
      });
    }

  });

  return EventActionCenterFactory;

});
