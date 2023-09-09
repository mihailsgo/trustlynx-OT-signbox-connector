/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module', 'csui/lib/underscore', 'csui/lib/backbone',
    'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
    'csui/models/version', 'csui/utils/commands/versions'
  ], function (module, _, Backbone, ModelFactory, ConnectorFactory, VersionModel, VersionCommands) {
    'use strict';

    var NextVersionModelFactory = ModelFactory.extend({

      propertyPrefix: 'nextVersion',

      constructor: function NextVersionModelFactory(context, options) {
        ModelFactory.prototype.constructor.call(this, context, options);

        var nextVersion = this.options.nextVersion || {};
        if (!(nextVersion instanceof VersionModel)) {
          var connector = context.getObject(ConnectorFactory, options),
              config = module.config();
          nextVersion = new VersionModel(undefined, _.extend({
             connector: connector,
             commands: VersionCommands.getAllSignatures()
            }, nextVersion.options, config.options));
        }
        this.property = nextVersion;
      },

      isFetchable: function () {
        return this.property.isFetchable();
      },

      fetch: function (options) {
        return this.property.fetch(options);
      }
    });

    return NextVersionModelFactory;
  });
