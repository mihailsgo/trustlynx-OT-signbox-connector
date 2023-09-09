/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/lib/marionette', 'nuc/utils/errors/request', 'nuc/utils/log',
  'nuc/contexts/context'
], function (module, _, $, Backbone, Marionette, RequestError, log, Context) {
  'use strict';

  log = log(module.id);

  var SynchronizedContext = Context.extend({
    constructor: function SynchronizedContext(sourceContext, properties, options) {
      this.cid = _.uniqueId('synchronized.context');
      Context.prototype.constructor.apply(this, arguments);
      this._synchronizeFetches = true;

      if (!sourceContext) {
        throw new Error('Source context must be specified');
      }

      _.each(properties, function (property) {
        var propertyName = _.find(Object.keys(sourceContext._factories), function (propertyName) {
          return sourceContext._factories[propertyName].property === property;
        }, this);
        if (propertyName) {
          var factoryWithProperty = sourceContext._factories[propertyName];
          if (!_.isFunction(factoryWithProperty.cloneAndFetch)) {
            throw new Error(
                "Factories for synchronized context must have clone.and.fetch.mixin applied." +
                " Factory " + factoryWithProperty.constructor.name + " does not have it");
          }
          this._factories[propertyName] = factoryWithProperty;
        } else {
          throw new Error("Source context does not have factory with specified property");
        }
      }, this);

      if (options.triggerEventsOnSourceContext) {
        this.listenTo(this, 'request', function () {
          sourceContext.trigger('request');
        });
        this.listenTo(this, 'sync', function () {
          sourceContext.trigger('sync');
        });
      }
    },
    _isFetchable: function (factory) {
      if (factory.isFetchable) {
        return factory.isFetchable();
      }
      return !!factory.fetch;
    }

  });

  return SynchronizedContext;
});
