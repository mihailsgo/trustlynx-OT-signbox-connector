/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',                             // Cross-browser utility belt
  'csui/lib/marionette',                             // MVC application support
  'greet/widgets/greeting/greeting.subject.factory', // Factory for the data model
  'i18n!greet/widgets/greeting/impl/nls/lang',       // Use localizable texts
  'hbs!greet/widgets/greeting/impl/greeting',        // Template to render the HTML
  'css!greet/widgets/greeting/impl/greeting'         // Stylesheet needed for this view
], function (_, Marionette, GreetingSubjectModelFactory, lang, template) {
  var GreetingView = Marionette.ItemView.extend({
    className: 'greet-greeting panel panel-default',
    template: template,
    serializeData: function () {
      return {
        message: _.str.sformat(lang.helloMessage, this.model.get('id'))
      };
    },
    constructor: function GreetingView(options) {
      options.model = options.context.getModel(GreetingSubjectModelFactory);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this.model, 'change', this.render);
    }

  });

  return GreetingView;

});
