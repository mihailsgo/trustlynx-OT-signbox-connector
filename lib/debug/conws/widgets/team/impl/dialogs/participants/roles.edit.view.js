csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/lib/handlebars',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'conws/widgets/team/impl/controls/filter/filter.view',
  'conws/widgets/team/impl/controls/filter/impl/filter.model',
  'conws/widgets/team/impl/dialogs/participants/impl/roles.edit.list.remove.view',
  'conws/widgets/team/impl/dialogs/participants/impl/roles.edit.list.view',
  'conws/widgets/team/impl/dialogs/participants/impl/roles.readonly.list.view',
  'conws/widgets/team/impl/controls/footer/footer.view',
  'conws/widgets/team/impl/roles.model.expanded',
  'conws/widgets/team/impl/participants.model',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/dialogs/participants/impl/roles.edit',
  'conws/widgets/team/impl/roles.model',
  'css!conws/widgets/team/impl/dialogs/participants/impl/roles.edit',
  'css!conws/widgets/team/impl/cells/roles/impl/roles'
], function (_, $, Backbone, Marionette, Handlebars, ModalAlert, LayoutViewEventsPropagationMixin,
    TabableRegionBehavior, Filter, FilterModel, RolesRemoveList, RolesEditList, RolesReadOnlyList,
    FooterView, RolesCollection, ParticipantsCollection, lang,
    template, RolesModelCollection) {

  var ButtonLabels = {
    Close: lang.rolesDialogButtonClose,
    Save: lang.rolesDialogButtonSave,
    Cancel: lang.rolesDialogButtonCancel,
    Reset: lang.rolesDialogButtonReset,
    Remove: lang.rolesDialogButtonRemove
  };

  var RolesEditView = Marionette.LayoutView.extend({

    // Roles count when filtering should be possible
    rolesCountForFilter: 15,

    // Modified flag to indicate changes
    modified: false,

    // temporary roles lists for the view
    availableRoles: new RolesModelCollection(),
    assignedRoles: new RolesModelCollection(),

    // filter models to handle the reset action
    filterModel1: undefined,
    filterModel2: undefined,

    // constructor for the RolesEdit dialog
    constructor: function RolesEditView(options) {
      options || (options = {});

      this.teamRoles = options.roleCollection;
      this.teamParticipants = options.participantCollection;

      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.propagateEventsToRegions();
    },

    template: template,

    regions: {
      assignedRolesHeaderRegion: '.conws-roles-edit-canedit-setroles-region',
      assignedRolesListRegion: '.conws-roles-edit-canedit-setroles-list-region',
      availableRolesHeaderRegion: '.conws-roles-edit-canedit-allroles-region',
      availableRolesListRegion: '.conws-roles-edit-canedit-allroles-list-region',
      readonlyRolesListRegion: '.conws-roles-readonly-region',
      buttonsRegion: '.conws-roles-edit-buttons-region'
    },

    ui: {
      footer: '.conws-roles-edit-buttons-region'
    },

    // localized captions
    captions: {
      AssignedRoles: lang.rolesDialogAssignedRoles,
      TooltipAssignedRoles: lang.rolesDialogTooltipAssignedRoles,
      AvailableRoles: lang.rolesDialogAvailableRoles,
      TooltipAvailableRoles: lang.rolesDialogTooltipAvailableRoles
    },

    // initialize the view and prepare the model objects
    initialize: function () {

      if (_.isUndefined(this.model)) {
        return;
      }

      // create a new collection for the dialog
      this.assignedRoles.reset(this.model.roles.models);

      // create a new collection with all roles for the dialog
      var tmp = this.model.collection.availableRoles.clone();
      // reduce the all roles list to the not to this user assigned list
      tmp.remove(this.assignedRoles.models);

      // remove all inherited roles from the available list
      var notInheritedRoles = tmp.filter(function (m) {
        var id = m.get('inherited_from_id');
        return _.isUndefined(id) || _.isNull(id);
      });

      // reset the availableRoles list
      this.availableRoles.reset(notInheritedRoles);

      if (!_.isUndefined(this.filterModel1)) {
        this.filterModel1.set('resetFilter', true);
      }

      if (!_.isUndefined(this.filterModel2)) {
        this.filterModel2.set('resetFilter', true);
      }

      // no changes are made on the data
      this.modified = false;

      // prepare the states for the button bar
      this.setDialogState();

      // setup the listener for changing the lists
      this.listenTo(this.assignedRoles, 'remove', this.removeAssignedRole);
      this.listenTo(this.availableRoles, 'remove', this.addAvailableRole);
    },

    // remove an assigned role
    // the role is removed in the list view, now add it to the available list and update the dialog state
    removeAssignedRole: function (model) {
      var r = model;
      this.availableRoles.add(r);

      // changes are made on the data
      this.modified = true;

      this.setDialogState();

      // set automatically focus to next region
      if (this.assignedRoles.length === 0) {
        this.filterModel2.get('active') ?
        this.availableRolesHeaderRegion.currentView.trigger('updateFocus') :
        this.availableRolesListRegion.currentView.trigger('updateFocus');
      } else if (this.assignedRolesListRegion.currentView.totalCount - 1 === 0 &&
                 this.filterModel1.get('active')) {
        this.assignedRolesHeaderRegion.currentView.trigger('updateFocus');
      }
    },

    // add an available role
    // the role is removed in the list view, now add it to the assigned list and update the dialog state
    addAvailableRole: function (model) {
      var r = model;
      this.assignedRoles.add(r);

      // changes are made on the data
      this.modified = true;

      this.setDialogState();

      // set automatically focus to previous region
      if (this.availableRoles.length === 0) {
        this.filterModel1.get('active') ?
        this.assignedRolesHeaderRegion.currentView.trigger('updateFocus') :
        this.assignedRolesListRegion.currentView.trigger('updateFocus');
      } else if (this.availableRolesListRegion.currentView.totalCount - 1 === 0 &&
                 this.filterModel2.get('active')) {
        this.availableRolesHeaderRegion.currentView.trigger('updateFocus');
      }
    },

    // this method sets the state for the dialog
    setDialogState: function () {
      //enable or disable the filter if no selection functions depending on the list length
      if (!_.isUndefined(this.filterModel1) && _.isEmpty(this.filterModel1.get('filter'))) {
        this.filterModel1.set('active', this.assignedRoles.length >= this.rolesCountForFilter);
      }
      if (!_.isUndefined(this.filterModel2) && _.isEmpty(this.filterModel2.get('filter'))) {
        this.filterModel2.set('active', this.availableRoles.length >= this.rolesCountForFilter);
      }
      if (!_.isUndefined(this.editRolesButtons)) {
        this.editRolesButtons.collection.findWhere({id: 'submit'}).set({disabled: !this.modified});
        this.assignedRoles.length > 0 ?
        this.editRolesButtons.collection.findWhere({id: 'submit'}).set({label: ButtonLabels.Save}) :
        this.editRolesButtons.collection.findWhere({id: 'submit'}).set({label: ButtonLabels.Remove});
      }
    },

    // template helper to prepare the model for the view
    templateHelpers: function () {
      var self = this;
      // get roles and create a caption name out of it
      var titleTemplate = lang.userRolesDialogTitle;
      if (this.model.getMemberType() === 'group') {
        titleTemplate = lang.groupRolesDialogTitle;
      }
      var value = _.str.sformat(titleTemplate, this.model.get('display_name'));

      // return the prepared object with the necessary properties
      return {
        title: value,
        canEdit: this.model.canEdit()
      };
    },

    // Update the scrollbars for the roles list, if the list has changed.
    updateScrollbar: function () {
      // scroll to top as the function is
      // called from within 'onShown'.
      var sc1 = this.$el.find('.binf-modal-body .conws-roles-edit-readonly');
      _.each(sc1, function (sc) {
        $(sc).perfectScrollbar('update');
      })

      var sc2 = this.$el.find('.conws-roles-edit-canedit-content');
      _.each(sc2, function (sc) {
        $(sc).perfectScrollbar('update');
      })
    },

    // show the dialog
    // enable the scrollbars for the different lists, the scrollbars maintained here because of event issues with the regions
    onAfterShow: function () {
      // initialize scrollbar
      this.$el.find('.binf-modal-body .conws-roles-edit-readonly').perfectScrollbar({
        suppressScrollX: true,
        scrollYMarginOffset: 15 // like bottom padding of container, otherwise scrollbar is shown always
      });
      // initialize scrollbar
      this.$el.find('.conws-roles-edit-canedit-content').perfectScrollbar({
        suppressScrollX: true,
        scrollYMarginOffset: 15 // like bottom padding of container, otherwise scrollbar is shown always
      });
      // update scrollbars
      this.updateScrollbar();

    },

    // The view is rendered whenever the model changes.
    onRender: function () {
      // render widget if the dialog is opened in the edit mode
      if (this.model.canEdit()) {
        // list with all set roles
        this.filterModel1 = new FilterModel({
          caption: this.captions.AssignedRoles,
          tooltip: this.captions.TooltipAssignedRoles,
          active: (this.assignedRoles.length >= this.rolesCountForFilter)
        });
        this.assignedRolesHeaderRegion.show(new Filter({
          model: this.filterModel1,
          initialActivationWeight: this.assignedRoles.length >= this.rolesCountForFilter ? 100 : 0
        }));
        this.assignedRolesListRegion.show(new RolesRemoveList({
          model: this.assignedRoles,
          filterModel: this.filterModel1,
          initialActivationWeight: this.assignedRoles.length > 0 ? 100 : 0
        }));
        this.listenTo(this.assignedRolesListRegion.currentView, 'dom:refresh',
            this.updateScrollbar);

        // list with filter header and all available roles
        this.filterModel2 = new FilterModel({
          caption: this.captions.AvailableRoles,
          tooltip: this.captions.TooltipAvailableRoles,
          active: (this.availableRoles.length >= this.rolesCountForFilter)
        });
        this.availableRolesHeaderRegion.show(new Filter({model: this.filterModel2}));
        this.availableRolesListRegion.show(new RolesEditList({
          model: this.availableRoles,
          filterModel: this.filterModel2
        }));
        this.listenTo(this.availableRolesListRegion.currentView, 'dom:refresh',
            this.updateScrollbar);
      } else {
        this.readonlyRolesListRegion.show(new RolesReadOnlyList({
          model: this.model.roles,
          initialActivationWeight: this.model.roles.length > 0 ? 100 : 0
        }));
      }

      //render footer
      this._renderFooter();

    },

    // Click on the save button
    saveClicked: function () {
      var self = this;
      //Get the actual Participantslist of Server - then verify if the roles of this
      // User are still the same as before, only when they are the same - save will be done
      var actServerParticipants = new ParticipantsCollection(undefined, {
        connector: self.model.collection.connector,
        node: self.model.collection.node,
        context: self.model.collection.workspaceContext,
        autoreset: true
      });
      actServerParticipants.fetch({
        success: function (ParticpantsCol) {
          var actParticipant = ParticpantsCol.find(function (participantfind) {
            return (participantfind.get('id') === self.model.get('id'));
          });
          var dataChanged;
          //the participant might not be in the collection anymore at all and
          //check wether the user has still the same number of roles as before
          if ((actParticipant) && (actParticipant.roles.length === self.model.roles.length)) {
            dataChanged = false;
            actParticipant.roles.each(function (role) {
              var id = role.id;
              //every role from the server is checked against the server roles from before
              var found = self.model.roles.find(function (role2) {
                return (role2.id === id);
              });
              if (!found) {
                dataChanged = true;
              }
            })
          }
          if (dataChanged === false) {
            //save data from the dialog
            self.saveRolesForUser();
          }
          else {
            //show an alert with the message that the data was changed
            var message = lang.rolesEditDialogDataNotUptoDateUser;
            if (self.model.getMemberType() === 'group') {
              message = lang.rolesEditDialogDataNotUptoDateGroup;
            }
            ModalAlert.showError(message, self.getErrorMessageTitle()).always(
                function (result) {
                  self.refreshAfterSave();
                });
          }
        }
      });

    },

    // Collect the changes and send them to the model
    saveRolesForUser: function () {
      var self = this;
      var removed = [];
      this.model.roles.each(function (role) {
        var id = role.id;
        //the assignedRoles list is the one on the dialog and the this.model.roles is the original assigned roles
        //the original assigned roles are checked against the actual list and whatever isn't
        // found anymore will be deleted
        var found = self.assignedRoles.find(function (role2) {
          return (role2.id === id);
        });

        if (!found) {
          removed.push(role);
        }
      });

      var added = [];
      // for every item role on the dialog is now checked if they are in the original list
      // if not it will be added
      this.assignedRoles.each(function (role) {
        var id = role.id;

        var found = self.model.roles.find(function (role2) {
          return (role2.id === id);
        });

        if (!found) {
          added.push(role);
        }
      });

      this.model.save({add: added, remove: removed}, {
        success: function (response) {
          self.refreshAfterSave();
        },
        error: function (response) {

          // show an alert with the error messages
          // prepare the message
          var message = '';
          if (response.successAdd.length > 0) {
            var rolesAdded = lang.rolesEditDialogSuccessfulAdded;
            _.each(response.successAdd, function (role) {
              rolesAdded = rolesAdded + '\n' + role.role.get('name');
            });

            message = rolesAdded;
          }

          if (response.errorAdd.length > 0) {
            var rolesNotAdded = lang.rolesEditDialogNotAdded;
            _.each(response.errorAdd, function (role) {
              rolesNotAdded = rolesNotAdded + '\n' + role.role.get('name');
            });

            if (message.length > 0) {
              message += '\n';
            }

            message = message + rolesNotAdded;
          }

          if (response.successRemove.length > 0) {
            var rolesRemoved = lang.rolesEditDialogSuccessfulRemoved;
            _.each(response.successRemove, function (role) {
              rolesRemoved = rolesRemoved + '\n' + role.role.get('name');
            });

            if (message.length > 0) {
              message += '\n';
            }

            message = message + rolesRemoved;
          }

          if (response.errorRemove.length > 0) {
            var rolesNotRemoved = lang.rolesEditDialogNotRemoved;
            _.each(response.errorRemove, function (role) {
              rolesNotRemoved = rolesNotRemoved + '\n' + role.role.get('name');
            });

            if (message.length > 0) {
              message += '\n';
            }

            message = message + rolesNotRemoved;
          }

          ModalAlert.showError(message, self.getErrorMessageTitle()).always(function (result) {
            self.refreshAfterSave();
          });
        }
      });
    },

    //prepare header for message
    getErrorMessageTitle: function () {
      var titleTemplate = lang.rolesEditDialogErrorTitleUser;
      if (this.model.getMemberType() === 'group') {
        titleTemplate = lang.rolesEditDialogErrorTitleGroup;
      }
      var title = _.str.sformat(titleTemplate,
          this.model.get('display_name') ? this.model.get('display_name') :
          this.model.get('name'));
      return title;
    },

    refreshAfterSave: function () {
      var self = this;

      function afterRolesFetch() {
        // send event as late as possible, so caller can do something after dialog has been closed
        // see roles.view cell for a usage.
        self.trigger('refetched');
      }

      function afterFetch() {
        // trigger save event to signal the save of the collection
        self.teamParticipants.trigger('saved', self.teamParticipants);
        // refresh the roles collection
        self.teamRoles.fetch().then(afterRolesFetch,afterRolesFetch);
      }

      // refresh the participant collection
      this.teamParticipants.fetch({
        success: function () {
          self.teamParticipants.setNewParticipant();
        }
      }).then(afterFetch,afterFetch);
    },

    // Click on the reset button
    // Re-render the view parts via the change of the models
    resetClicked: function () {

      // reset the current changes
      this.initialize();

    },

    _renderFooter: function(){
      var editRolesButtons = this.editRolesButtons;
      //add buttons
      if (editRolesButtons) {
        this.ui.footer.removeClass('binf-hidden');
        this.buttonsRegion.show(editRolesButtons);
      } else {
        var buttons = [];
        if (this.model.canEdit()) {
          buttons = [{
            id: 'reset',
            label: ButtonLabels.Reset,
            css: 'conws-roles-edit-button binf-pull-left conws-roles-edit-button-reset',
            click: _.bind(this.resetClicked, this)
          }, {
            id: 'submit',
            label: ButtonLabels.Save,
            css:'conws-roles-edit-button conws-roles-edit-button-save',
            click: _.bind(this.saveClicked, this),
            disabled: true,
            close: true
          }, {
            id: 'cancel',
            label: ButtonLabels.Cancel,
            css:'conws-roles-edit-button conws-roles-edit-button-cancel',
            close: true
          }
          ];
        } else {
          buttons = [{
            id: 'cancel',
            label: ButtonLabels.Close,
            css:'conws-roles-edit-button binf-pull-right',
            close: true,
            initialActivationWeight: 100
          }];
        }

       editRolesButtons = this.editRolesButtons = new FooterView({
          collection: new Backbone.Collection(buttons)
        });
       this.buttonsRegion.show(editRolesButtons);
      }
    }
  });

  _.extend(RolesEditView.prototype, LayoutViewEventsPropagationMixin);

  return RolesEditView;
});

