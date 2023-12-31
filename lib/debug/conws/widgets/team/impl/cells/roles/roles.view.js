csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/cell.registry',
  'conws/widgets/team/impl/dialogs/modaldialog/modal.dialog.view',
  'conws/widgets/team/impl/participants.columns',
  'conws/widgets/team/impl/dialogs/participants/roles.edit.view',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/widgets/team/impl/participants.model.factory',
  'conws/widgets/team/impl/roles.model.factory',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/cells/roles/impl/roles',
  'css!conws/widgets/team/impl/cells/roles/impl/roles'
], function (_, $, TemplatedCellView, cellViewRegistry, ModalDialogView,
    ParticipantsTableColumnCollection, EditView, WorkspaceContextFactory,
    ParticipantsCollectionFactory, RolesCollectionFactory, lang, template) {

  var RolesCellView = TemplatedCellView.extend({

        className: 'csui-truncate',
        template: template,

        ui: {
          roleEdit: 'a.conws-roles-btn'
        },

        events: {
          'click @ui.roleEdit': 'roleEditClicked',
          'dragstart @ui.roleEdit': 'roleEditDrag',
          'keydown': 'onKeyDown'
        },

        onKeyDown: function (e) {
          switch (e.keyCode) {
          case 13:
          case 32:
            $(e.target).find(this.ui.roleEdit).trigger('click');
            break;
          }
        },

        getValueData: function () {
          // get roles
          var value = this.model.getLeadingRole();
          var indicator = this.model.getRolesIndicator();
          // return
          return {
            value: value,
            indicator: indicator,
            cannotEdit: !this.model.canEdit(),
            toolTip: lang.participantRrolesColTooltip
          };
        },

        roleEditClicked: function (event) {
          // get workspace context
          if (!this.options.workspaceContext) {
            this.options.workspaceContext = this.options.context.getObject(WorkspaceContextFactory);
            this.options.workspaceContext.setWorkspaceSpecific(ParticipantsCollectionFactory);
            this.options.workspaceContext.setWorkspaceSpecific(RolesCollectionFactory);
          }
          // initialize the dialog for the participants roles
          this.editor = new ModalDialogView({
            body: new EditView({
              model: this.model,
              roleCollection: this.options.workspaceContext.getCollection(RolesCollectionFactory),
              participantCollection: this.options.workspaceContext.getCollection(
                  ParticipantsCollectionFactory)
            }),
            modalClassName: 'conws-roles-edit'
          });

          this.editor.show();

          var setFocus = _.bind(function(){
            // to set the focus we must use the click() event, as focus() alone does not work here. And as there is
            // no click handler on the element, which we want to focus on, we can do so without consequences so far.
            this.options.tableView.$el.find('[conws-participant-row-id="'+this.model.get("id")+'"] .conws-team-table-cell-roles').trigger('click');
          },this);

          // in any case, when the dialog is closed, we set the focus to the cell, as the dialog has been opened
          // using this cell (by enter/space or by mouse click), which means, that the focus should be in this cell.
          this.editor.once('destroy',function() {
            setFocus();
          });

          // as the focus is set to elsewhere by the tabables.behavior during the refresh, we have to set it again
          // to this cell after everything has been fetched. see also roles.edit.view where the event is triggered.
          this.editor.options.body.once('refetched',function() {
            setFocus();
          });

          // don't propagate click event into name cell, because it would cause selecting the row
          event.preventDefault();
          event.stopPropagation();
        },

        // prevent dragging of role editor cell
        roleEditDrag: function (event) {
          return false;
        },

        onDestroy: function () {
          if (this.editor) {
            this.editor = undefined;
          }
        }
      },
      {
        columnClassName: 'conws-team-table-cell-roles'
      }
  );

  cellViewRegistry.registerByColumnKey(ParticipantsTableColumnCollection.columnNames.roles,
      RolesCellView);

  return RolesCellView;
});

