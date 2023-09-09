/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command', 'i18n!csui/utils/commands/nls/localized.strings'
], function (module, require, $, _, CommandModel, lang) {
  'use strict';

  var BackToLastFragment = CommandModel.extend({

    defaults: {
      signature: 'BackToLastFragment',
      name: lang.GoBack
    },

    enabled: function (status, options) {

      var config = _.extend({
            enabled: false
          }, module.config()),
          context = status.context || options && options.context;

      if (!context || !config.enabled) {
        return false;
      }

      var viewStateModel = context && context.viewStateModel;
      if (viewStateModel) {
        return !!viewStateModel.getLastHistoryEntry();
      }
    },

    execute: function (status, options) {
      var context = status.context || options && options.context,
          viewStateModel = context && context.viewStateModel;

      if (viewStateModel) {
        viewStateModel.set('browsing', true);
        viewStateModel.restoreLastFragment();
      }

      return $.Deferred().resolve().promise();
    }

  });

  return BackToLastFragment;

});
