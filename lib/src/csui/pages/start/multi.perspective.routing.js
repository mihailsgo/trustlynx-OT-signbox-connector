/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/utils/routing',
  'csui-ext!csui/pages/start/perspective.routing'
], function (module, _, Backbone, Url, routing, extraRouters) {
  'use strict';

  var config = _.extend({
    handlerUrlPathSuffix: '/app',
    rootUrlPath: null
  }, module.config());
  
  var backboneHistoryStarted = false;

  function MultiPerspectiveRouting(options) {

    this.options = _.extend({}, config, options);
    var DefaultRouters = [];
    var Routers = _
            .chain(extraRouters)
            .flatten(true)
            .filter(function (Router) {
              if (Router.isDefault) {
                DefaultRouters.push(Router);
              } else {
                return true;
              }
            })
            .concat(DefaultRouters)
            .unique()
            .reverse()
            .value(),
        routeWithSlashes = routing.routesWithSlashes();
    this._routers = _.map(Routers, function (Router, index) {
      var router = new Router(_.extend({
        routeWithSlashes: routeWithSlashes
      }, this.options));
      if (!router.name) {
        router.name = index;
      }
      router.on('before:route', _.bind(this._informOthers, this));
      return router;
    }, this);

    this._context = this.options.context;
    this._context.viewStateModel.set('PerspectiveRouting', this);
    this._originalHistoryLength = history.length;
    this.started = false;
  }

  _.extend(MultiPerspectiveRouting.prototype, Backbone.Events, {
    start: function (options) {
      var historyOptions;
      if (routing.routesWithSlashes()) {
        historyOptions = {
          pushState: true,
          root: this.options.rootUrlPath != null && this.options.rootUrlPath ||
                Url.combine(
                    new Url(new Url(location.pathname).getCgiScript()).getPath(),
                    this.options.handlerUrlPathSuffix)
        };
      } else {
		    var rootPath = Backbone.history.decodeFragment(location.pathname);
        historyOptions = {
          root: rootPath
        };
      }

      _.extend(historyOptions, options);

      if (!backboneHistoryStarted) {
        Backbone.history.start(historyOptions);
      }
      
      backboneHistoryStarted = true;
      this.started = true;
      this._context && this._context.viewStateModel.set('history', true);
    },

    ensureStart: function (options) {
      if (!this.started) {
        this.start(options);
      }
    },
    
    hasRouted: function () {
      return history.length > this._originalHistoryLength;
    },

    addUrlParameters: function (name, urlParameters, replace) {
      var added = true;
      this._routers.some(function (router) {
        if (router.name === name) {
          if (router.addUrlParameters(urlParameters, replace)) {
            added = true;
          }
          return true;
        }
      });
      return true;
    },

    restoreRouter: function (lastRouterInfo) {
      this._routers.some(function (router) {
        if (router.name === lastRouterInfo.router) {
          router.restoring = true;
          router.restore(lastRouterInfo);
          return true;
        }
      });
    },

    getRouter: function (name) {
      var routerToFind;
      this._routers.some(function (router) {
        if (router.name === name) {
          routerToFind = router;
          return true;
        }
      });
      return routerToFind;
    },

    _informOthers: function (activeRouter) {
      _.each(this._routers, function (router) {
        if (router !== activeRouter) {
          router.trigger('other:route', router, activeRouter);
        }
      });
    }
  });

  MultiPerspectiveRouting.extend = Backbone.History.extend;

  return MultiPerspectiveRouting;
});
