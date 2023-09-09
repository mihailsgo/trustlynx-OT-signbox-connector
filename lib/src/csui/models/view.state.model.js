/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/url', 'csui/utils/namedsessionstorage'

], function (module, _, Backbone, log, Url, NamedSessionStorage) {
  'use strict';

  var PublicLang;
  require(['i18n!csui/pages/start/nls/lang'
  ], function (publicLang) {
    PublicLang = publicLang;
  }.bind(this));

  var MAX_ROUTERS_INFO_STACK = 50;

  var constants = Object.freeze({
    LAST_ROUTER: 'lastRouter',
    CURRENT_ROUTER: 'currentRouter',
    CURRENT_ROUTER_FRAGMENT: 'currentRouterFragment',
    CURRENT_ROUTER_NAVIGATE_OPTIONS: 'currentRouterNavigateOptions',
    CURRENT_ROUTER_SCOPE_ID: 'currentRouterScopeId',
    BACK_TO_TITLE: 'back_to_title',
    METADATA_CONTAINER: 'metadata_container',
    STATE: 'state',
    DEFAULT_STATE: 'default_state',
    SESSION_STATE: 'session_state',
    NAVIGATION_HISTORY_ARRAY: 'navigationHistoryArray',
    URL_PARAMS: 'urlParams',
    ALLOW_WIDGET_URL_PARAMS: 'allowWidgetUrlParams',
    START_ID: 'start_id',
    BREADCRUMB: 'breadcrumb',
    QUERY_STRING_PARAMS: 'query_string_params'
  });

  var counter = 0;
  var ViewStateModel = Backbone.Model.extend({

    constructor: function ViewStateModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      if (counter === 0) {
        this.storage = new NamedSessionStorage(module.id);
      } else {
        this.storage = new NamedSessionStorage(module.id + '_' + counter);
        this.storage.destroy();
      }

      counter++;

      this.set('enabled', attributes ? attributes.enabled : false);

      this._navigationHistory = [];

      _.values(constants).forEach(function (property) {
        var value = attributes ? attributes[property] : this.storage.get(property);
        if (value && (property.indexOf("Array") !== -1 || property.indexOf("urlParams") !== -1)) {
          value = _.isString(value) ? JSON.parse(value) : value;
        }
        this.listenTo(this, 'change:' + property, this._syncWithStorage.bind(this, property));
        this.set(property, value);
      }.bind(this));

      this._navigationHistory = this.get(constants.NAVIGATION_HISTORY_ARRAY) || [];
    },

    CONSTANTS: constants,

    _setViewStateAttribute: function (attributeName, key, value, options) {
      options || (options = {});
      if (this._getViewStateAttribute(attributeName, key) === value) {
        return;
      }

      var object = this.get(attributeName) || {};
      object = _.clone(object);
      if (value === undefined || value === '') {
        delete object[key];
      } else {
        object[key] = value;
      }
      options = _.omit(options, 'encode');
      this.set(attributeName, object, options);
      this._syncWithStorageIfSilentUpdate(attributeName, options);
      return true;
    },

    _getViewStateAttribute: function(attributeName, key, decode) {
      var state = this.get(attributeName);
      if (state) {
        return state[key];
      }
    },
    setViewState: function (key, value, options) {
      if (key === 'state') {
        this.set(constants.STATE, value, options);
        this._syncWithStorageIfSilentUpdate(constants.STATE, options);
      } else {
        return this._setViewStateAttribute(constants.STATE, key, value, options);
      }
    },

    getViewState: function (key, decode) {
      return this._getViewStateAttribute(constants.STATE, key, decode);
    },
    setDefaultViewState: function(key, value, options) {
      return this._setViewStateAttribute(constants.DEFAULT_STATE, key, value, options);
    },

    getDefaultViewState: function(key, decode) {
      return this._getViewStateAttribute(constants.DEFAULT_STATE, key, decode);
    },
    setSessionViewState: function (key, value, options) {
      options || (options = {});
      if (this.getSessionViewState(key) === value) {
        return;
      }
      var sessionState = this.get(constants.SESSION_STATE) || {};
      sessionState = _.clone(sessionState);
      sessionState[key] = value;
      this.set(constants.SESSION_STATE, sessionState, options);
      this._syncWithStorageIfSilentUpdate(constants.SESSION_STATE, options);
      return true;
    },

    getSessionViewState: function (key) {
      var state = this.get(constants.SESSION_STATE);
      if (state) {
        return state[key];
      }
    },

    _syncWithStorageIfSilentUpdate: function(property, options) {
      if (options && options.silent) {
        this._syncWithStorage(property);
      }
    },

    _syncWithStorage: function (property) {
      var value = this.get(property);
      if (_.isArray(value)) {
        value = JSON.stringify(value);
      }
      this.storage.set(property, value);
    },

    getCurrentRouterName: function() {
      return this.get(this.CONSTANTS.CURRENT_ROUTER);
    },

    onNavigationStarted: function (newRouterInfo, canRestore) {

      this.trigger('before:navigate');

      this.set('navigated', true);

      var restore = this.isSameRoutingInfo(newRouterInfo, this.getLastHistoryEntry());
      if (!canRestore) {
        restore = false;
      }
      this.set(this.CONSTANTS.LAST_ROUTER, this.get(this.CONSTANTS.CURRENT_ROUTER));

      if (restore) {
        this._currentHistoryEntry = undefined;
        this._restoreStatesFromHistoryEntry(this._navigationHistory.pop());
        this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
        this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
      } else {
        this._savePotentialHistoryEntry();
      }
    },

    _savePotentialHistoryEntry: function () {
      var storage = this.storage;
      var routerName = storage.get(constants.CURRENT_ROUTER);
      if (routerName) {

        var state = this.get('saved_viewstate');
        if (!state) {
          state = this.storage.get(constants.STATE);
        }
        var router = this.get('PerspectiveRouting').getRouter(routerName);
        
        this._currentHistoryEntry = {
          'router': routerName,
          'back_to_title': this.storage.get(constants.BACK_TO_TITLE),
          'urlParam': router && router.urlParams,
          'fragment': this.storage.get(constants.CURRENT_ROUTER_FRAGMENT),
          'scopeId': this.storage.get(constants.CURRENT_ROUTER_SCOPE_ID),
          'navigateOptions': this.storage.get(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS),
          'state': state,
          'sessionState': this.storage.get(constants.SESSION_STATE),
          'defaultState': this.storage.get(constants.DEFAULT_STATE)
        };
      }
    },

    getPotentialHistoryEntry: function () {
      return this._currentHistoryEntry;
    },

    onContextFetch: function () {
      this.trigger('navigate', this._currentHistoryEntry);
      this.unset("isFromHistory", {silent: true});
      this._currentHistoryEntry && this._addRouterInfoToHistory(this._currentHistoryEntry);
    },

    _restoreStatesFromHistoryEntry : function(historyInfo) {
      if (historyInfo) {
        var restoreStates = {
          'isFromHistory': true,
          'state': historyInfo.state,
          'default_state': historyInfo.defaultState,
          'session_state': historyInfo.sessionState
        };
        this.set(restoreStates, {silent: true});
        ['state', 'default_state', 'session_state'].forEach(function (property) {
          this._syncWithStorage(property);
        }.bind(this));
      }
    },

    _addRouterInfoToHistory: function (historyEntry) {
      if (this._navigationHistory.length > 0 &&
            JSON.stringify(historyEntry) === JSON.stringify(this._navigationHistory[this._navigationHistory.length - 1])) {
        return;
      }

      this._navigationHistory.push(historyEntry);

      if (this._navigationHistory.length > MAX_ROUTERS_INFO_STACK) {
        this._navigationHistory.shift();
      }

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    _copyAttributes: function (viewStateModel) {
      Object.keys(viewStateModel.attributes).forEach(function (attributeName) {
        this.unset(attributeName);
        this.set(attributeName, viewStateModel.get(attributeName));
      }.bind(this));
    },

    saveHistory: function() {
      this.savedViewStateModel = this.clone();
      this.savedViewStateModel._copyAttributes(this);
      this._resetAttributes();
    },

    _resetAttributes: function() {

      this._navigationHistory = [];

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);

      this.set(constants.LAST_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER_FRAGMENT, undefined);
      this.set(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS, undefined);
      this.set(constants.CURRENT_ROUTER_SCOPE_ID, undefined);
      this.set(constants.BACK_TO_TITLE, undefined);
      this.set(constants.METADATA_CONTAINER, undefined);
      this.set(constants.STATE, undefined);
      this.set(constants.DEFAULT_STATE, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.URL_PARAMS, undefined);
      this.set(constants.ALLOW_WIDGET_URL_PARAMS, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.START_ID, undefined);
      this.set(constants.BREADCRUMB, undefined);
    },

    restoreHistory: function () {
      if (this.savedViewStateModel) {
        this._copyAttributes(this.savedViewStateModel);
        this.savedViewStateModel.clean();
        this.savedViewStateModel = undefined;

        var value = this.storage.get(constants.NAVIGATION_HISTORY_ARRAY);
        if (value) {
          value = JSON.parse(value);
          this._navigationHistory = value;
        }
      }
    },

    hasRouted: function () {
      return this._navigationHistory.length > 0;
    },

    isSameRoutingInfo: function (router1Info, router2Info) {
      return router1Info && router2Info &&
             router1Info.router === router2Info.router &&
             router1Info.fragment === router2Info.fragment;
    },
    clean: function() {
      this.clear(); 
      this.storage.destroy();
    },

    getBackToTitle: function () {

      var title = PublicLang.back;
      if (this._currentHistoryEntry) {
        title = this._currentHistoryEntry.back_to_title || title;
      } else {
        var index = this.getLastRouterIndex();
        if (index !== -1) {
          var lastRouterInfo = this._navigationHistory[index];
          if (lastRouterInfo) {
            title = lastRouterInfo.back_to_title || title;
          }
        }
      }

      return title;
    },

    clearHistory: function() {
      this._navigationHistory = [];
      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    clearCurrentHistoryEntry: function () {
      this._currentHistoryEntry = undefined;
    },

    getLastRouterIndex: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].router !== this.get(constants.CURRENT_ROUTER)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getIndexOfOfLastApplicationScope: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].scopeId !== this.get(constants.CURRENT_ROUTER_SCOPE_ID)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getLastHistoryEntry: function () {
      return this._navigationHistory && this._navigationHistory.length > 0 &&
             this._navigationHistory[this._navigationHistory.length - 1];
    },

    getHistory: function () {
      return this._navigationHistory;
    },

    restoreRouterOfLastApplicationScope: function () {
      this._restoreHistoryEntryByIndex(this.getIndexOfOfLastApplicationScope());
    },

    restoreLastRouter: function () {
      this._restoreHistoryEntryByIndex(this.getLastRouterIndex());
    },

    restoreLastFragment: function () {
      this._restoreHistoryEntryByIndex(this._navigationHistory.length - 1);
    },

    restoreHistoryEntryByIndex: function(index) {
      return this._restoreHistoryEntryByIndex(index);
    },

    _restoreHistoryEntryByIndex: function (index) {
      if (index !== -1 && index < this._navigationHistory.length) {
        this._navigationHistory.length = index + 1;
        var historyEntryInfo = this.getLastHistoryEntry();
        this._restoreStatesFromHistoryEntry(historyEntryInfo);
        this.get('PerspectiveRouting').restoreRouter(historyEntryInfo);
      } else {
        window.history.back();
      }
    },

    addUrlParameters: function (urlParameters, context, replace, force) {
      if (!force && !this.get(this.CONSTANTS.ALLOW_WIDGET_URL_PARAMS)) {
        return;
      }
      var perspectiveRouting = this.get('PerspectiveRouting');
      var activeRouter = this.get("activeRouterInstance");
      var routerName = activeRouter && activeRouter.name;
      routerName = routerName || this.get(constants.CURRENT_ROUTER);
      return perspectiveRouting &&
                   perspectiveRouting.addUrlParameters(routerName, urlParameters, replace);
    },

    clear: function () {
      this.storage.destroy();
      this._navigationHistory = [];
      this._currentHistoryEntry = undefined;
      Backbone.Model.prototype.clear.call(this, {silent: true});
    },

    hasNotNavigatedAndNotJustStarted:function() {
    }

  }, {
    CONSTANTS: constants,
    clean: function() {
      var storage = new NamedSessionStorage(module.id);
      storage.destroy();
    }
  });

  return ViewStateModel;
});
