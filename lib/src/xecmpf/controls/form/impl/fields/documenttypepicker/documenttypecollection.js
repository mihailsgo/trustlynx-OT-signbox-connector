/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'xecmpf/controls/form/impl/fields/documenttypepicker/server.adaptor.mixin'
], function (_, $, Backbone, ConnectableMixin, FetchableMixin, ServerAdaptorMixin
) {

  var DocumentTypeModel = Backbone.Model.extend({
    idAttribute: 'classification_id',
    parse: function (response, options) {
      response.data.properties.name = response.data.properties.classification_name;
      return response.data.properties;
    }
  });

  var DocumentTypeCollection = Backbone.Collection.extend({

    model: DocumentTypeModel,

    constructor: function DocumentTypeCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeServerAdaptor(options);
    }

  });

  ConnectableMixin.mixin(DocumentTypeCollection.prototype);
  FetchableMixin.mixin(DocumentTypeCollection.prototype);
  ServerAdaptorMixin.mixin(DocumentTypeCollection.prototype);

  return DocumentTypeCollection;

});