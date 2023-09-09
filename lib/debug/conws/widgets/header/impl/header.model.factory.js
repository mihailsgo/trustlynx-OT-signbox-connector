csui.define([
    'csui/utils/contexts/factories/factory',
    'csui/utils/contexts/factories/connector',
    'csui/utils/contexts/factories/node',
    'conws/widgets/header/impl/header.model'
], function (ModelFactory, ConnectorFactory, NodeModelFactory, HeaderModel) {

  var HeaderModelFactory = ModelFactory.extend({

      // unique prefix for the header model instance.
      propertyPrefix: 'header',

      constructor: function HeaderModelFactory(context, options){
          ModelFactory.prototype.constructor.apply(this, arguments);

          // get the server connector from the application context
          var node = context.getModel(NodeModelFactory),
              connector = context.getObject(ConnectorFactory, options);

          // the model is contained in the 'property' key
          this.property = new HeaderModel( {}, {
            node: node,
              connector: connector
          });
      },

      fetch: function(options){
          // fetch the model contents exposed by this factory.
          return this.property.fetch(options);
      }
  });

  return HeaderModelFactory;
});
