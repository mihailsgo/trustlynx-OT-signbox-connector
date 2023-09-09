/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "module", "csui/lib/underscore",
  'i18n!csui/utils/commands/nls/lang',
  "i18n!csui/utils/commands/nls/localized.strings",
   "csui/utils/commands/unreserve",
   "csui/models/command",
   "csui/utils/commandhelper"
], function (module, _,  publicLang, lang, UnreserveCommand,CommandModel, CommandHelper) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 2
  });

  var UnlockCommand = UnreserveCommand.extend({
    defaults: {
      signature: "Unlock",
      command_key: ['unreserve','Unlock'],
      name: publicLang.CommandNameUnlock,
      verb: lang.CommandVerbUnlock,
      pageLeavingWarning: lang.UnlockPageLeavingWarning,
      scope: "multiple",
      successMessages: {
        formatForNone: publicLang.UnlockItemsNoneMessage,
        formatForOne: publicLang.UnlockOneItemSuccessMessage,
        formatForTwo: publicLang.UnlockSomeItemsSuccessMessage,
        formatForFive: publicLang.UnlockManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: publicLang.UnlockItemsNoneMessage,
        formatForOne: publicLang.UnlockOneItemFailMessage,
        formatForTwo: publicLang.UnlockSomeItemsFailMessage,
        formatForFive: publicLang.UnlockManyItemsFailMessage
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

  return UnlockCommand;
});