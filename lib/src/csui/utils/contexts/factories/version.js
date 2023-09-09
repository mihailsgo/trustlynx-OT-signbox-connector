/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/version', 'csui/utils/commands/versions'
], function (module, _, Backbone, ModelFactory, ConnectorFactory, VersionModel, VersionCommands) {
  'use strict';

  var VersionModelFactory = ModelFactory.extend({

    propertyPrefix: 'version',

    constructor: function VersionModelFactory(context, options) {
      ModelFactory.prototype.constructor.call(this, context, options);

      var version = this.options.version || {};
      if (!(version instanceof VersionModel)) {
        var connector = context.getObject(ConnectorFactory, options),
            config = module.config();
        version = new VersionModel(undefined, _.extend({
           connector: connector,
           commands: VersionCommands.getAllSignatures()
          }, version.options, config.options));
      }
      this.property = version;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }
  });

  return VersionModelFactory;
});
