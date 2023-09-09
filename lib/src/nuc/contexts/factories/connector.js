/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'nuc/lib/underscore', 'nuc/contexts/factories/factory',
  'nuc/utils/connector'
], function (module, _, ObjectFactory, Connector) {

  var ConnectorFactory = ObjectFactory.extend({

    propertyPrefix: 'connector',

    constructor: function ConnectorFactory(context, options) {
      ObjectFactory.prototype.constructor.apply(this, arguments);

      var connector = this.options.connector || {};
      if (!(connector instanceof Connector)) {
        var config = module.config(),
            connection = connector.connection || config.connection || {};
        var privateConnection = _.defaults({}, connection, connector.connection, config.connection);
        connector = new Connector(_.defaults({
          connection: privateConnection
        }, connector, config));
      }
      this.property = connector;
    }

  });

  return ConnectorFactory;

});
