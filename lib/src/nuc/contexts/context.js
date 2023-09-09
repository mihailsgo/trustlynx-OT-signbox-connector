/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/lib/marionette', 'nuc/utils/errors/request', 'nuc/utils/log'
], function (module, _, $, Backbone, Marionette, RequestError, log) {
  'use strict';

  log = log(module.id);

  var Context = Marionette.Controller.extend({
    constructor: function Context(options) {
      this.cid = _.uniqueId('context');
      Marionette.Controller.prototype.constructor.apply(this, arguments);
      this._factories = {};
      _.each(this.options.factories, function (object, key) {
        object.internal = true;
      });
    },
    getModel: getObject,      // NodeModel, e.g.
    getCollection: getObject, // FavoriteCollection, e.g.
    getObject: getObject,     // Connector, e.g.
    hasModel: hasObject,      // NodeModel, e.g.
    hasCollection: hasObject, // FavoriteCollection, e.g.
    hasObject: hasObject,     // Connector, e.g.

    getFactory: function (Factory, options) {
      return this._getFactory(Factory, options, true);
    },

    clear: function (options) {
      log.info('Clearing {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('before:clear', this);
      if (options && options.all) {
        this._destroyAllFactories();
      } else {
        this._destroyNonPermanentFactories();
      }
      this.suppressFetch();
      log.info('Clearing {0} succeeded.', this.cid) && console.log(log.last);
      this.triggerMethod('clear', this);
      return this;
    },
    isBusy: function () {
      return this.fetching;
    },

    fetch: function (options) {
      options || (options = {});

      if (this.fetching) {
        log.debug('Fetching {0} continues.', this.cid) && console.log(log.last);
        return this.fetching;
      }
      this.fetched = false;
      this.error = null;
      log.info('Fetching {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('request', this);

      this._destroyTemporaryFactories();
      var self = this;
      var fetchableFactories = _.filter(this._factories, function (factory) {
        return self.isFetchable(factory);
      });
      var factoryPromises = _.chain(fetchableFactories)
          .map(function (factory) {
            var clonedOptions = options ? _.clone(options) : {};

            if (self._synchronizeFetches) {
              return factory.cloneAndFetch(clonedOptions).then(function () {
                log.debug("Results of " + factory.property.constructor.name + " arrived.") &&
                console.log(log.last);
              });
            } else {
              return factory.fetch(clonedOptions);
            }
          })
          .compact()
          .value();

      if (log.can('DEBUG')) {
        _.each(fetchableFactories, function (factory) {
          log.debug("Waiting for fetch results of " + factory.property.constructor.name) &&
          console.log(log.last);
        });
      }

      var finalDeferred = $.Deferred();
      var finalPromise = this.fetching = finalDeferred.promise();

      $.when
          .apply($, factoryPromises)
          .then(function () {
            if (self.fetching === finalPromise) {
              self.fetching = null;
              self.fetched = true;
              log.info('Fetching {0} succeeded.', self.cid) && console.log(log.last);

              if (self._synchronizeFetches) {
                self.triggerMethod('before:models:reset', self);
                _.each(fetchableFactories, function (factory) {
                  factory.copyFetchedResultsToOriginalProperty();
                });
              }
              self.triggerMethod('sync', self);
              finalDeferred.resolve();
            } else {
              log.debug('Suppressed fetching {0} succeeded.', self.cid) && console.log(log.last);
            }
          }, function (request) {
            var error = new RequestError(request);
            if (self.fetching === finalPromise) {
              self.fetching = null;
              self.error = error;
              log.error('Fetching {0} failed: {1}', self.cid, error) && console.error(log.last);
              self.triggerMethod('error', error, self);
              finalDeferred.reject(error);
            } else {
              log.debug('Suppressed fetching {0} failed: {1}.', self.cid, error.message) &&
              console.log(log.last);
            }
          });
      return finalPromise;
    },

    isFetchable: function (factory) {
      return this._isFetchable(factory);
    },

    _isFetchable: function (factory) {
      if (factory.options.detached) {
        return false;
      }
      if (factory.isFetchable) {
        return factory.isFetchable();
      }
      return !!factory.fetch;
    },

    suppressFetch: function () {
      if (this.fetching) {
        log.debug('Suppressing the fetch in progress in {0}.', this.cid) && console.log(log.last);
        this.fetching = null;
        this.fetched = false;
        this.error = null;
        this.triggerMethod('sync', this);
        return true;
      }
    },

    _destroyTemporaryFactories: function () {
      this._factories = _.pick(this._factories, function (factory, propertyName) {
        if (factory.options.temporary) {
          this._removeFactory(propertyName);
        } else {
          return true;
        }
      }, this);
    },

    _destroyNonPermanentFactories: function () {
      this._factories = _.pick(this._factories, function (factory, propertyName) {
        if (factory.options && factory.options.permanent) {
          return true;
        } else {
          this._removeFactory(propertyName);
        }
      }, this);
    },

    _destroyAllFactories: function () {
      _.each(this._factories, function (factory, propertyName) {
        this._removeFactory(propertyName);
      }, this);
      this._factories = {};
    },

    _getPropertyName: function (Factory, options) {
      options || (options = {});
      var attributes = options.attributes || {};
      if (options.unique) {
        attributes = _.extend({
          stamp: _.uniqueId()
        }, attributes);
      }
      return _.reduce(attributes, function (result, value, key) {
        if (value == null) {
          return result;
        }
        if (result !== null) {
          return result + '-' + key + '-' + value;
        }
        return key + '-' + value;
      }, Factory.prototype.propertyPrefix);
    },

    _getFactory: function (Factory, options, createIfNotFound) {
      if (typeof Factory === 'string') {
        return this._factories[Factory];
      }
      options || (options = {});
      var propertyPrefix = Factory.prototype.propertyPrefix,
          globalOptions = this.options.factories || {},
          objectOptions, nameOptions, factoryOptions;
      if (options.internal) {
        objectOptions = options[propertyPrefix];
        if (objectOptions && !objectOptions.internal &&
            !(objectOptions instanceof Backbone.Model)) {
          nameOptions = {
            attributes: objectOptions.attributes,
            unique: objectOptions.unique
          };
        }
      } else {
        objectOptions = options[propertyPrefix];
        if (objectOptions === undefined && !_.isEmpty(options)) {
          factoryOptions = _.omit(options,
              'detached', 'permanent', 'temporary', 'unique');
          if (!_.isEmpty(factoryOptions)) {
            options[propertyPrefix] = _.defaults(factoryOptions, globalOptions[propertyPrefix]);
          }
        }
        _.defaults(options, {
          internal: true
        }, globalOptions);
        nameOptions = {
          attributes: options.attributes,
          unique: options.unique
        };
        if (!nameOptions.attributes && objectOptions && !objectOptions.internal &&
            !(objectOptions instanceof Backbone.Model)) {
          nameOptions = {
            attributes: objectOptions.attributes,
            unique: objectOptions.unique
          };
        }
      }
      var propertyName = this._getPropertyName(Factory, nameOptions),
          extraOptions = options.options;
      propertyName = !!(extraOptions && extraOptions.factoryUID) ?
                     propertyName + extraOptions.factoryUID : propertyName;
      var factory = this._factories[propertyName];
      if (!factory && createIfNotFound) {
        options.factoryName = propertyName;
        factory = new Factory(this, options);
        this._factories[propertyName] = factory;
        log.debug('Adding factory {0} to {2}.',
            propertyName, factory.context.cid, this.cid) && console.log(log.last);
        this.triggerMethod('add:factory', this, propertyName, factory);
        var property = factory.property;
        if (property instanceof Context) {
          this.listenTo(property, 'add:factory', function (context, propertyName, factory) {
            this.triggerMethod('add:factory', this, propertyName, factory);
          })
              .listenTo(property, 'remove:factory', function (context, propertyName, factory) {
                this.triggerMethod('remove:factory', this, propertyName, factory);
              });
        }
      }
      return factory;
    },

    _removeFactory: function (propertyName) {
      var factory = this._factories[propertyName];
      var property = factory.property;
      if (property instanceof Context) {
        this.stopListening(property, 'add:factory')
            .stopListening(property, 'remove:factory');
      }
      this.triggerMethod('remove:factory', this, propertyName, factory);
      factory.destroy();
    },

    onDestroy: function () {
      this.clear({all: true});
    }
  });

  function getObject(Factory, options) {
    var factory = this._getFactory(Factory, options, true);
    return factory.property;
  }

  function hasObject(Factory, options) {
    return !!this._getFactory(Factory, options, false);
  }

  return Context;
});
