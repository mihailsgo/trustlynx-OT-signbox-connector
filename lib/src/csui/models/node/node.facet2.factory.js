/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'csui/utils/contexts/mixins/clone.and.fetch.mixin',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/node',
  'csui/models/nodefacets2'
], function (module, _, Backbone,
    CloneAndFetchMixin,
    CollectionFactory,
    NodeModelFactory,
    NodeFacet2Collection) {

  var Facet2CollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'facets2',

    constructor: function Facet2CollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var facets = this.options.facets2 || {};
      if (!(facets instanceof Backbone.Collection)) {
        var node = facets.options && facets.options.node ||
                   context.getModel(NodeModelFactory, options),
            config = module.config();
        facets = new NodeFacet2Collection(facets.models, _.defaults(
            config.options,
            facets.options,
            {
              autoreset: true
            },
            {node: node}
        ));
      }
      this.property = facets;

      this.makeCloneAndFetch(options);
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  CloneAndFetchMixin.mixin(Facet2CollectionFactory.prototype);

  return Facet2CollectionFactory;
});
