/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/utils/base', 'csui/utils/log',
  'csui/utils/contexts/context', 'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/global.error',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/impl/csui.context.plugin',
  'csui/utils/contexts/perspective/impl/landing.perspective.context.plugin',
  'csui/utils/contexts/perspective/perspective.guide',
  'csui-ext!csui/utils/contexts/perspective/perspective.context'
], function (require, module, _, $, Backbone, base, log, Context,
    UserModelFactory, GlobalErrorModelFactory, ApplicationScopeModelFactory,
    CsuiContextPlugin, LandingPerspectiveContextPlugin, PerspectiveGuide, contextPlugins) {
  'use strict';

  log = log(module.id);

  var PerspectiveContext = Context.extend({
    constructor: function PerspectiveContext(options) {
      Context.prototype.constructor.apply(this, arguments);

      _.defaults(this.options, {online: true});

      this.perspective = new Backbone.Model();
      this.perspectiveGuide = new PerspectiveGuide();
      this._applicationScope = this.getModel(ApplicationScopeModelFactory, {
        permanent: true,
        detached: true
      });

      if (this.options.online) {
        this._user = this.getModel(UserModelFactory, {
          options: {
            includeResources: ['perspective']
          },
          permanent: true
        });
      }
      var corePlugins = [CsuiContextPlugin, LandingPerspectiveContextPlugin];
      var allPlugins = _
          .chain(options && options.plugins || contextPlugins)
          .flatten(true)
          .filter(function (Plugin) {
            return Plugin !== CsuiContextPlugin && Plugin !== LandingPerspectiveContextPlugin;
          })
          .concat(corePlugins)
          .unique()
          .reverse()
          .value();
      this._plugins = _.map(allPlugins, function (Plugin) {
        return new Plugin({context: this});
      }, this);
      _.invoke(this._plugins, 'onCreate');
    },
    fetchPerspective: function () {
      var landingPerspectivePlugin = _.find(this._plugins, function (plugin) {
        return plugin instanceof LandingPerspectiveContextPlugin;
      });
      landingPerspectivePlugin.onApplicationScopeChanged();
      return this;
    },

    _destroyNonPermanentFactories: function () {
      Context.prototype._destroyNonPermanentFactories.apply(this, arguments);
      _.invoke(this._plugins, 'onClear');
    },

    _isFetchable: function (factory) {
      return Context.prototype._isFetchable.apply(this, arguments) &&
             (factory.property !== this._user || !this._user.get('id')) &&
             _.all(this._plugins, function (plugin) {
               return plugin.isFetchable(factory) !== false;
             });
    },

    loadPerspective: function (perspectiveModule, forceChange) {
      var deferred = $.Deferred(),
          self     = this;
      log.debug('Using perspective from "{0}".', perspectiveModule) &&
      console.log(log.last);
      this.triggerMethod('request:perspective', this.context);
      this.loadingPerspective = deferred.promise();
      require([perspectiveModule], function (perspective) {
        var wrapperModel = new Backbone.Model({perspective: perspective});
        self.loadingPerspective = false;
        self.applyPerspective(wrapperModel, forceChange);
      }, function (error) {
        self.loadingPerspective = false;
        self.rejectPerspective(error);
      });
    },

    overridePerspective: function (sourceModel, perspectiveModule) {
      var self = this;
      log.debug('Overriding the perspective in {0} with "{1}".',
          log.getObjectName(sourceModel), perspectiveModule) &&
      console.log(log.last);
      return require([perspectiveModule], function (perspective) {
        sourceModel.set('perspective', perspective);
        self.applyPerspective(sourceModel);
      }, _.bind(this.rejectPerspective, this));
    },
    applyPerspective: function (sourceModel, forceChange, perspective) {
      var self = this;
      this.triggerMethod('sync:perspective', this, sourceModel);
      this._interceptApplyPerspective(sourceModel, forceChange)
          .done(function (result) {
            if (result && result.forceChange !== undefined) {
              forceChange = result.forceChange;
            }
            self._continueApplyingPerspective(sourceModel, forceChange, perspective);
          })
          .fail(function (error) {
            if (error) {
              self.rejectPerspective(error);
            }
          });
    },

    _continueApplyingPerspective: function (sourceModel, forceChange, perspective) {
      var newPerspective = perspective || sourceModel.get('perspective') || {};
      if (forceChange || this.perspectiveGuide.isNew(this.perspective.attributes, newPerspective)) {
        var viewStateModel = this.viewStateModel;
        viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.ALLOW_WIDGET_URL_PARAMS, true);
        this.triggerMethod('before:change:perspective', this, sourceModel);
        log.info('Perspective has changed') && console.log(log.last);
        this.perspective.clear();
        this.perspective.set(newPerspective);
        this.triggerMethod('change:perspective', this.perspective, sourceModel);
      } else {
        this.suppressFetch();
        this.perspective.set(newPerspective, {silent: true});
        log.info('Perspective has not changed') && console.log(log.last);
        this._destroyTemporaryFactories();
        _.invoke(this._plugins, 'onRefresh');
        this.triggerMethod('retain:perspective', this, sourceModel);
        this.fetch();
      }
    },

    rejectPerspective: function (sourceModel, error) {
      var self = this;

      if (!error) {
        error = sourceModel;
      }
      if (!(error instanceof Error)) {
        error = new base.Error(error);
      }
      this.triggerMethod('error:perspective', this, error);

      function informFailure() {
        self._informFailure(error)
            .then(function () {
              self.trigger('reject:perspective');
            });
      }

      if (sourceModel && sourceModel instanceof Backbone.Model) {
        sourceModel.set('id', -1, {silent: true});
        self.trigger('current:folder:changed', sourceModel);

        require([
          'json!csui/utils/contexts/perspective/impl/perspectives/error.global.json'
        ], function (perspective) {
          log.debug('Showing error perspective for {0}.',
              log.getObjectName(sourceModel)) &&
          console.log(log.last);

          sourceModel.set('perspective', perspective, {silent: true});
          var globalError = self.getModel(GlobalErrorModelFactory);
          globalError.set({
            message: error.message,
            details: error.errorDetails
          });

          self.applyPerspective(sourceModel);
        }, function () {
          informFailure();
        });
      } else {
        informFailure();
      }
    },

    _interceptApplyPerspective: function (sourceModel, forceChange) {
      return this._plugins.reduce(function (promise, plugin) {
        return promise.then(function (result) {
          var forceChange = result.forceChange;
          if (!_.isFunction(plugin.onApply)) {
            return aggregateResult();
          }

          return aggregateResult(plugin.onApply(sourceModel, forceChange));

          function aggregateResult (result) {
            if (result === false) {
              return $.Deferred().reject();
            }
            if (result === true || !result) {
              result = {};
            } else if (result.then) {
              return result.then(aggregateResult);
            }
            if (result.forceChange === undefined) {
              result.forceChange = forceChange;
            }
            return result;
          }
        });
      }, $.Deferred().resolve({ forceChange: forceChange }));
    },

    _informFailure: function (error) {
      var errorHandled = false,
          deferred     = $.Deferred();
      if (error.statusCode === 0) {
        errorHandled = _.find(this._plugins, function (plugin) {
          if (plugin.offlineErrorHandler) {
            return plugin.offlineErrorHandler(error);
          }
        });
      }

      if (!errorHandled) {
        require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
          alertDialog.showError(error.toString())
              .always(deferred.resolve);
        });
      }
      return deferred.promise();
    }
  });

  return PerspectiveContext;
});
