/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper',
  'i18n!greet/commands/hello/impl/nls/lang'
], function (require, _, $, CommandModel, CommandHelper, lang) {
  'use strict';
  var ModalAlert;

  var HelloCommand = CommandModel.extend({

    defaults: {
      signature: 'greet-hello',
      name: lang.toolbarButtonTitle
    },

    enabled: function (status) {
      var node = CommandHelper.getJustOneNode(status);
      return !!node;
    },

    execute: function (status, options) {
      var self = this,
          deferred = $.Deferred();
      require(['csui/dialogs/modal.alert/modal.alert'
      ], function () {
        ModalAlert = arguments[0];
        var node = CommandHelper.getJustOneNode(status),
            message = _.str.sformat(lang.message, node.get('name'));
        ModalAlert
            .showInformation(message, lang.dialogTitle)
            .always(function () {
              deferred.resolve();
            });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  return HelloCommand;

});
