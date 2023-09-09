/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/search.perspectives'
], function (require, module, _, Backbone, log, SearchQueryModelFactory, SearchFormQueryModelFactory,
    ApplicationScopeModelFactory, PerspectiveContextPlugin,
    searchPerspectives) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    allowAlphaNumericsInQueryId : false
  });

  var SearchPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function SearchPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory);
      this.searchQuery = this.context
          .getModel(SearchQueryModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change', this.onSearchQueryChanged, this);
      this.searchForm = this.context
          .getModel(SearchFormQueryModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change', this.onSearchQueryChanged, this);
    },

    onSearchQueryChanged: function () {
      if (this.searchQuery.get('query_id') && typeof this.searchQuery.get('query_id') === "string" && 
          this.searchQuery.attributes.enableSearchForm && typeof this.searchQuery.attributes.enableSearchForm === "string") {
        if (!config.allowAlphaNumericsInQueryId) {
          this.searchQuery.attributes.query_id = parseInt(this.searchQuery.get('query_id'));
        } else {
          this.searchQuery.attributes.query_id = this.searchQuery.get('query_id');
        }
        this.searchQuery.attributes.enableSearchForm = this.searchQuery.attributes.forcePerspectiveChange = true;
        this.context._factories.searchTemplate.property = this.searchQuery;
      }
      var searchQueryId = !this.searchQuery.get('query_id') && 
                          !this.searchForm.get('query_id') ? true : this.searchQuery.get('query_id');
      var perspective            = searchQueryId ? searchPerspectives.findByQuery(this.searchQuery)
                                             : searchPerspectives.findByQuery(this.searchForm),
          forcePerspectiveChange = searchQueryId ? this.searchQuery.get('forcePerspectiveChange')
                                                 : this.searchForm.get('forcePerspectiveChange');
      this.applicationScope.set('id', 'search'); // set application view state
      this.context.loadPerspective(perspective.get('module'), forcePerspectiveChange);
      this.listenToOnce(this.context, 'sync:perspective', function () {
        this.searchQuery.unset('forcePerspectiveChange', {silent: true});
        this.searchForm.unset('forcePerspectiveChange', {silent: true});
      });
    }

  });

  return SearchPerspectiveContextPlugin;

});
