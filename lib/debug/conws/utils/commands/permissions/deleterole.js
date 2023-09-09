csui.define([
  'require',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/commands/permissions/delete.permission',
  'csui/utils/command.error',
  'csui/controls/globalmessage/globalmessage',
  'conws/utils/commands/permissions/permissions.util',
  'i18n!conws/utils/commands/nls/commands.lang',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (require, $, _, Backbone, DeletePermissionCommand, CommandError, GlobalMessage, PermissionsUtil, lang, csuilang) {
  'use strict';

  var DeleteRoleCommand = DeletePermissionCommand.extend({

    defaults: {
      signature: 'DeleteRole',
      name: lang.CommandNameDeleteRole,
      scope: 'single'
    },

    enabled: function (status) {
      var permissionModel = status.model,
          isWorkspaceRole = PermissionsUtil.isWorkspaceRole(permissionModel),
          permissionType  = permissionModel && permissionModel.get('type'),
          nodeModel       = status.nodeModel || (status.originatingView && 
                                                status.originatingView.model),
          isWorkspace = PermissionsUtil.isWorkspace(nodeModel),
          isInheritedRole = PermissionsUtil.isInheritedRole(nodeModel, permissionModel),
          isLeaderRole = PermissionsUtil.isLeaderRole(nodeModel, permissionModel),
          canDeleteRole = !isLeaderRole;
          /*If the Leader Role is the only Role available in View Permissions page, then we are enabling delete command for that Role.
            If it is associated with other Roles then disabling delete command for Leader Role and for other Roles no restriction.
          */
         if (isLeaderRole) {
          var extraMemberModels = status.originatingView && status.originatingView.collection && status.originatingView.collection.extraMemberModels;
          canDeleteRole = extraMemberModels && extraMemberModels.length === 1;
         }
          var enabled         = permissionType && permissionType === "custom" && isWorkspaceRole && canDeleteRole &&
                            nodeModel.actions && !!nodeModel.actions.get({signature: 'editpermissions'});

      // For subitems and inherited roles we need to update the title.
      if ((!isWorkspace && isWorkspaceRole) || (isWorkspace && isInheritedRole)) {
        status.toolItem.set("name", lang.DeletePermissionCommandForSubItems);
      }
      return enabled;
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          self     = this;
      options || (options = {});
      // avoid messages from handleExecutionResults
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;

      require([
        'csui/controls/globalmessage/globalmessage',
        'conws/dialogs/applyrolepermissions/apply.role.permissions.view',
        'conws/dialogs/applyrolepermissions/impl/header/apply.role.permissions.header.view',
        'csui/controls/progressblocker/blocker',
        'csui/controls/dialog/dialog.view',
        'csui/utils/permissions/permissions.precheck'
      ], function (localGlobalMessage, ApplyRolePermissionView, ApplyRolePermissionsHeaderView,
          BlockingView, DialogView, PermissionPreCheck) {
        GlobalMessage = localGlobalMessage;

        var permissionModel = status.model,
          nodeModel = status.nodeModel || (status.originatingView &&
            status.originatingView.model),
          isWorkspace = PermissionsUtil.isWorkspace(nodeModel),
          isWorkspaceRole = PermissionsUtil.isWorkspaceRole(permissionModel),
          isInheritedRole = PermissionsUtil.isInheritedRole(nodeModel, permissionModel);

        if (isWorkspace && isWorkspaceRole && !isInheritedRole) {
          permissionModel.isRoleDelete = true;
        }else{
          permissionModel.isRoleDelete = false;
        }

        if ( status.originatingView && status.originatingView.model &&
            status.originatingView.model.get("container")) {
          options.removePermission = true;
          self._executeDeletePermission(status, options, ApplyRolePermissionsHeaderView,
            ApplyRolePermissionView, BlockingView, DialogView, PermissionPreCheck)
              .then(deferred.resolve, deferred.reject);
        } else {
          self._deletePermission(status, options).then(deferred.resolve, deferred.reject);
        }
      }, deferred.reject);
      return deferred.promise();
    },

    _performActions: function (status, options) {
      var self            = this,
          deferred        = $.Deferred(),
          permissionModel = status.dialog ? status.dialog.options.view.options.permissionModel :
                            status.model,
          permissionType  = permissionModel.get('type'),
          collection      = permissionModel.collection,
          failureMsg      = this._getMessageWithUserDisplayName(
            csuilang.DeletePermissionCommandFailMessage, permissionModel),
          deleteAttr,successMsg;

      if (collection && collection.options && collection.options.node &&
          collection.options.node.actions.get({signature: 'editpermissions'})) {
        permissionModel.nodeId = collection.options && collection.options.node &&
                                 collection.options.node.get('id');
        var url, container           = collection.options && collection.options.node &&
                                  collection.options.node.get("container"),
            permissionModelType = collection.options && collection.options.node &&
                                  collection.options.node.get("permissions_model");
 
        if (status.dialog && !permissionModel.isRoleDelete) {
          permissionModel.apply_to = (container && status.dialog.options.view.ContentRegion.currentView.getValues().subitems_inherit) ? 2 : 0,
          permissionModel.include_sub_types = permissionModel.apply_to > 0  ? [204, 207, 215, 298, 3030202] : [];
        }

        url = permissionModel.url();

        if ( permissionModel.isRoleDelete ) {
          permissionModel.action = 'delete';
          url = PermissionsUtil.getUrl(permissionModel);
          failureMsg = this._getMessageWithUserDisplayName(lang.DeleteRoleCommandFailMessage, permissionModel);
        }

        if (self.originatingView && self.originatingView.blockActions) {
          self.destroyDialog(status);
          self.originatingView.blockActions();
        }
        
        var jqxhr = permissionModel.destroy({
          url: url,
          wait: true
        }).done(function (response) {
          //update the results
          permissionModel.set('results', response.results);
          self.originatingView && self.originatingView.trigger('permission:changed', self);
          if (self.originatingView && self.originatingView.unblockActions) {
            self.originatingView.unblockActions();
          }

          var targetModel = permissionModel.get("right_id_expand");
          if (targetModel && targetModel.id && self.originatingView && self.originatingView.collection && self.originatingView.collection.extraMemberModels) {
            self.originatingView.collection.extraMemberModels = _.reject(self.originatingView.collection.extraMemberModels, function (model) {
              return model.id === targetModel.id;
            });
          }

          if( permissionModel.isRoleDelete ){
            successMsg = self._getMessageWithUserDisplayName(lang.DeleteRoleCommandSuccessMessage, permissionModel);
          }else{
            successMsg = self._getMessageWithUserDisplayName(
              permissionModel.get('results') && permissionModel.get('results').success > 0 ?
              csuilang.DeletePermissionCommandSuccessMessageWithCount :
              csuilang.DeletePermissionCommandSuccessMessage, permissionModel);
          }          
          GlobalMessage.showMessage('success', successMsg);
          if (permissionType === "owner" || permissionType === "group") {
            //Check & Process for no owner condition
            collection.processForEmptyOwner && collection.processForEmptyOwner();
          }
          //self.destroyDialog(status);
          deferred.resolve(permissionModel);

        }).fail(function (error) {
          var commandError = error ? new CommandError(error, permissionModel) :
                             error;
          self.handleFailure(commandError, failureMsg);
          deferred.reject(permissionModel, commandError);
          if (!error) {
            jqxhr.abort();
          }
        }).always(function () {
          if (self.originatingView && self.originatingView.unblockActions) {
            self.originatingView.unblockActions();
          }
        });
        return deferred.promise();
      }
      else {
        self.destroyDialog(status);
        return deferred.reject(
            new CommandError(failureMsg, {errorDetails: csuilang.undefinedCollection}));
      }
    },

    handleFailure: function (commandError, oneFileFailure) {
      var errObject = Backbone.Model.extend({
            defaults: {
              name: "",
              state: 'pending',
              commandName: 'ViewPermission'
            }
          }),
          errObjects;

      var failedPermissionsCollection = Backbone.Collection.extend({
        model: errObject
      });
      var errCollection = new failedPermissionsCollection();
      errObjects = new errObject({
        name: commandError,
        mime_type: '',
        state: 'rejected'
      });
      errCollection.add(errObjects);
      GlobalMessage.showPermissionApplyingProgress(errCollection, {oneFileFailure: oneFileFailure});
    }
  });

  return DeleteRoleCommand;
});



