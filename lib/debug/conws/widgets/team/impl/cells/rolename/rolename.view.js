csui.define([
  'csui/lib/jquery',
  'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'conws/widgets/team/impl/roles.columns',
  'conws/widgets/team/impl/dialogs/modaldialog/modal.dialog.view',
  'conws/widgets/team/impl/dialogs/role/role.details.view',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/widgets/team/impl/participants.model.factory',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/cells/rolename/impl/rolename',
  'css!conws/widgets/team/impl/cells/rolename/impl/rolename'
], function ($, TemplatedCellView, cellViewRegistry, RolesTableColumnCollection, ModalDialogView,
    RoleDetailsView, WorkspaceContextFactory, ParticipantsCollectionFactory, lang, template) {

  var RolesNameCellView = TemplatedCellView.extend({

        className: 'csui-truncate',
        template: template,

        ui: {
          roleDetails: 'a'
        },

        events: {
          'click @ui.roleDetails': 'roleDetailsClicked',
          'dragstart @ui.roleDetails': 'roleDetailsDrag',
          'keydown': 'onKeyDown'
        },

        onKeyDown: function (e) {
          switch (e.keyCode) {
          case 13:
          case 32:
            $(e.target).find(this.ui.roleDetails).trigger('click');
            break;
          }
        },

        getValueData: function () {
          // get name
          var value = this.model.displayName();
          // return
          return {
            toolTip: lang.rolesNameColTooltip,
            formattedValue: value,
            leader: this.model.get('leader') ? lang.rolesNameColTeamLead : '',
            inherited: this.model.get('inherited_from_id') ? lang.rolesNameColInherited : ''
          }
        },

        roleDetailsClicked: function (event) {

          // get workspace context
          if (!this.options.workspaceContext) {
            this.options.workspaceContext = this.options.context.getObject(WorkspaceContextFactory);
            this.options.workspaceContext.setWorkspaceSpecific(ParticipantsCollectionFactory);
          }

          // initialize the dialog for the role
          this.editor = new ModalDialogView({
            body: new RoleDetailsView({
              model: this.model,
              parentCollection: this.options.workspaceContext.getCollection(
                  ParticipantsCollectionFactory)
            }),
            modalClassName: 'conws-role-details'
          });
          this.editor.show();

          // don't propagate click event into name cell, because it would cause selecting the row
          event.preventDefault();
          event.stopPropagation();
        },

        roleDetailsDrag: function (event) {
          return false;
        },

        onDestroy: function () {
          if (this.editor) {
            this.editor = undefined;
          }
        }
      },
      {
        hasFixedWidth: false,
        columnClassName: 'team-table-cell-rolename'
      }
  );
  cellViewRegistry.registerByColumnKey(RolesTableColumnCollection.columnNames.name,
      RolesNameCellView);

  return RolesNameCellView;
});
