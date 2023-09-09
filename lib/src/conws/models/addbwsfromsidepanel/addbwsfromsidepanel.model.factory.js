/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/utils/contexts/factories/factory',
    'conws/models/addbwsfromsidepanel/addbwsfromsidepanel.model'
], function (CollectionFactory,
             AddbwsfromsidepanelCollection) {

    var AddbwsfromsidepanelCollectionFactory = CollectionFactory.extend({

        propertyPrefix: 'addbwsfromsiedpanel',

        constructor: function AddbwsfromsidepanelCollectionFactory(options) {
            CollectionFactory.prototype.constructor.apply(this, arguments);

            var connector = this.options.connector || {};

            this.property = new AddbwsfromsidepanelCollection({connector:connector});
        }

    });

    return AddbwsfromsidepanelCollectionFactory;

});
