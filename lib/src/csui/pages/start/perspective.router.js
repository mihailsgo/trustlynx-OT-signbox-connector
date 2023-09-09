/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/backbone',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/pages/start/impl/location',
  'csui/utils/url'
], function (Backbone, $, _, ApplicationScopeModelFactory, location, Url) {
  'use strict';

  var activeRouter, previousRouter;
  var noViewStateRest = true;

  var PerspectiveRouter = Backbone.Router.extend({
    constructor: function PerspectiveRouter(options) {
      Backbone.Router.prototype.constructor.apply(this, arguments);
      this.context = options.context;
      this._routeWithSlashes = options.routeWithSlashes;

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this, 'other:route', this.onOtherRoute);
      this.listenTo(this.context, 'sync error', function () {
        noViewStateRest = false;
      });

    },

    execute: function (callback, args) {
      this._session = this.context.viewStateModel.get("session_state") || false;
      this.trigger('before:route', this);
      this._restoreUrlParamsFromViewState();
      return Backbone.Router.prototype.execute.apply(this, arguments);
    },

    _restoreUrlParamsFromViewState: function () {
      if (!this.urlParams || this.urlParams.length === 0) {
        var viewStateModel = this.context.viewStateModel;
        var urlParams = viewStateModel.get(viewStateModel.CONSTANTS.URL_PARAMS);
        urlParams && _.isString(urlParams) && (urlParams = JSON.parse(urlParams)) && (this.urlParams = urlParams.slice());
      }
    },

    getUrlParametersList: function() {
      return this.urlParams;
    },

    addUrlParameters: function(urlParameters, replace) {
      var urlParams = this.getUrlParametersList() || [];

      if (replace) {
        urlParams = [];
      }

      this.urlParams = _.unique(urlParams.concat(urlParameters));

      var viewStateModel = this.context.viewStateModel;
      viewStateModel.set(viewStateModel.CONSTANTS.URL_PARAMS, this.urlParams);
      this._clearViewStateModelKeys(this.urlParams);

      return true;
    } ,

    _clearViewStateModelKeys: function (keys) {
      var viewStateModel = this.context.viewStateModel,
          modified;
      var state = viewStateModel.get('state');
      _.keys(state).forEach(function (key) {
        if (keys.indexOf(key) === -1) {
          delete state[key];
          modified = true;
        }
      });
      if (modified) {
        viewStateModel.unset('state', {silent: true});
        viewStateModel.set('state', state);
      }
    },

    _resetViewStateModel: function (keys) {
      if (noViewStateRest) {
        return;
      }
      var viewStateModel = this.context.viewStateModel,
          constants = viewStateModel.CONSTANTS;
      viewStateModel.unset(constants.STATE, {silent: true});
      viewStateModel.unset(constants.DEFAULT_STATE, {silent: true});
      viewStateModel.unset(constants.SESSION_STATE, {silent: true});
      viewStateModel.unset(constants.QUERY_STRING_PARAMS, {silent: true});

      viewStateModel.set(constants.STATE, {});
      viewStateModel.set(constants.DEFAULT_STATE, {});
      viewStateModel.set(constants.SESSION_STATE, {});
      viewStateModel.set(constants.QUERY_STRING_PARAMS, '');
    },

    getActiveRouter : function() {
      return activeRouter;
    },

    getPreviousRouter : function() {
      return previousRouter;
    },

    onViewStateChanged:function() {
    },

    getInitialViewState: function () {
      return {};
    },

    activate: function (setDefault) {
      this.context.viewStateModel.set("isFirstRoute", this._session === false, {silent: true});
      this.context.viewStateModel.set("routeFromUrl", this._session !== undefined, {silent: true});
      delete this._session;
      if (activeRouter !== this) {
        previousRouter = activeRouter;
        activeRouter = this;
        var urlParams = this.getUrlParametersList();
        if (previousRouter && !this.restoring && urlParams && urlParams.length > 0) {
          urlParams.length = 0;
        }
        
        this._activeRouterChanged();
      }

      var viewStateModel = this.context.viewStateModel;

      viewStateModel.set('enabled', this.isViewStateModelSupported());
      if (setDefault) {

        this._saveViewState();

        this._initializeViewState();
      }
    },

    _saveViewState: function() {

      var viewStateModel = this.context.viewStateModel;
      var saved_viewState = {},
          state = viewStateModel.get('state');

      if (state) {
        _.extend(saved_viewState, state);
      }

      viewStateModel.set('saved_viewstate', saved_viewState);
    },

    _initializeViewState:function() {
      var viewStateModel = this.context.viewStateModel;
      var state = viewStateModel.get('state');
      if (state && _.keys(state).length === 0) {
        viewStateModel.unset('state', {silent: true});
      }
      var newViewState = this.getInitialViewState();

      viewStateModel.setViewState('state', newViewState, {silent: true});
      this._syncDefaultStateToViewState(newViewState);
    },
    _syncDefaultStateToViewState: function (viewState) {
      var viewStateModel = this.context.viewStateModel;
      var defaultState = viewStateModel.get('default_state'), modified;
      if (defaultState) {
        var viewStateKeys = Object.keys(viewState);
        Object.keys(defaultState).forEach(function(key){
          if (viewStateKeys.indexOf(key) === -1) {
            delete defaultState[key];
            modified = true;
          }
        });
        if (modified) {
          viewStateModel.unset('default_state');
          viewStateModel.set('default_state', JSON.parse(JSON.stringify(defaultState)));
        }
      }
    },

    _activeRouterChanged: function () {
      var viewStateModel = this.context.viewStateModel;

      if (activeRouter === this) {
        viewStateModel.set('activeRouterInstance', this);
        this.listenTo(viewStateModel, 'change:state', this.onViewStateChanged);
        if (previousRouter) {
          previousRouter.stopListening(viewStateModel, 'change:state', previousRouter.onViewStateChanged);
        }
      } 
    },
    buildUrlParams: function () {
      var urlParams = this.urlParams,
          context = this.context,
          viewStateModel = context && context.viewStateModel,
          viewState = viewStateModel && viewStateModel.get('state'),
          defaultViewState = viewStateModel.get('default_state');
      var paramsArray = [];

      var initialUrlParams = viewStateModel && viewStateModel.get('initialUrlParams');
      if (initialUrlParams && initialUrlParams.length) {
        paramsArray = paramsArray.concat(initialUrlParams);
        paramsArray.forEach(function (entry) {
          viewState[entry.name] = entry.value;
          urlParams = urlParams || [];
          urlParams.push(entry.name);
        });
      }

      if (urlParams && viewState) {
        urlParams.forEach(function (param) {
          var value        = viewState[param],
              defaultValue = defaultViewState && defaultViewState[param];
          if (value !== undefined && defaultValue !== undefined &&
              value.toString().toUpperCase() !== defaultValue.toString().toUpperCase()) {
            this._addToParamsArray(paramsArray, {
              name: param,
              value: value
            });
          }
        }.bind(this));
      }

      paramsArray = paramsArray || [];

      _.keys(viewState).forEach(function (key) {
        if (defaultViewState && defaultViewState[key] !== undefined && viewState[key] !== undefined &&
                    defaultViewState[key].toString().toUpperCase() === viewState[key].toString().toUpperCase()) {
          return true;
        }
        if (viewState[key] !== undefined) {
            this._addToParamsArray(paramsArray, {
              name: key,
              value: viewState[key]
            });
        }
      }.bind(this));
      var currentRouter = viewStateModel.get(viewStateModel.CONSTANTS.CURRENT_ROUTER);
      if (!currentRouter) {
        var queryStringParams = viewStateModel.get(viewStateModel.CONSTANTS.QUERY_STRING_PARAMS);
        _.keys(queryStringParams).forEach(function (key) {
          this._addToParamsArray(paramsArray, {
            name: key,
            value: queryStringParams[key]
          });
        }.bind(this));
      }

      return $.param(paramsArray);
    },

    _addToParamsArray: function(paramsArray, object) {
        if (object && object.name) {
          var found = false;
          paramsArray.some(function(entry) {
            if (entry.name === object.name) {
              found = true;
              return true;
            }
          });
          if (!found) {
            paramsArray.push(object);
            return true;
          }
        }
    },

    restore: function (routerInfo) {

      var viewStateModel = this.context.viewStateModel,
          fragment       = routerInfo.fragment;

      if (viewStateModel) {
        this.restoring = true;
        viewStateModel.set(viewStateModel.CONSTANTS.URL_PARAMS, routerInfo.urlParam);
        viewStateModel.set('replaceURL', true);
        fragment && Backbone.Router.prototype.navigate.call(this, fragment, {trigger: true});
      } else {
        window.history.back();
      }

    },

    initSessionViewState: function () {
      var viewStateModel = this.context && this.context.viewStateModel;
      viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, {});
    },

    initDefaultViewState: function () {
      if (!this.restoring) {
        var viewStateModel = this.context && this.context.viewStateModel;
        viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.DEFAULT_STATE,
            _.pick(viewStateModel.get(viewStateModel.CONSTANTS.DEFAULT_STATE)||{},viewStateModel.get(viewStateModel.CONSTANTS.URL_PARAMS)||[]));
      }
    },

    getUrlParamsNotInFragment: function (fragment) {
      var notInFragment = [],
          inUrl = _.keys(Url.urlParams(fragment));
      var allRoutersUrlParams = this.getUrlParametersList();
      allRoutersUrlParams && allRoutersUrlParams.forEach(function (param) {
        if (inUrl.indexOf(param) === -1) {
          notInFragment.push(param);
        }
      });
      return notInFragment;
    },

    initViewStateFromUrlParams: function (query_string, silent) {
      var viewState = {},
          viewStateModel = this.context && this.context.viewStateModel;

      this._saveViewState();

       if (_.isString(query_string)) {
        var query_string_params = $.parseParams(query_string);
        viewStateModel.set(viewStateModel.CONSTANTS.QUERY_STRING_PARAMS, $.parseParams(query_string));
        var urlParams = this.getUrlParametersList();
        if (urlParams && urlParams.length > 0) {
          viewState = _.pick(query_string_params, this.getUrlParametersList());
        } else {
          _.extend(viewState, query_string_params);
          this.addUrlParameters(_.keys(viewState));
        }
        var defaultViewState = this.context.viewStateModel.get('default_state');
        if (defaultViewState) {
          var original = {};
          _.extend(original, viewState);
          _.extend(viewState, defaultViewState);
          _.extend(viewState, original);
        }
      } else {
        viewState = query_string;
      }

      viewStateModel &&
      viewStateModel.unset('state', {silent: true}) &&
      viewStateModel.setViewState('state', viewState, {silent: silent});
    },

    isViewStateModelSupported: function() {
      return false;
    },

    navigate: function (fragment, options) {

      var params = this.buildUrlParams(),
          originalFragment = fragment;
          
      if (params) {
        fragment += '?' + params;
      }

      if (this !== activeRouter) {
        this.activate(true);
      }

      this.trigger('before:route', this);
      if (this._routeWithSlashes) {
        var excludeUrlParams = previousRouter ? previousRouter.getUrlParametersList() : [];
        excludeUrlParams = excludeUrlParams || [];
        var urlParamsNotInfragment = this.getUrlParamsNotInFragment(fragment);
        if (urlParamsNotInfragment) {
          excludeUrlParams = excludeUrlParams.concat(urlParamsNotInfragment);
        }
        fragment = Url.appendQuery(fragment, Url.mergeUrlParams(fragment, location.search, excludeUrlParams));
        fragment += location.hash;
      }

      var viewStateModel = this.context.viewStateModel,
          ViewStateConstants = viewStateModel.CONSTANTS;

      if (viewStateModel.get('replaceURL')) {
        viewStateModel.set('replaceURL', false);
        options = options || {};
        options.replace = true;
      }

      if (originalFragment !== viewStateModel.get(ViewStateConstants.CURRENT_ROUTER_FRAGMENT)) {
        viewStateModel.onNavigationStarted({
          'router': this.name,
          'back_to_title': this.getBackToTitle(),
          'fragment': originalFragment,
          'scopeId': this.applicationScope,
          'navigateOptions': options,
          'state': viewStateModel.get(ViewStateConstants.STATE),
          'sessionState': viewStateModel.get(ViewStateConstants.SESSION_STATE),
          'defaultState': viewStateModel.get(ViewStateConstants.DEFAULT_STATE)
        }, this.restoring);
      }
      viewStateModel.set('initialUrlParams', undefined);

      var navigate = Backbone.Router.prototype.navigate.call(this, fragment, options);

      this.initSessionViewState();

      if (viewStateModel.get(ViewStateConstants.CURRENT_ROUTER) !== this.name) {
        viewStateModel.set(ViewStateConstants.CURRENT_ROUTER, this.name);
        viewStateModel.set(ViewStateConstants.BACK_TO_TITLE, this.getBackToTitle());
        this.initDefaultViewState();
      }
      viewStateModel.set(ViewStateConstants.CURRENT_ROUTER_FRAGMENT, originalFragment);
      viewStateModel.set(ViewStateConstants.CURRENT_ROUTER_NAVIGATE_OPTIONS, options);
      this.applicationScope ?
        viewStateModel.set(ViewStateConstants.CURRENT_ROUTER_SCOPE_ID, this.applicationScope.get('id')) :
        viewStateModel.unset(ViewStateConstants.CURRENT_ROUTER_SCOPE_ID);

      this.restoring = false;

      this.trigger('after:route', this);

      return navigate;
    },

    getBackToTitle: function () {
      return document.title;
    }
  });

  return PerspectiveRouter;
});
