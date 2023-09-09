/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!csui/utils/commands/versions/nls/localized.strings',
  'csui/utils/commandhelper', 'csui/utils/commands/delete',
], function (require, module, _, $, versionLang, CommandHelper, DeleteCommand) {
  'use strict';

  var VersionDeleteCommand = DeleteCommand.extend({
    defaults: {
      signature: 'VersionDelete',
      command_key: ['versions_delete','Delete'],
      name: versionLang.CommandNameVersionDelete,
      verb: versionLang.CommandVerbVersionDelete,
      pageLeavingWarning: versionLang.DeleteVersionPageLeavingWarning,
      scope: 'multiple',
      successMessages: {
        formatForNone: versionLang.DeleteVersionItemsNoneMessage,
        formatForOne: versionLang.DeleteVersionOneItemSuccessMessage,
        formatForTwo: versionLang.DeleteVersionSomeItemsSuccessMessage,
        formatForFive: versionLang.DeleteVersionManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: versionLang.DeleteVersionItemsNoneMessage,
        formatForOne: versionLang.DeleteVersionOneItemFailMessage,
        formatForTwo: versionLang.DeleteVersionSomeItemsFailMessage,
        formatForFive: versionLang.DeleteVersionManyItemsFailMessage
      }
    },

    enabled: function (status, options) {
      if (!VersionDeleteCommand.__super__.enabled.apply(this, arguments)) {
        return false;
      }
      var selectedVersions = CommandHelper.getAtLeastOneNode(status);

      if(selectedVersions.length > 0) {
        if(status.container && status.container.versions) {
          return status.container.versions.allModels &&
          selectedVersions.length < status.container.versions.allModels.length;
        } else {
          return selectedVersions.length == 1;
        }
      }

      return false;
    },

    _getConfirmData: function (status, options) {
      var versions = CommandHelper.getAtLeastOneNode(status);
      var message;
      if(versions.length === 1) {
        var versionNumber = versions.at(0).get('version_number_name'),
            parentNodeName = (status.container && status.container.get('name') || versions.at(0).get    ('id_expand') && versions.at(0).get('id_expand').name);
        message = _.str.sformat(versionLang.VersionDeleteCommandConfirmDialogSingleMessage,
          versionNumber,parentNodeName);
      } else {
        message =  _.str.sformat(versionLang.VersionDeleteCommandConfirmDialogMultipleMessage,
          versions.length);
      }
      return {
        title: versionLang.DeleteCommandConfirmDialogTitle,
        message: message
      };
    },

    startGlobalMessage: function (uploadCollection) {
      require([
        'csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        GlobalMessage.showFileUploadProgress(uploadCollection, {
          oneFileTitle: versionLang.DeletingOneVersion,
          oneFileSuccess: versionLang.DeleteVersionOneItemSuccessMessage,
          multiFileSuccess: versionLang.DeleteVersionManyItemsSuccessMessage,
          oneFilePending: versionLang.DeletingOneVersion,
          multiFilePending: versionLang.DeleteVersions,
          oneFileFailure: versionLang.DeleteVersionOneItemFailMessage,
          multiFileFailure: versionLang.DeleteVersionManyItemsFailMessage,
          someFileSuccess: versionLang.DeleteVersionSomeItemsSuccessMessage,
          someFilePending: versionLang.DeletingSomeVersions,
          someFileFailure: versionLang.DeleteVersionSomeItemsFailMessage,
          enableCancel: false
        });
      });
    }
  });

  return VersionDeleteCommand;
});
