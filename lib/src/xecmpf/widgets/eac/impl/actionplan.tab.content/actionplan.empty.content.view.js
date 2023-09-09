/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'hbs!xecmpf/widgets/eac/impl/actionplan.tab.content/impl/actionplan.empty.view',
  'i18n!xecmpf/widgets/eac/impl/nls/lang',
  'css!xecmpf/widgets/eac/impl/actionplan.tab.content/impl/actionplan.empty.view'
], function (_, $, Marionette, emptyContentTemplate, lang) {


  var EmptyContentView = Marionette.ItemView.extend({

    constructor: function EmptyContentView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    className: 'xecmpf-actionplan-emptyContent-view',

    template: emptyContentTemplate,

    templateHelpers: function() {
      return {
        emptyContentMsg: lang.configureActionPlanText
      };
    }

  });

  return EmptyContentView;

});
