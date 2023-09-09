/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/models/mixins/connectable/connectable.mixin',
    'csui/utils/url'
], function (_, Backbone, ConnectableMixin, Url) {

    var OutdatedDocumentModel = Backbone.Model.extend({

        idAttribute: 'id',

        constructor: function OutdatedDocumentModel(attributes, options) {
            options || (options = {});
            Backbone.Model.prototype.constructor.apply(this, arguments);
            this.makeConnectable(options);
        },

        parse: function (response) {
            return response;
        }

    });
    ConnectableMixin.mixin(OutdatedDocumentModel.prototype);

    var OutdatedDocumentCollection = Backbone.Collection.extend({

        model: OutdatedDocumentModel,

        constructor: function OutdatedDocumentCollection(models, options) {
            this.options = options || {};
            Backbone.Collection.prototype.constructor.apply(this, arguments);
            this.makeConnectable(options);
        },

        url: function () {
            var wrkspceId = this.options.node.get('id');
            return Url.combine(new Url(this.connector.connection.url).getApiBase('v2'),
                '/businessworkspaces/' + wrkspceId + '/outdateddocuments');
        },

        parse: function (response) {
            return response.results.data;
        },

        fetch: function () {
            return Backbone.Collection.prototype.fetch.apply(this, arguments);
        }
    });

    ConnectableMixin.mixin(OutdatedDocumentCollection.prototype);

    return OutdatedDocumentCollection;

});