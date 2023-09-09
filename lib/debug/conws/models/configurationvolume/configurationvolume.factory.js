csui.define([
  'module', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'conws/models/configurationvolume/configurationvolume.model', 'csui/utils/commands'
], function (module, $, Backbone, ModelFactory, ConnectorFactory,
    volumesModel, commands) {
  'use strict';

  var ConfigurationVolumeFactory = ModelFactory.extend({
    propertyPrefix: 'configurationvolume',

    constructor: function ConfigurationVolumeFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      // Obtain the server connector from the application context to share
      // the server connection with the rest of the application; include
      // the options, which can contain settings for dependent factories
      var connector = context.getObject(ConnectorFactory, options);
      this.context = context;
      // Expose the model instance in the `property` key on this factory
      // instance to be used by the context
      this.property = new volumesModel(options, {
        connector: connector
      });
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.ensureFetched(options);
    }
  });

  return ConfigurationVolumeFactory;
});
