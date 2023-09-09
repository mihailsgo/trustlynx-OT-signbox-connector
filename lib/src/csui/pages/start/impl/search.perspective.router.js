/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/objecttypes.factory',
  'i18n!csui/pages/start/nls/lang', 'i18n!csui/pages/start/impl/nls/lang'
], function (module, _, PerspectiveRouter, SearchQueryModelFactory,
  SearchFormQueryModelFactory, UserModelFactory, ObjectTypesFactory, publicLang, lang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    showTitle: true,
    enableObjectTypes:false
  });

  var SearchPerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      'search/*path': 'openSearchPerspective',
      'search/*path(?*query_string)': 'openSearchPerspective'
    },

    name: 'Search',

    constructor: function SearchPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.searchQuery = this.context.getModel(SearchQueryModelFactory);
      this.listenTo(this.searchQuery, 'change', this._updateSearchUrl);
      this.searchForm = this.context.getModel(SearchFormQueryModelFactory);
      this.listenTo(this.searchForm, 'change', this._updateSearchFormUrl);
      if(config.enableObjectTypes){
        this.objectTypesModel = this.context.getModel(ObjectTypesFactory, {
          permanent: true
        });
        this.objectTypesModel.ensureFetched();
      }
    },

    openSearchPerspective: function (path, query_string) {
      var name,
          parameters = _.reduce(path.split('/'), function (result, item) {
            if (name) {
              result[name] = item != null ? decodeURIComponent(item).trim() : '';
              name = undefined;
            } else {
              name = decodeURIComponent(item);
            }
            return result;
          }, {});
      this.activate(false);

      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, true);
      }

      this._updateSearchQueryPageTitle();
      this._updateSearchFormQueryPageTitle();

      var user = this.context.getModel(UserModelFactory);
      user.ensureFetched().then(_.bind(function () {
        this.searchQuery.set(parameters, {silent: !!this.searchQuery.get('query_id')});
        if (this.searchForm.get('query_id')) {
          this.searchForm.set(parameters, {silent: !!this.searchForm.get('query_id')});
        }
      }, this));

    },

    onOtherRoute: function () {
      this.searchQuery.clear({silent: true});
      this.searchForm.clear({silent: true});
    },

    routerURL: function (searchQuery) {
      var url = _.reduce(searchQuery.attributes, function (result, value, name) {
        if (value) {
          result += '/' + encodeURIComponent(name) + '/' + encodeURIComponent(value);
        } else {
          result += '/' + encodeURIComponent(name) + '/' + '%20';
        }
        return result;
      }, 'search');
      return url;
    },

    _updateSearchUrl: function () {
      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }
      var url = this.routerURL(this.searchQuery);
      this._updateSearchQueryPageTitle();
      this.navigate(url);
    },

    _updateSearchQueryPageTitle: function () {
      if (config.showTitle) {
        document.title = _.str.sformat(publicLang.SearchTitle, this.searchQuery.get('where'), publicLang.ProductName);
      }
    },

    isViewStateModelSupported: function () {
      return true;
    },

    onViewStateChanged: function () {
      this.viewStateChanged = true;
      this._updateSearchUrl();
      this.viewStateChanged = false;
    },

    _updateSearchFormUrl: function () {
      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }
      var url = this.routerURL(this.searchForm);
      this._updateSearchQueryPageTitle();
      this.navigate(url);
    },

    _updateSearchFormQueryPageTitle: function () {
      if (config.showTitle) {
        document.title = _.str.sformat(publicLang.SearchTitle, this.searchForm.get('where'), publicLang.ProductName);
      }
    },

    initSessionViewState: function () {
      var viewStateModel = this.context && this.context.viewStateModel, 
          lastRouter = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.LAST_ROUTER);
      if (!this.restoring && !this.viewStateChanged &&
          (viewStateModel && viewStateModel.get('navigated') && lastRouter !== undefined && lastRouter !== this.name)) {
        viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, {});
      }
    },
    _extractParameters: function (route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function (param, i) {
        return param ? param : null;
      });
    },

    getBackToTitle:function() {
      return publicLang.SearchBackTo;
    }
  });

  return SearchPerspectiveRouter;
});
