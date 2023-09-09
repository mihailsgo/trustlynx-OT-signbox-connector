csui.define([
    'module',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/utils/contexts/factories/factory',
    'conws/widgets/outlook/impl/recentwksps/impl/recentwksps.model',
    'conws/widgets/outlook/impl/utils/utility'
], function (module, _, Backbone, ModelFactory, RecentWkspsModel, WkspUtil) {

  var recentwkspsModelFactory = ModelFactory.extend({

    propertyPrefix: 'recentwksps',

    constructor: function recentwkspsModelFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      this.property = new RecentWkspsModel(undefined, {
          connector: context.connector,
          pageNo: 1,
          pageSize: WkspUtil.pageSize,
          isEdit: (typeof context.isEdit !== 'undefined') ? context.isEdit : false
      });
    },

    fetch: function (options) {
        // Just fetch the model exposed by this factory
        return this.property.fetch(options);
    }

  });

  return recentwkspsModelFactory;

});
