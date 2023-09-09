/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["require", "csui/lib/jquery", "csui/lib/underscore",
  "csui/utils/url", "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/log", "csui/utils/base", "csui/utils/commandhelper",
  'csui/models/node/node.model',
  'csui/dialogs/file.open/file.open.dialog'
], function (require, $, _, URL, lang, log, base, CommandHelper,
  NodeModel, FileOpenDialog) {
  'use strict';

  var AddMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        _selectFilesForUpload: function (status, options) {
          var fileOpenDialog,
              deferred = $.Deferred();
          var container = status.container || options.container;
          if (container && container.get('type') === 136 && !container.get("fileOrder")) { //fetch order_next value before each upload set
            var url = container.connector.getConnectionUrl().getApiBase('v2'),
              query = URL.combineQueryString({
                fields: ['properties{order_next}'],
              }),
            ajaxOptions = {
              url: URL.combine(url, 'nodes', container && container.get('id'), '?' + query),
              type: 'GET',
              contentType: 'application/x-www-form-urlencoded'
            };
            container && container.connector.makeAjaxCall(ajaxOptions).always(function (resp) {
                resp.results && container.set("order_next", resp.results.data.properties.order_next);
            });
          }
          require(['csui/controls/globalmessage/globalmessage'
          ], function (GlobalMessage) {
            if (GlobalMessage.isActionInProgress(options.actionType, lang.UploadNotAllowed,
                lang.CommandTitleAdd)) {
              return deferred.resolve();
            }
            fileOpenDialog = new FileOpenDialog({multiple: true});
            deferred.resolve(); // resolve immediately because fileOpenDialog can't trigger anything
            fileOpenDialog
              .listenTo(fileOpenDialog, 'add:files', function (files) {
                require(['csui/controls/fileupload/fileupload'
                ], function (fileUploadHelper) {
                  deferred.resolve();
                  var uploadController = fileUploadHelper.newUpload(status, options);
                  uploadController.addFilesToUpload(files, {
                    collection: status.collection,
                    excludeAddVersion: options.excludeAddVersion,
                    excludeAddVersionforFolders: options.excludeAddVersion
                  });
                  uploadController.listenTo(uploadController, 'destroy', function () {
                    fileOpenDialog.destroy();
                  });
                });
              }).show();
          });
          return deferred.promise();
        },
        _getAddableTypeName: function (status, options) {
          if (options.addableTypeName) {
            return options.addableTypeName;
          }
          var addableType = status.data.addableTypes.findWhere({
            type: options.addableType
          });
          return addableType.get('type_name');
        }

      });

    }
  };

  return AddMixin;

});
