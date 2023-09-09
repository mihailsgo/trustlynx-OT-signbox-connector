/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/models/widget/search.results.tile/search.results.tile.collection',
  'csui/utils/commands',
  'csui/utils/base',
  'csui/utils/defaultactionitems',
  'csui/utils/deepClone/deepClone'
], function (require, module, _, Backbone, CollectionFactory, ConnectorFactory,
    SearchQueryModelFactory, SearchResultCollection, commands, base, defaultActionItems) {

  var SearchResultCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'searchResults',

    constructor: function SearchResultCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);
      var searchResults = this.options.searchResults || {},
          searchOptions = options.options;
      if (!(searchResults instanceof Backbone.Collection)) {
        if (searchOptions) {
          delete searchOptions.factoryUID;
        }
        var connector = context.getObject(ConnectorFactory, options),
            query_id     = searchOptions && searchOptions.query_id,
            config    = module.config();
        searchResults = new SearchResultCollection(searchResults.models, _.extend({
          connector: connector,
          query_id: query_id,
          stateEnabled: true,
          commands: commands.getAllSignatures()
        }, searchResults.options, config.options, {
          autofetch: true,
          autoreset: true
        }));
      }
      this.property = searchResults;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      !this.property.fetched && this.property.fetch({
        success: _.bind(this._onSearchResultsFetched, this, options),
        error: _.bind(this._onSearchResultsFailed, this, options)
      });
    },

    _onSearchResultsFetched: function (options) {
      return true;
    },

    _onSearchResultsFailed: function (model, request, message) {
      var error = new base.RequestErrorMessage(message);
    }

  }, {

    getDefaultResourceScope: function () {
      return _.deepClone({
        commands: commands.getAllSignatures()
      });
    },

    getLimitedResourceScope: function () {
        var resourceScope = _.deepClone({
          fields: {
            properties: ['container', 'id', 'name', 'original_id', 'type', 'type_name', 'parent_id',
              'reserved', 'custom_view_search', 'version_number'],
            'versions.element(0)': ['mime_type']
          },
          includeResources: [],
          commands: defaultActionItems.getAllCommandSignatures(commands)
        });
        return resourceScope;
      }

  });

  return SearchResultCollectionFactory;

});
