/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'hbs!xecmpf/utils/commands/workflows/dialog/header'
], function (_, $, Marionette, HeaderTemplate) {

  var DialogHeaderView = Marionette.ItemView.extend({

    template: HeaderTemplate,

    templateHelpers: function () {
      return {
        title: this.options.title
      };
    },

    constructor: function DialogHeaderView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }

  });

  return DialogHeaderView;
});
