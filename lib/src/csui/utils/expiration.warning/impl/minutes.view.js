/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module',
    'csui/lib/underscore', 'csui/lib/marionette',
    'csui/utils/log',
    'csui/lib/handlebars'
  ], function (module, _, Marionette,
            log, Handlebars) {
    'use strict';
    log = log(module.id);    
    var TimeValueMinutesView = Marionette.ItemView.extend({
      className: 'csui-time-value-min-value',

      tagName: 'span',

      modelEvents: {
        "change": "render"
      },

      template: Handlebars.compile('{{timeValueMinutes}}'),

      templateHelpers: function() {
        return { timeValueMinutes: this.model.get('minutes') };
      },

      constructor: function TimeValueMinutesView(options) {
        options || (options = {});
        Marionette.ItemView.prototype.constructor.call(this, options);
      },

    });

    return TimeValueMinutesView;
});
