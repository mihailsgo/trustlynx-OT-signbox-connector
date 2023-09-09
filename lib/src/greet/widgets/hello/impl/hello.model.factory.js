/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/contexts/factories/factory',   // Factory base to inherit from
  'csui/utils/contexts/factories/connector', // Factory for the server connector
  'greet/widgets/hello/impl/hello.model'     // Model to create the factory for
], function (ModelFactory, ConnectorFactory, HelloModel) {

  var HelloModelFactory = ModelFactory.extend({
    propertyPrefix: 'hello',

    constructor: function HelloModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);
      var connector = context.getObject(ConnectorFactory, options);
      this.property = new HelloModel(undefined, {
        connector: connector
      });
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return HelloModelFactory;

});
