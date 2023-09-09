/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'csui/models/objecttypesmodel'
], function (_, CollectionFactory, ConnectorFactory, ObjectTypesModel) {
  'use strict';

  var ObjectTypesFactory = CollectionFactory.extend({
    propertyPrefix: 'objecttypes',

    constructor: function ObjectTypesFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var objectTypes = this.options.objectTypes || {},
       connector = context.getObject(ConnectorFactory, options);
      objectTypes = new ObjectTypesModel(objectTypes.attributes,
        _.defaults({
          connector: connector
        }, objectTypes.options, {
          autofetch: true,
        }));
      this.property = objectTypes;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });

  return ObjectTypesFactory;
});
