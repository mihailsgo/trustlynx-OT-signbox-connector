/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'csui/widgets/permissions/edit/edit.permission.helper',
  'csui/utils/commandhelper',
  'csui/utils/commands',
  'i18n!csui/controls/table/cells/permission/impl/nls/localized.strings',
  'hbs!csui/controls/table/cells/permission/impl/permission.level'
], function ($, _, Backbone, Marionette, TemplatedCellView, cellViewRegistry, EditPermissionHelper,
    CommandHelper, commands, lang, template) {
  'use strict';

  var PermissionLevelCellView = TemplatedCellView.extend({

    template: template,

    ui: {
      permissionLevel: '.csui-permission-level',
      permissionTree: '.csui-tree'
    },

    events: {
      'click @ui.permissionLevel': 'onClickPermissionLevel',
      'keydown': 'onKeyInView'
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.$el.find('.csui-permission-level').trigger('click');
      }
    },

    getValueData: function () {
      var permissions_level_array = this.model.get("permissions"),
          value                   = this.model.getPermissionLevel(
              permissions_level_array), ownername;
      if (this.model.get("type") === "public") {
        ownername = lang.publicaccess;
      } else {
        ownername = (!!this.model && !!this.model.get('right_id_expand')) ?
                    this.model.get('right_id_expand').name : '';
      }

      if (value === null) {
        return TemplatedCellView.prototype.getValueData.apply(this, arguments);
      } else {
        value = this.getPermissionLevel(value);
      }
      return {
        value: value,
        permissionLevelAria: _.str.sformat(lang.permissionfor, value, ownername),
        formattedValue: value
      };
    },

    getPermissionLevel: function (permissions_level) {
      var permissions = null;
      switch (permissions_level) {
      case 0:
        permissions = lang.None;
        break;
      case 1:
        permissions = lang.Read;
        break;
      case 2:
        permissions = lang.Write;
        break;
      case 3:
        permissions = lang.FullControl;
        break;
      case 4:
        permissions = lang.Custom;
        break;
      }
      return permissions;
    },

    constructor: function PermissionLevelCellView(options) {
      PermissionLevelCellView.__super__.constructor.apply(this, arguments);

      this.$ = $;
    },

    onClickPermissionLevel: function (e) {
      var membersTypeSupport = [0, 1];
      if (membersTypeSupport.indexOf(
              this.options.model.get("right_id_expand") &&
              this.options.model.get("right_id_expand").type) < 0 &&
          this.options.model.get("type") === "custom") {
        this._handlePermissionLevelFocus({cellView: this});
      } else {
        this._handlePermissionLevelClicked({cellView: this});
        this.trigger("cell:content:clicked", this);
      }
    },

    _handlePermissionLevelClicked: function (args) {
      this._hidePopovers();
      var parentView = this.options.originatingView,
          cellView   = args.cellView;
      if (cellView.$el.data('binf.popover')) { //Return if popover is already open
        return;
      }
      var cmd = !!args.command ? args.command : commands.get('EditPermission');
      var status = {
        model: cellView.model,
        targetView: {permissions: cellView},
        originatingView: this.options.originatingView,
        applyTo: parentView && parentView.options.applyTo,
        authUser: this.options.authUser,
        admin_permissions: this.options.hasEditPermissionAction &&
                           (this.options.originatingView.model.get("permissions_model") !==
                            "simple")
      };
      var tableRow = cellView.$el.closest('.csui-table-row');
      tableRow.addClass('active-row');
      parentView && parentView.trigger('block:view:actions');
      if (cmd.enabled(status)) {
        var promisesFromCommand = cmd.execute(status);
        CommandHelper.handleExecutionResults(promisesFromCommand, {
          command: cmd,
          suppressSuccessMessage: status.suppressSuccessMessage,
          suppressFailMessage: status.suppressFailMessage
        }).done(function (nodes) {
          if (!!cmd.allowCollectionRefetch && parentView.collection.totalCount >
                                              parentView.collection.topCount) {
            parentView && parentView.collection.fetch();
          }
        }).always(function () {
          parentView && parentView.trigger('unblock:view:actions', cellView.options);
          tableRow.removeClass('active-row');
          parentView && parentView.unblockActions();
          cellView.$el.trigger('focus');
        });
      } else {
        var editPermissionHelper = new EditPermissionHelper({
          permissionModel: cellView.model,
          popoverPlacement: "left",
          popoverAtBodyElement: parentView && parentView.options.originatingView ?
                                !(parentView &&
                                  parentView.options.originatingView.options.isExpandedView) : true,
          popoverTargetElement: cellView.$el,
          readonly: true,
          originatingView: parentView
        });
        editPermissionHelper.showCustomPermissionPopover();
        editPermissionHelper.listenTo(editPermissionHelper,
            "closed:permission:level:popover", function () {
              editPermissionHelper.destroy();
              parentView && parentView.trigger('unblock:view:actions');
              cellView.$el.closest('.csui-table-row').removeClass('active-row');
            });
      }
    },

    _handlePermissionLevelFocus: function (args) {
      this._hidePopovers();
      var parentView = this.options.originatingView,
          cellView   = args.cellView;
      if (cellView.$el.data('binf.popover')) { //Return if popover is already open
        return;
      }
      cellView.$el.closest('.csui-table-row').addClass('active-row');
      parentView && parentView.trigger('block:view:actions');

      var editPermissionHelper = new EditPermissionHelper({
        permissionModel: cellView.model,
        popoverPlacement: "left",
        popoverAtBodyElement: parentView && parentView.options.originatingView ?
                              !(parentView &&
                                parentView.options.originatingView.options.isExpandedView) : true,
        popoverTargetElement: cellView.$el,
        readonly: true,
        originatingView: parentView && parentView
      });
      editPermissionHelper.showCustomPermissionPopover();
      editPermissionHelper.listenTo(editPermissionHelper,
          "closed:permission:level:popover", function () {
            editPermissionHelper.destroy();
            parentView && parentView.trigger('unblock:view:actions');
            cellView.$el.closest('.csui-table-row').removeClass('active-row');
            cellView.$el.trigger('focus');
          });
    },

    _hidePopovers: function () {
      if (this.$el.parents('body') &&
          this.$el.parents('body').find('.csui-edit-permission-popover-container' +
                                        ' .binf-popover')) {
        var popoverTarget = this.$el.parents('body').find(
            '.csui-edit-permission-popover-container' +
            ' .binf-popover');
        if (popoverTarget.data('binf.popover')) {
          popoverTarget.binf_popover('destroy');
        }
      }
    }

  }, {
    hasFixedWidth: false,
    columnClassName: 'csui-permission-level',
    widthFactor: 1
  });

  cellViewRegistry.registerByColumnKey('permissions', PermissionLevelCellView);

  return PermissionLevelCellView;
});
