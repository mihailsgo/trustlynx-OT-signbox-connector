/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/application.scope.factory',
  'greet/widgets/greeting/greeting.subject.factory'
], function (PerspectiveRouter, ApplicationScopeModelFactory,
    GreetingSubjectModelFactory) {
  'use strict';

  var HelloPerspectiveRouter = PerspectiveRouter.extend({

    routes: {
      'greetings': 'openAllGreetings',
      'greetings/:id': 'openOneGreeting'
    },

    constructor: function HelloPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change', this._updateUrl);

      this.greetingSubject = this.context.getModel(GreetingSubjectModelFactory);
      this.listenTo(this.greetingSubject, 'change', this._updateUrl);
    },

    openAllGreetings: function () {
      this.greetingSubject.clear();
      this.applicationScope.set('id', 'greetings');
    },

    openOneGreeting: function (id) {
      this.greetingSubject.set('id', id);
    },

    onOtherRoute: function () {
      this.greetingSubject.clear({silent: true});
    },

    _updateUrl: function () {
      var subject = this.greetingSubject.get('id');
      if (!subject && this.applicationScope.id !== 'greetings') {
        return;
      }
      var url = 'greetings';
      if (subject) {
        url += '/' + subject;
      }
      this.navigate(url);
    }

  });

  return HelloPerspectiveRouter;

});
