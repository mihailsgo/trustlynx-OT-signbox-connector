/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/backbone',
    'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
    'xecmpf/utils/table/inlineforms/eventactioncenter/factories/eventfeedmodel', 'csui/utils/commands',
], function (module, _, Backbone, ModelFactory, ConnectorFactory,
             EventFeedModel, commands ) {
    'use strict';

    var EventCollectionFactory = ModelFactory.extend({

        propertyPrefix: 'eventfeed',

        constructor: function EventCollectionFactory(context, options) {
            ModelFactory.prototype.constructor.apply(this, arguments);

            var eventfeed = this.options.eventfeed || {};
            if (!(eventfeed instanceof Backbone.Model)) {
                var connector = context.getObject(ConnectorFactory, options);
                   
                eventfeed = new EventFeedModel(eventfeed.models, _.extend(
                    {connector: connector},
                    eventfeed.options,
                    {autoreset: true}));
            }
            this.property = eventfeed;
            this.property.fetched = false;
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

    return EventCollectionFactory;

});
