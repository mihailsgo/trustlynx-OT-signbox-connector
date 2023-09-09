csui.define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/contexts/factories/connector',
  'csui/utils/commands',
  'conws/utils/commands/addparticipant',
  'conws/widgets/team/impl/commands/exportparticipants',
  'conws/utils/commands/showroles',
  'conws/utils/commands/removeparticipant',
  'conws/widgets/team/impl/commands/exportroles',
  'conws/utils/commands/showdetails',
  'conws/utils/commands/deleterole',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/controls/table/table.view',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'conws/widgets/team/impl/participants.model.factory',
  'conws/widgets/team/impl/participants.columns',
  'conws/widgets/team/impl/participants.toolbaritems',
  'conws/widgets/team/impl/roles.model.factory',
  'conws/widgets/team/impl/roles.columns',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/widgets/team/impl/roles.toolbaritems',
  'conws/widgets/team/impl/dialogs/participants/roles.edit.view',
  'conws/widgets/team/impl/dialogs/role/role.details.view',
  'conws/widgets/team/impl/team.tablinks.view',
  'conws/widgets/team/impl/dialogs/modaldialog/modal.dialog.view',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/teamtables',
  'css!conws/widgets/team/impl/team',
  'conws/widgets/team/impl/cells/avatar/avatar.view',
  'conws/widgets/team/impl/cells/name/name.view',
  'conws/widgets/team/impl/cells/roles/roles.view',
  'conws/widgets/team/impl/cells/login/login.view',
  'conws/widgets/team/impl/cells/email/email.view',
  'conws/widgets/team/impl/cells/department/department.view',
  'conws/widgets/team/impl/cells/rolename/rolename.view',
  'conws/widgets/team/impl/cells/participants/participants.view'
], function ($, _, Marionette, ConnectorFactory, commands, AddParticipantCommand,
    ExportParticipantsCommand, ShowRolesCommand, RemoveParticipantCommand, ExportRolesCommand,
    ShowDetailsCommand, DeleteRoleCommand, ModalAlert, TableToolbarView, TableView,
    LayoutViewEventsPropagationMixin, ParticipantsCollectionFactory,
    ParticipantsTableColumnCollection, participantToolbarItems, RolesCollectionFactory,
    RolesTableColumnCollection, WorkspaceContextFactory, roleToolbarItems, ParticipantsView,
    RolesView, TeamTabView, ModalDialogView, lang, template) {

  var TeamTablesView = Marionette.LayoutView.extend({

    template: template,

    // flag indication if the data was changed
    dirty: false,

    events: {
      'shown.binf.tab .binf-nav-tabs a': 'onShownTab'
    },

    regions: {
      tabParticipantsRegion: '#tabParticipants',
      tabRolesRegion: '#tabRoles',
      participantsToolbarRegion: '#participantstoolbar',
      participantsRegion: '#participantsview',
      rolesToolbarRegion: '#rolestoolbar',
      rolesRegion: '#rolesview'
    },

    constructor: function TeamTablesView(options) {
      if (options === undefined || !options.context) {
        throw new Error('Context is missing in the constructor options');
      }
      this.context = options.context;

      if (!_.isUndefined(options.collapsedView)) {
        this.collapsedView = options.collapsedView;
      }

      // get workspace context
      if (!options.workspaceContext) {
        options.workspaceContext = options.context.getObject(WorkspaceContextFactory);
        options.workspaceContext.setWorkspaceSpecific(ParticipantsCollectionFactory);
        options.workspaceContext.setWorkspaceSpecific(RolesCollectionFactory);
      }
      this.workspaceContext = options.workspaceContext;
      this.participantCollection = options.workspaceContext.getCollection(
          ParticipantsCollectionFactory);
      this.roleCollection = options.workspaceContext.getCollection(RolesCollectionFactory);
      //clear list of newParticipants for icon status
      this.participantCollection.newParticipants = [];
      _.each(this.participantCollection.where({isNew: true}), function (part) {
        part.unset('isNew')
      });


      // set filter from collapsed view to participants and roles collection
      // or clear filter from previous selection
      if (options.filterBy && options.filterBy.name.length > 0) {
        this.participantCollection.setFilter({conws_participantname: options.filterBy.name});
        this.roleCollection.setFilter({conws_rolename: options.filterBy.name});
      } else {
        this.participantCollection.filters =  {};
        this.participantCollection.orderBy =  ParticipantsTableColumnCollection.columnNames.name + ' asc';
        this.roleCollection.filters =  {};
        this.roleCollection.orderBy =  RolesTableColumnCollection.columnNames.name + ' asc';
      }

      //listen on custom events for the collections to get the saved indication
      this.listenTo(this.participantCollection, 'saved', this.onParticipantsChanged);
      this.listenTo(this.roleCollection, 'saved', this.onChanged);

      //the data was not changed
      this.dirty = false;

      options.data || (options.data = {});
      Marionette.LayoutView.prototype.constructor.call(this, arguments);

      // propagate layout events to regions
      this.propagateEventsToRegions();
    },

    onRender: function () {
      var self = this;
      this.tabParticipantsRegion.show(new TeamTabView(_.defaults({
        initialActivationWeight: 202
      },this.options), {
        attributes: {aria: 'participants', 'aria-controls': 'participantstab', href: '#participantstab'}
      }));
      this.tabRolesRegion.show(new TeamTabView(_.defaults({
        initialActivationWeight: 201
      },this.options), {
        attributes: {aria: 'roles', 'aria-controls': 'rolestab', href: '#rolestab'}
      }));

      if (this.participantCollection.fetched) {
        this.participantCollection.fetch({reload: true});
      }
      if (this.roleCollection.fetched) {
        this.roleCollection.fetch({reload: true});
      }

      this.participantCollection.once('sync', function () {
        // show click on the tab after data is there so the add participants command is enabled. The click
        // triggers onShownTab for the case '#participantstab', which then calls renderParticipantsAfterFetch.
        // Needed to have the tabs in sync with displayed list (CWS-3565) AND avoiding side effect (CWS-4190),
        // that the AddParticipants action is not displayed sometimes, which occurs, if expand button is clicked
        // very fast after initial display.
        self.tabParticipantsRegion.currentView.$el.binf_tab('show');
      });
      this.participantCollection.fetch();
      this.roleCollection.fetch();

    },

    renderParticipantsAfterFetch: function () {

      // create participants toolbar
      if (!this.participantsToolbarView) {

        // participant commands - if one exists, all exist. therefore we only
        // query for the 'add participant' command. this is also the one we
        // have to update each time we open the team view as the roles have to
        // be updated.
        var cmd = commands.get(AddParticipantCommand.prototype.defaults.signature)
        if (cmd) {
          // update the roles for the command 'enabled' check.
          cmd.roles = this.participantCollection.availableRoles;
        } else {
          // we have to create the commands initially.
          commands.add(new AddParticipantCommand({
            roles: this.participantCollection.availableRoles
          }));
          commands.add(new ExportParticipantsCommand());
          commands.add(_.extend(new ShowRolesCommand(), {
            execute: this.onShowRoles
          }));
          commands.add(new RemoveParticipantCommand());
        }

        this.participantsToolbarView = new TableToolbarView({
          originatingView: this,
          toolbarItems: participantToolbarItems,
          collection: this.participantCollection
        });
      }

      // create participant table view
      if (!this.participantsTableView) {
        // drop avatar column
        var colsWithSearch = _.rest(ParticipantsTableColumnCollection.getColumnKeys(), 1);
        // initialize view
        this.participantsTableView = new TableView({
          context: this.workspaceContext,
          connector: this.context.getObject(ConnectorFactory),
          collection: this.participantCollection,
          columns: this.participantCollection.columns,
          filterBy: this.participantCollection.filters,
          tableColumns: ParticipantsTableColumnCollection,
          selectColumn: true,
          enableSorting: true,
          orderBy: ParticipantsTableColumnCollection.columnNames.name + ' asc',
          nameEdit: false,
          haveDetailsRowExpandCollapseColumn: true,
          columnsWithSearch: colsWithSearch,
          tableTexts: {
            zeroRecords: lang.zeroRecordsOrFilteredParticipants
          },
          tableAria: lang.rolesParticipantsTableAria
        });
        // handle events
        this.listenTo(this.participantsTableView, 'tableRowSelected',
            this.updateParticipantsToolItems);
        this.listenTo(this.participantsTableView, 'tableRowUnselected',
            this.updateParticipantsToolItems);
        this.listenTo(this.participantsTableView, 'tableRowRendered', function(row) {
          //set specific attribute, so we can find the row easier in the roles.view cell.
          $(row.target).attr("conws-participant-row-id",row.node.get("id"));
        });

        // Set focus to roles column
        if (!_.isUndefined(this.participantsTableView.accFocusedState.body.column)) {
          this.participantsTableView.accFocusedState.body.column = 3;
        }
      }

      // show
      this.participantsToolbarRegion.show(this.participantsToolbarView);
      this.participantsRegion.show(this.participantsTableView);
    },

    renderRolesAfterFetch: function () {

      // create roles toolbar
      if (!this.rolesToolbarView) {
        commands.add(new ExportRolesCommand());
        commands.add(_.extend(new ShowDetailsCommand(), {
          execute: this.onShowDetails
        }));
        commands.add(new DeleteRoleCommand());

        this.rolesToolbarView = new TableToolbarView({
          originatingView: this,
          toolbarItems: roleToolbarItems,
          collection: this.roleCollection
        });
      }

      // create roles table view
      if (!this.rolesTableView) {
        // drop avatar column
        var colsWithSearch = _.rest(RolesTableColumnCollection.getColumnKeys(), 1);
        // initialize view
        this.rolesTableView = new TableView({
          context: this.workspaceContext,
          connector: this.context.getObject(ConnectorFactory),
          collection: this.roleCollection,
          columns: this.roleCollection.columns,
          filterBy: this.roleCollection.filters,
          tableColumns: RolesTableColumnCollection,
          selectColumn: true,
          enableSorting: true,
          orderBy: RolesTableColumnCollection.columnNames.name + ' asc',
          nameEdit: false,
          haveDetailsRowExpandCollapseColumn: true,
          columnsWithSearch: colsWithSearch,
          tableTexts: {
            zeroRecords: lang.zeroRecordsOrFilteredRoles
          },
          tableAria: lang.participantRolesTableAria
        });
        // handle events
        this.listenTo(this.rolesTableView, 'tableRowSelected', this.updateRolesToolItems);
        this.listenTo(this.rolesTableView, 'tableRowUnselected', this.updateRolesToolItems);

        // Set focus to Name column
        if (!_.isUndefined(this.rolesTableView.accFocusedState.body.column)) {
          this.rolesTableView.accFocusedState.body.column = 2;
        }
      }

      // show
      this.rolesToolbarRegion.show(this.rolesToolbarView);
      this.rolesRegion.show(this.rolesTableView);
    },

    onShowRoles: function (status, options) {
      // initialize the role details view. it is based in a modal dialog view
      // to create a new tabable layer
      var dialog, deferred = $.Deferred();
      this.editor = new ModalDialogView({
        body: new ParticipantsView({
          model: status.nodes.models[0],
          roleCollection: status.originatingView.roleCollection,
          participantCollection: status.originatingView.participantCollection
        }),
        modalClassName: 'conws-roles-edit'
      });
      dialog = this.editor.show();

      if( !!dialog ) {
        deferred.resolve();
      }

      return deferred.promise();
    },

    onShowDetails: function (status, options) {
      // initialize the role details view. it is based in a modal dialog view
      // to achieve a new tabable layer
      var dialog, deferred = $.Deferred();
      this.editor = new ModalDialogView({
        body: new RolesView({
          model: status.nodes.models[0],
          roleCollection: status.originatingView.roleCollection,
          participantCollection: status.originatingView.participantCollection
        }),
        modalClassName: 'conws-role-details'
      });
      dialog = this.editor.show();

      if( !!dialog ) {
        deferred.resolve();
      }

      return deferred.promise();
    },

    updateParticipantsToolItems: function () {
      // update toolbar items
      this.participantsToolbarView && this.participantsToolbarView.updateForSelectedChildren(
          this.participantsTableView.getSelectedChildren());
    },

    participantsTableDomRefresh: function () {
      // update toolbar items
      this.participantsToolbarView.updateForSelectedChildren(
          this.participantsTableView.getSelectedChildren());
      this.participantsTableView.triggerMethod(
          'dom:refresh', this.participantsTableView);
    },

    updateRolesToolItems: function () {
      // update toolbar items
      this.rolesToolbarView.updateForSelectedChildren(
          this.rolesTableView.getSelectedChildren());
    },

    rolesTableDomRefresh: function () {
      // update toolbar items
      this.rolesToolbarView.updateForSelectedChildren(
          this.rolesTableView.getSelectedChildren());
      this.rolesTableView.triggerMethod(
          'dom:refresh', this.rolesTableView);
    },

    onShownTab: function (e) {
      var hash = e.target.hash,
        participantsTabLink = this.tabParticipantsRegion.$el.find('a.csui-acc-tab-region'),
        rolesTabLink = this.tabRolesRegion.$el.find('a.csui-acc-tab-region');
      switch (hash) {
        case '#participantstab':
          participantsTabLink.attr('aria-selected', true);
          rolesTabLink.attr('aria-selected', false);
          this.renderParticipantsAfterFetch();
          this.participantsTableDomRefresh();
          break;
        case '#rolestab':
          participantsTabLink.attr('aria-selected', false);
          rolesTabLink.attr('aria-selected', true);
          this.renderRolesAfterFetch();
          this.rolesTableDomRefresh();
          break;
      }
    },

    onParticipantsChanged: function () {
      var self = this;
      //mark the view as dirty
      this.dirty = true;

      self.participantCollection.fetch({
        reload: true,
        success: function () {
          self.participantCollection.setNewParticipant();
          //update the partcipant toolbar
          self.updateParticipantsToolItems();
        }
      });
      self.roleCollection.fetch({reload: true});

      //update the roles toolbar
      this.updateRolesToolItems();
    },

    // Event when the participant or roles collection was changed
    onChanged: function () {
      //mark the view as dirty
      this.dirty = true;

      //update the toolbars
      this.updateParticipantsToolItems();
      this.updateRolesToolItems();
    },

    // close the dialog / expanded view
    onDestroy: function () {
      // close open dialogs
      if (this.rolesEditor) {
        this.rolesEditor.close();
        this.rolesEditor = undefined;
      }
      if (this.detailsEditor) {
        this.detailsEditor.close();
        this.detailsEditor = undefined;
      }

      // If the view is marked as dirty and a collapsed view is available trigger a refresh for the collapsed view
      if (this.dirty && !_.isUndefined(this.collapsedView)) {
        this.collapsedView.triggerMethod('refresh:list');
      }
      return true;
    }

  });

  // attach events propagation mixin
  _.extend(TeamTablesView.prototype, LayoutViewEventsPropagationMixin);

  return TeamTablesView;
});
