/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "module", "csui/lib/underscore",
  'i18n!csui/utils/commands/nls/lang',
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commands/reserve",
  "csui/models/command",
  "csui/utils/commandhelper"
], function (module, _, publicLang, lang, ReserveCommand, CommandModel, CommandHelper) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 2
  });

  var LockCommand = ReserveCommand.extend({
    defaults: {
      signature: "Lock",
      command_key: ['reserve','Lock'],
      name: publicLang.CommandNameLock,
      verb: lang.CommandVerbLock,
      pageLeavingWarning: lang.LockPageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.LockItemsNoneMessage,
        formatForOne: publicLang.LockOneItemSuccessMessage,
        formatForTwo: publicLang.LockSomeItemsSuccessMessage,
        formatForFive: publicLang.LockManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.LockItemsNoneMessage,
        formatForOne: publicLang.LockOneItemFailMessage,
        formatForTwo: publicLang.LockSomeItemsFailMessage,
        formatForFive: publicLang.LockManyItemsFailMessage
      }
    },
    enabled: function (status) {
      var isReleaseOrRevision = _.find(CommandHelper.getAtLeastOneNode(status).models, function (node, index) {
        return _.contains([138, 139], node.get('type'));
      });
      if (isReleaseOrRevision) {
        return CommandModel.prototype.enabled.apply(this, arguments);
      }
      else {
        return false;
      }
    }
  });

  return LockCommand;
});