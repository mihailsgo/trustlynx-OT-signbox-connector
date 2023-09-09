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
    var TimeValueSecondsView = Marionette.ItemView.extend({
        className: 'csui-time-value-sec-value',

        tagName: 'span',

        modelEvents: {
          "change": "render"
        },  
      
        template: Handlebars.compile('{{timeValueSeconds}}'),
  
        templateHelpers: function() {
          return { timeValueSeconds: this.model.get('seconds') };
        },

        constructor: function TimeValueSecondsView(options) {
          options || (options = {});
  
          Marionette.ItemView.prototype.constructor.call(this, options);
        },

      });

    return TimeValueSecondsView;
});
