csui.define([
    'csui/lib/underscore',
    'csui/controls/dialog/dialog.view',
    'csui/models/permission/nodepermission.model',
    'csui/widgets/permissions/edit/edit.permission.helper',
    'conws/dialogs/applyrolepermissions/apply.role.permissions.view',
    'csui/widgets/permissions/edit/apply.permission/header/apply.permission.header.view',
    'csui/controls/progressblocker/blocker',
    'i18n!csui/widgets/permissions/impl/nls/lang'
  ], function (_,
      DialogView,
      NodePermissionModel,
      EditPermissionHelper,
      ApplyRolePermissionView,
      ApplyPermissionHeaderView,
      BlockingView,
      lang) {
    "use strict";
  
    var EditRolePermissionHelper = EditPermissionHelper.extend({
  
      constructor: function EditRolePermissionHelper(options) {
        EditPermissionHelper.prototype.constructor.apply(this, arguments);
      },
      
      showApplyPermissionDialog: function () {
        var headerView = new ApplyPermissionHeaderView();
        this._view = new ApplyRolePermissionView({
          context: this.options.context || this.options.originatingView.context,
          model: this.options.nodeModel || this.options.originatingView.model,
          applyTo: this.options.applyTo,
          permissionModel: this.options.permissionModel
        });
        var dialog = new DialogView({
          headerView: headerView,
          view: this._view,
          className: "csui-permissions-apply-dialog",
          midSize: true,
          buttons: [
            {
              id: 'apply',
              label: lang.applyButtonLabel,
              toolTip: lang.applyButtonLabel,
              'default': true,
              click: _.bind(this.onClickApplyButton, this)
            },
            {
              label: lang.cancelButtonLabel,
              toolTip: lang.cancelButtonLabel,
              close: true
            }
          ]
        });
        dialog.listenTo(dialog, 'hide', _.bind(this.onHideDialog, this));
        BlockingView.imbue(dialog);
        return dialog;
      },
  
      onClickApplyButton: function (event) {
        var container        = event.dialog.options.view.model.get("container"),
            right_id         = event.dialog.options.view.options.permissionModel &&
                               event.dialog.options.view.options.permissionModel.get("right_id"),
            apply_to         = (container && event.dialog.options.view.ContentRegion.currentView.getValues().subitems_inherit) ? 2 : 0,
            selectedSubItems = apply_to > 0 ? [204, 207, 215, 298, 3030202] : [];

        var deferredResp = this.triggerMethod('permissions:selected',
            {
              permissions: this.permissions,
              apply_to: apply_to,
              right_id: right_id,
              include_sub_types: selectedSubItems
            });
        this._applyDialog.destroy();
        this._blockActions();
      }      
    });
  
    return EditRolePermissionHelper;
  
  });
  