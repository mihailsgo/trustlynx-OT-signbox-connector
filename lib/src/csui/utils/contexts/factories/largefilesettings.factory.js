/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/models/largefilesettingsmodel'
], function (module, _, $, Backbone, CollectionFactory, ConnectorFactory,
    LareFileSettingsModel) {
  'use strict';


  var LargeFileSettingsFactory = CollectionFactory.extend({
    propertyPrefix: 'largeFileSettings',

    constructor: function LargeFileSettingsFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var largeFileSettings = this.options.largeFileSettings || {},
          config = module.config();
  
        var connector = context.getObject(ConnectorFactory, options);
         largeFileSettings = new LareFileSettingsModel(largeFileSettings.attributes || config.attributes,
          _.defaults({
            connector: connector
          }, largeFileSettings.options, config.options, {
            autofetch: true
         }));
      this.property = largeFileSettings;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
    
        return this.property.fetch(options);
    }
  });

  return LargeFileSettingsFactory;
});
