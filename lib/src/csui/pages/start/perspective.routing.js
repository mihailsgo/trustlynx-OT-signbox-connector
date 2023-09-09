/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/url',
  'csui/utils/routing',
  'csui/pages/start/multi.perspective.routing',
  'csui-ext!csui/pages/start/perspective.routing'
], function (module, _, Backbone, Url, routing, MultiPerspectiveRouting, extraRouters) {
  'use strict';
  var instance;
  var config = _.extend({
    handlerUrlPathSuffix: '/app',
    rootUrlPath: null
  }, module.config());

  var PerspectiveRouting = MultiPerspectiveRouting.extend({
    constructor: function PerspectiveRouting(options) {
      options = _.extend({}, config, options);
      MultiPerspectiveRouting.prototype.constructor.call(this, options);
    }
  });

  PerspectiveRouting.routesWithSlashes = routing.routesWithSlashes;

  return {
    getInstance: function (options) {
      if (!instance) {
        if (options.context && options.context.viewStateModel) {
          var inst = options.context.viewStateModel.get('PerspectiveRouting');
          if (inst) {
            return inst;
          }
        }
        instance = new PerspectiveRouting(options);
      }
      return instance;
    },
    routesWithSlashes: routing.routesWithSlashes
  };

});
