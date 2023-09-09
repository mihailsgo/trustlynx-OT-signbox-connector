/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command', 'csui/utils/commandhelper',
  'i18n!csui/utils/commands/versions/nls/localized.strings'
], function ($, _, CommandModel, CommandHelper, lang) {
  'use strict';

  var OpenVersionPerspectiveCommand = CommandModel.extend({

    defaults: {
        signature: 'OpenVersionPerspective'
    },

    enabled: function (status) {
        var version = CommandHelper.getJustOneNode(status);
        return version && version.get('id') && version.get('version_number');
    },

    execute: function (status, options) {
      var deferred = $.Deferred();

      var context = status.context || options && options.context,
          nextVersion = context.getModel('nextVersion'),
          version = CommandHelper.getJustOneNode(status);

      if (!version || !version.get('id') || !version.get('version_number')) {
        deferred.reject({message: lang.MissingVersionInfo});
        return;
      }

      nextVersion.set({ id: version.get('id'), version_number: version.get('version_number') });
      deferred.resolve();

      return deferred.promise();
    }

  });

  return OpenVersionPerspectiveCommand;

});
