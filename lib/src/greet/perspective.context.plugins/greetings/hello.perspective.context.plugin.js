/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/application.scope.factory',
  'greet/widgets/greeting/greeting.subject.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin'
], function (_, Backbone, ApplicationScopeModelFactory,
    GreetingSubjectModelFactory, PerspectiveContextPlugin) {
  'use strict';

  var HelloPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function LandingPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory)
          .on('change', this._fetchHelloPerspective, this);
      this.greetingSubject = this.context
          .getModel(GreetingSubjectModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change:id', this._fetchHelloPerspective, this);
    },

    _fetchHelloPerspective: function () {
      var subject = this.greetingSubject.get('id');
      if (!subject && this.applicationScope.id !== 'greetings') {
        return;
      }
      this.applicationScope.set('id', 'greetings');
      var perspectivePath = 'json!greet/perspective.context.plugins/greetings/impl/perspectives/',
          perspectiveModule = subject ? 'one.greeting.json' : 'all.greetings.json';
      this.context.loadPerspective(perspectivePath + perspectiveModule);
    }

  });

  return HelloPerspectiveContextPlugin;

});
