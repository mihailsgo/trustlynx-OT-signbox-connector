csui.define([
    'module', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
    'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
    'conws/models/workspacetypes/workspacetypes.model', 'csui/utils/commands'
  ], function (module, $, _, Backbone, ModelFactory, ConnectorFactory,
      WorkspacesTypes, commands) {
    'use strict';
  
    var WsTypeFactory = ModelFactory.extend({
      propertyPrefix: 'workspacetypes',
  
      constructor: function WsTypeFactory(context, options) {
        ModelFactory.prototype.constructor.apply(this, arguments);
  
        // Obtain the server connector from the application context to share
        // the server connection with the rest of the application; include
        // the options, which can contain settings for dependent factories
        var connector = context.getObject(ConnectorFactory, options);
        this.context = context;
        // Expose the model instance in the `property` key on this factory
        // instance to be used by the context
        options = _.extend(options||{},{
          connector: connector
        });
        this.property = new WorkspacesTypes(undefined, options);
      },
  
      isFetchable: function () {
        return this.property.isFetchable();
      },
  
      fetch: function (options) {
        return this.property.fetch(options);
      }
    });
  
    return WsTypeFactory;
  });
  