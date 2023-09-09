csui.define([
    'module',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/utils/contexts/factories/factory',   // Factory base to inherit from
    'conws/widgets/outlook/impl/searchwksps/impl/searchwksps.model'     // Model to create the factory for
], function (module, _, Backbone, ModelFactory, SearchWkspsModel) {

  var searchwkspsModelFactory = ModelFactory.extend({

    propertyPrefix: 'searchwksps',

    constructor: function searchwkspsModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      this.property = new SearchWkspsModel(undefined, {
          connector: context.connector
      });
    },

    fetch: function (options) {
        // Just fetch the model exposed y this factory
        return this.property.fetch(options);
    }

  });

  return searchwkspsModelFactory;

});
