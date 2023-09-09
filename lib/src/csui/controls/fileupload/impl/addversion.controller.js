/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'i18n!csui/controls/fileupload/impl/nls/lang',
  'csui/controls/fileupload/impl/upload.controller',
  'csui/models/fileupload',
  'csui/controls/globalmessage/globalmessage',
  'csui/models/fileuploads',
  'csui/utils/base',
  'csui/utils/url',
  'csui/utils/types/date',
  'csui/utils/types/member',
  'csui/lib/moment',
  "csui/models/version",
  'csui/utils/commandhelper',
  'csui/utils/contexts/factories/usernodepermission',
  'csui/utils/contexts/factories/connector',
  'csui/models/node/node.model'
], function (_,
    $,
    lang,
    UploadController,
    FileUploadModel,
    GlobalMessage,
    UploadFileCollection,
    base,
    Url,
    date,
    member,
    moment,
    VersionModel,
    CommandHelper,
    UserNodePermissionFactory,
    ConnectorFactory,
    NodeModel) {
  'use strict';

  function AddVersionController(options) {
    this.view = options.view;
    this.selectedNode = options.selectedNode;
    this.status = options.status || {};
    this.context = this.status.context || this.view.context;
    this.status.connector = this.context.getObject(ConnectorFactory);

    this.uploadController = new UploadController({
      container : this.view.container,
      context: this.context,
      originatingView : this.view
    });
  }

  _.extend(AddVersionController.prototype, {

    uploadFile: function (file, config) {
      var deferred = $.Deferred();
      this.status.actionType = config.actionType;
      this.status.hideWarningAlert = config.hideWarningAlert;
      this.currentLoggedInUserId = this.context.getModel('user').id;
      this.currentModel = this.selectedNode;

      this._ensureNodeAdvanceInfo().then(_.bind(function () {
        if (!this.currentModel.get('advanced_versioning') && this.currentModel.get('reserved')) {
          this._doUpload(file).done(deferred.resolve).fail(deferred.reject);
        } else {
          this._getLatestVersionAndUploadFile(file, this.status).done(deferred.resolve).fail(
              deferred.reject);
        }

      }, this));

      return deferred.promise();
    },

    _doUpload: function (file) {

      var deferred = $.Deferred();
      this._blockActions();
      var node      = this.selectedNode,
          fileModel = new FileUploadModel({
            file: file
          }, {
            node: node
          });

      file.add_major_version && fileModel.set('add_major_version', true);
      var uploadFiles = new UploadFileCollection([fileModel]);
      var largeFileSettings = this.view && this.view.largeFileSettingsModel && this.view.largeFileSettingsModel.get('largeFileSettings');
      var minFileSize = largeFileSettings && largeFileSettings.min_size;
      var size = file.size || fileModel.get('file').size;
      var self = this;
      if (size > minFileSize) {

        var largeFile = {
          size: size,
          uploadKey: "",
          state: "pending",
          retryCount: 0,
          fileChunks: {
            slicedFiles: [],
            total: 0
          }
        };
        fileModel.set('largeFile', largeFile);
      }
      this.uploadController.scheduleFileForUpload(fileModel);
      GlobalMessage.showProgressPanel(uploadFiles, {actionType: this.status.actionType});
      fileModel.promise().then(function (fileUploadModel) {
        if (node.versions || (!!node.attributes && !!node.attributes.versions)) {
            return fileUploadModel.version
            .fetch()
            .then(function (response) {
              return fileUploadModel.version;
            });
          }
      })
          .then(function (version) {
            if (node.versions || (!!node.attributes && !!node.attributes.versions)) {
              var sizeinbytes = version.get('file_size'),
                  sizeinkb    = base.formatFileSize(sizeinbytes);
              version.set('file_size_formatted', sizeinkb);
              version.isLocallyCreated = true;
              fakeActions(node, version);
              !!node.versions && node.versions.add(version, {at: 0});
              if (Array.isArray(node.get('versions'))) {
                !!node.attributes && !!node.attributes.versions &&
                node.attributes.versions.push(version.attributes);
              }

            }
          })
          .then(function () {
            return true;
          })
          .then(function () {
            return true;
          })
          .done(function () {
            GlobalMessage.hideFileUploadProgress();
            self.view && self.view.trigger('new:version:added');
            GlobalMessage.showMessage('success', lang.MessageVersionAdded);
            deferred.resolve();
          }).fail(function (error) {
        deferred.reject(error);
      }).always(_.bind(this._unblockActions, this));

      return deferred.promise();
      function fakeActions(node, version) {
        var actions = [];
        if (node.actions.findRecursively('download') || node.actions.findRecursively('Download')) {
          actions.push({signature: 'versions_download'}, {signature: 'versions_open'});
        }
        if (node.actions.findRecursively('delete') || node.actions.findRecursively('Delete')) {
          actions.push({signature: 'versions_delete'});
        }
        if (node.actions.findRecursively('properties') ||
            node.actions.findRecursively('Properties')) {
          actions.push({signature: 'versions_properties'});
        }
        version.actions.reset(actions);
      }
    },

    _checkAdvancedVersionAndUpload: function (file, status, latestVersion) {
      var self     = this,
          node     = this.currentModel,
          deferred = $.Deferred();
          self._getNodePermission().done(function (result){
            var permissionsForNode= result.results.data.permissions.permissions;
            if (node.get('advanced_versioning') && permissionsForNode.indexOf("add_major_version")!==-1) {
              self._promoteToSelectVersion(file, status, latestVersion).done(function () {
                self._doUpload(file).done(deferred.resolve).fail(deferred.reject);
              });
            } else {
              self._doUpload(file).done(deferred.resolve).fail(deferred.reject);
            }
          }).fail(function (resp) {
            deferred.reject(resp);
          });
      return deferred.promise();
    },

    _promoteToSelectVersion: function (file, status, latestVersion) {
      var self     = this,
          node     = this.currentModel,
          deferred = $.Deferred();
      require([
        'csui/controls/version.control.dialog/version.control.dialog.view',
        'csui/controls/version.control.dialog/add.version.control.view'
      ], function (VersionControlDialogView, VersionUpdateView) {
        _selectVersioning().done(function (result) {
          if (result.promoteToMajor) {
            file.add_major_version = true;
          }
          if (result.reserved) {
            CommandHelper.updateNode(node, {
              reserved_user_id: null
            });
          }
          deferred.resolve();
        }).fail(function () {
          deferred.reject();
        });

        function _selectVersioning() {
          var options               = {
                "latestVersion": latestVersion,
                "fileName": file.name,
                "reserved": node.get('reserved')
              },
              view                  = new VersionUpdateView(options),
              versionControloptions = {
                _view: view,
                standardHeader: false,
                title: lang.warnTitle,
                dialogClassName: 'csui-add-version-control',
                actionBtnLabel: lang.AddButtonLabel,
                cancelBtnLabel: lang.cancelButtonLabel
              };
          return new VersionControlDialogView(versionControloptions).show();
        }
      }, self);
      return deferred.promise();
    },

    _ensureNodeAdvanceInfo: function () {
      var deferred            = $.Deferred(),
          node                = this.currentModel,
          advanced_versioning = node.get('advanced_versioning');
      if (advanced_versioning === undefined) {
        var tempNode = new NodeModel({id:node.get('id')}, {connector: node.connector});
        tempNode.fetch({silent: true}).done(function () {
          node.set('advanced_versioning',tempNode.get('advanced_versioning'),{silent:true});
          deferred.resolve();
        }).fail(function () {
          deferred.reject();
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },

    dialogClassName: function () {
      var className = 'addversion-fornonreserve';
      return className;
    },

    _showWarnDialog: function (status, version) {
      var self     = this,
          deferred = $.Deferred();
      require([
        'csui/controls/version.control.dialog/version.control.dialog.view',
      ], function (VersionControlDialogView) {
        var versionControloptions = {
          title: lang.warnTitle,
          bodyMessage: self._getBodyMessage(version),
          dialogClassName: self.dialogClassName(),
          actionBtnLabel: lang.AddButtonLabel,
          cancelBtnLabel: lang.cancelButtonLabel
        };
        new VersionControlDialogView(versionControloptions).show()
            .done(deferred.resolve)
            .fail(deferred.reject);
      }, self);
      return deferred.promise();
    },

    _getBodyMessage: function (version) {
      var currentDate   = moment(),
          versDate      = date.deserializeDate(version.get('create_date')),
          difference    = currentDate.diff(versDate, 'days'),
          version_owner = member.formatMemberName(
              version.get('owner_id_expand') || version.get('owner_id'));

      if (difference >= 4) {
        versDate = date.formatExactDate(versDate);
      } else if (difference >= 2) {
        versDate = date.formatFriendlyDateTimeNow(versDate) + " " + date.formatExactTime(versDate);
      } else {
        versDate = date.formatDateTime(versDate);
      }

      return _.str.sformat(lang.warnMessage, version_owner, versDate);
    },

    _getLatestVersionAndUploadFile: function (file, status) {
      var self     = this,
          deferred = $.Deferred();
      self._getLatestVersion(status).done(function (latestVersion) {
        if (self.currentLoggedInUserId === latestVersion.get('owner_id')) {
          self._checkAdvancedVersionAndUpload(file, status, latestVersion).done(
              deferred.resolve).fail(
              deferred.reject);
        } else {
          if (!self.currentModel.get('advanced_versioning') && !self.status.hideWarningAlert) {
            self._showWarnDialog(status, latestVersion)
                .done(_.bind(
                    function () {
                      self._checkAdvancedVersionAndUpload(file, self.status, latestVersion).done(
                          deferred.resolve).fail(deferred.reject);
                    }
                ), self);
          } else {
            self._checkAdvancedVersionAndUpload(file, self.status, latestVersion).done(
                deferred.resolve).fail(
                deferred.reject);
          }

        }
      });
      return deferred.promise();
    },

    _getLatestVersion: function (status) {
      var deferred     = $.Deferred(),
          connector    = status.connector,
          node         = this.currentModel,
          versionModel = new VersionModel({
            id: node.get("id"),
            version_number: 0,
            expand: encodeURIComponent('versions{owner_id}')
          }, {connector: connector});
      versionModel.fetch().then(_.bind(function (resp, status, jqXHR) {
        deferred.resolve(new VersionModel(resp, {parse: true}));
      }, function (resp) {
        deferred.reject(resp);
      }));
      return deferred.promise();
    },

    _getNodePermission: function () {
      var nodePermission = this.context.getObject(UserNodePermissionFactory, {
        node:this.currentModel
      });
      return nodePermission.fetch();
    },

    _blockActions: function () {
      this.view && this.view.blockActions && this.view.blockActions();
    },

    _unblockActions: function () {
      this.view && this.view.unblockActions && this.view.unblockActions();
    }

  });

  return AddVersionController;

});
