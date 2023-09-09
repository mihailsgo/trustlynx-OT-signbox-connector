/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
    'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
    'csui/utils/contexts/factories/node',
    'xecmpf/widgets/fileupload/impl/models/fileupload.detail.model'
], function (module, _, $, Backbone, CollectionFactory, ConnectorFactory,
    NodeModelFactory, FileUploadCollection) {
    'use strict';

    var FileUploadCollectionFactory = CollectionFactory.extend({

        propertyPrefix: 'fileupload',

        constructor: function FileUploadCollectionFactory(context, options) {
            CollectionFactory.prototype.constructor.apply(this, arguments);

            var wsid = context.options.wsid;
            var fileupload = this.options.fileupload || {};
            if (!(fileupload instanceof Backbone.Collection)) {
                var connector = context.getObject(ConnectorFactory, options),
                    node = context.getModel(NodeModelFactory, options),
                    config = module.config();                   
                fileupload = new FileUploadCollection(fileupload.models, _.extend({
                    node: node,
                    connector: connector
                }, options, config.options,
                    { autoreset: true, status: status,wsid: context.wsid}));
            }

            this.property = fileupload;
        },

        fetch: function (options) {
            return this.property.fetch(options);
        }

    });

    return FileUploadCollectionFactory;

});