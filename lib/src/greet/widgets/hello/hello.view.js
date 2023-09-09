/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',                           // Cross-browser utility belt
  'csui/lib/marionette',                           // MVC application support
  'greet/widgets/hello/impl/hello.model.factory',  // Factory for the data model
  'i18n!greet/widgets/hello/impl/nls/hello.lang',  // Use localizable texts
  'hbs!greet/widgets/hello/impl/hello',            // Template to render the HTML
  'css!greet/widgets/hello/impl/hello'             // Stylesheet needed for this view
], function (_, Marionette, HelloModelFactory, lang, template) {
  var HelloView = Marionette.ItemView.extend({
    className: 'greet-hello panel panel-default',
    template: template,
    templateHelpers: function () {
      var message = this.model.get('id') ?
                    _.str.sformat(lang.helloMessage,
                        this.model.get('first_name'),
                        this.model.get('last_name')) :
                    lang.waitMessage;
      return {
        message: message
      };
    },
    constructor: function HelloView(options) {
      options.model = options.context.getModel(HelloModelFactory);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this.model, 'change', this.render);
    }

  });

  return HelloView;

});
