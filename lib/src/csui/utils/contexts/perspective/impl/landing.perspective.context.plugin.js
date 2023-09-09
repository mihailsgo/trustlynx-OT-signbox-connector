/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/utils/log',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/landing.perspectives',
  'csui/models/perspective/personalization.model'
], function (module, _, log, UserModelFactory, ApplicationScopeModelFactory,
    PerspectiveContextPlugin, landingPerspectives, PersonalizationModel) {
  'use strict';

  log = log(module.id);

  var LandingPerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function LandingPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory)
          .on('change:id', this.onApplicationScopeChanged, this);
      this.userFactory = this.context.getFactory(UserModelFactory);
      this.user = this.userFactory.property;
    },

    onApplicationScopeChanged: function () {
      if (this.applicationScope.id) {
        return;
      }
      if (this.fetching) {
        return;
      }

      this.context.triggerMethod('request:perspective', this);
      var self = this;
      var promise = this.fetching = this.userFactory.fetch({
        success: function () {
          self.onUserFetchSuccess(promise);
        },
        error: function (error) {
          self.onUserFetchFailure(promise, error);
        }
      });
    },

    onUserFetchSuccess: function (promise) {
      if (suppressFetchResult.call(this, promise)) {
        return;
      }
      PersonalizationModel.loadPersonalization(this.user, this.context)
        .then(this._changePerspective.bind(this, this.user),
              this.context.rejectPerspective.bind(this.context));
    },

    onUserFetchFailure: function (promise, error) {
      if (suppressFetchResult.call(this, promise)) {
        return;
      }

      this.context.rejectPerspective(error);
    },

    _changePerspective: function (sourceModel, personalization) {
      var perspectiveModule,
          perspective = landingPerspectives.findByUser(sourceModel);
      if ((_.isEmpty(sourceModel.get('perspective')) && _.isEmpty(personalization)) ||
          perspective.get('important')) {
        perspectiveModule = perspective.get('module');
      }
      if (perspectiveModule) {
        return this.context.overridePerspective(sourceModel, perspectiveModule);
      }
      this.context.applyPerspective(sourceModel, false, personalization);
    }
  });
  function suppressFetchResult(promise) {
    var fetching = this.fetching;
    this.fetching = null;
    if (promise === fetching) {
      return false;
    }
    log.debug('Suppressing the user perspective delivery in {0}.', this.cid) && console.log(log.last);
    var error = new Error('Earlier user navigation suppressed.');
    this.context.triggerMethod('error:perspective', this, error);
    return true;
  }

  return LandingPerspectiveContextPlugin;
});
