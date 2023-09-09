/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/backbone',
    'csui/utils/contexts/factories/factory', 
    'xecmpf/widgets/fileupload/impl/factory/fileupload.collection.factory',
], function (module, _, Backbone, CollectionFactory, FileUploadCollectionFactory) {

    "use strict";

    var ColumnsCollectionFactory = CollectionFactory.extend({

        propertyPrefix: 'fileupload_columns',

        constructor: function ColumnsCollectionFactory(context, options) {
            CollectionFactory.prototype.constructor.apply(this, arguments);

            var columns = this.options.columns || {};
            if (!(columns instanceof Backbone.Collection)) {
                var children = context.getCollection(FileUploadCollectionFactory, options);
                columns = children.columns;
            }
            this.property = columns;
        }

    });

    return ColumnsCollectionFactory;

});
