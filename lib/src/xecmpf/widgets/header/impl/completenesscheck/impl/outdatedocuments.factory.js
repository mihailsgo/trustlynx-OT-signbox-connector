/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/utils/contexts/factories/factory',
    'csui/utils/contexts/factories/connector',
    'csui/utils/contexts/factories/node',
    'xecmpf/widgets/header/impl/completenesscheck/impl/models/outdatedocuments.model'
], function (module, _, Backbone,
    CollectionFactory,
    ConnectorFactory,
    NodeFactory,
    OutdateDocumentsCollection) {
    var OutdateDocumentsFactory = CollectionFactory.extend({
        propertyPrefix: 'outdateDocumentsCollection',
        constructor: function OutdateDocumentsFactory(context, options) {
            CollectionFactory.prototype.constructor.apply(this, arguments);
            var outdatedDocumentsCollection = this.options.outdatedDocumentsCollection || {};
            if (!(outdatedDocumentsCollection instanceof Backbone.Collection)) {
                var connector = context.getObject(ConnectorFactory, options),
                    node = context.getModel(NodeFactory, options),
                    config = module.config();
                outdatedDocumentsCollection = new OutdateDocumentsCollection(outdatedDocumentsCollection.models, _.extend(
                    {
                        connector: connector,
                        node: node,
                        reportType: 'outdatedDocuments'
                    }, outdatedDocumentsCollection.options, config.options, {
                    autofetch: true
                }));
            }
            this.property = outdatedDocumentsCollection;
        },
        fetch: function (options) {
            return this.property.fetch(options);
        }
    });
    return OutdateDocumentsFactory;
});