/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/widgets/search.forms/search.form.model',
  'csui/utils/contexts/factories/connector'
], function (module, _, Backbone, ModelFactory,
    SearchFormModel, ConnectorFactory) {

  var SearchFormFactory = ModelFactory.extend({

    propertyPrefix: 'searchTemplate',

    constructor: function SearchFormFactory(context, options) {
      options || (options = {});
      ModelFactory.prototype.constructor.apply(this, arguments);

      var formQuery = this.options.formQuery || {};
      if (!(formQuery instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            config    = module.config();
            formQuery = new SearchFormModel(options.attributes, _.extend({
          connector: connector
        }, config.options, formQuery.options));
      }
      this.property = formQuery;
    },

    fetch: function (options) {
      return this.property.fetch(this.options);
    }

  });

  return SearchFormFactory;

});
