csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/node',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/dialogs/modal.alert/modal.alert',
  'conws/models/workspacecontext/workspacecontext.factory',
  'conws/widgets/team/impl/participant.model',
  'conws/widgets/team/impl/dialogs/addparticipants/impl/participant.listitem.view',
  'conws/widgets/team/impl/controls/rolepicker/rolepicker.view',
  'conws/widgets/team/impl/controls/footer/footer.view',
  'csui/controls/userpicker/userpicker.view',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/dialogs/addparticipants/impl/addparticipants',
  'css!conws/widgets/team/impl/dialogs/addparticipants/impl/addparticipants'
], function (_, $, Backbone, Marionette, base, ConnectorFactory, NodeFactory,
    LayoutViewEventsPropagationMixin, ModalAlert, WorkspaceContextFactory, Participant,
    ParticipantView, RolePicker, ButtonBar, UserPicker, lang, template) {

  var ParticipantsListCollectionView = Marionette.CollectionView.extend({

    tagName: 'ul',

    className: 'binf-list-group',

    childView: ParticipantView,

    constructor: function ParticipantsListCollectionView(options) {
      Marionette.CollectionView.call(this, options);
      //listen to change the focus
      this.listenTo(this, 'moveTabIndex', this.moveTabIndex);
    },

    moveTabIndex:function(view){
      this.children.each(function (participantView) {
        if(view.children.length === view.selectedIndex){
          view.selectedIndex = view.children.length - 1;
        }
        if (participantView._index === view.selectedIndex) {
          participantView.roles.currentView.rolePickerRegion.currentView.trigger('updateFocus')
        }
      });
    }
  });

  var AddParticipantsView = Marionette.LayoutView.extend({

    template: template,

    regions: {
      userPickerRegion: '.conws-addparticipants-userpicker',
      rolePickerRegion: '.conws-addparticipants-rolepicker',
      buttonsRegion: '.conws-addparticipants-buttons',
      participantsRegion: '.conws-addparticipants-members'
    },

    templateHelpers: {
      'title': lang.addParticipantsTitle,
      'roles-help': lang.addParticipantsRolesHelp
    },

    constructor: function AddParticipantsView(options) {
      options || (options = {});

      this.view = options.view;
      this.context = options.view.context;
      this.connector = options.view.context.getObject(ConnectorFactory, options.view);
      // get workspace context
      if (!options.workspaceContext) {
        options.workspaceContext = options.view.context.getObject(WorkspaceContextFactory);
      }
      this.workspaceContext = options.workspaceContext;

      this.teamRoles = options.view.roleCollection.clone() ;
      this.teamParticipants = options.view.participantCollection;

      // listen to team view close
      this.listenTo(this.view, 'destroy', this.close);

      // initialize button model
      this.buttonsModel = undefined;

      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      // propagate events to regions
      this.propagateEventsToRegions();
    },

    onRender: function () {
      // user picker
      var user = new UserPicker({
        context: this.workspaceContext,
        limit: 20,
        clearOnSelect: true,
        placeholder: lang.addParticipantsUserPickerPlaceholder,
        disabledMessage: lang.addParticipantsDisabledMemberMessage,
        onRetrieveMembers: _.bind(this.retrieveMembersCallback, this),
        prettyScrolling: true,
        initialActivationWeight: 100
      });
      this.userPickerRegion.show(user);
      user.$(".cs-search-icon").attr("aria-label",lang.addParticipantsSearchAria);
      this.listenTo(user, 'item:change', this.onUserItemChanged);

      // role picker
      var role = new RolePicker({
        roles: this.teamRoles,
        showInherited: false,
        prettyScrolling: true
      });
      this.rolePickerRegion.show(role);
      this.listenTo(role, 'item:change', this.onRoleItemChanged);

      // participants list
       var participants = new ParticipantsListCollectionView({
         context: this.options.workspaceContext,
         collection: _.extend(new Backbone.Collection(), {
           workspaceContext: this.workspaceContext,
           node: this.workspaceContext.getModel(NodeFactory),
           roles: this.teamRoles,
           comparator: function (left, right) {
             return base.localeCompareString(left.get('display_name'), right.get('display_name'));
           }
         })
       });
      this.participantsRegion.show(participants);
      // participants collection
      this.participants = participants.collection;
      this.listenTo(this.participants, 'reset add change', this.onParticipantsChanged);
      this.listenTo(this.participants, 'remove', this.onParticipantsRemove);

      // button bar, with the model to react on the changes
      this.buttonModel = new Backbone.Collection([{
        id: 'reset',
        label: lang.addParticipantsButtonClear,
        css: 'clear binf-pull-left',
        click: _.bind(this.onClickClear, this),
        disabled: true,
        close: false
      }, {
        id: 'submit',
        label: lang.addParticipantsButtonSave,
        css: 'save',
        click: _.bind(this.onClickSave, this),
        disabled: true,
        close: true
      }, {
        id: 'cancel',
        label: lang.addParticipantsButtonCancel,
        css: 'cancel',
        disabled: false,
        close: true
      }]);
      this.buttonsRegion.show(new ButtonBar({
        collection: this.buttonModel
      }));
    },

    onUserItemChanged: function (e) {
      // if member is disabled prevent from being added
      if (e.item.get('disabled')) {
        return;
      }
      // otherwise create participant and ...
      var attributes = _.extend(e.item.attributes, {
        display_name: e.item.get('name_formatted')
      });
      var participant = new Participant(attributes, {
        connector: this.connector,
        collection: this.participants
      });
      participant.roles = new Backbone.Collection(undefined, {
        comparator: function (left, right) {
          return base.localeCompareString(left.get('name'), right.get('name'));
        }
      });
      // ... add to participants list
      this.participants.add(participant);
      this.updateScrollbar();
    },

    retrieveMembersCallback: function (args) {
      var self = this;

      // check team members and dialog members and if the
      // participant is found disable it in the results.
      args.collection.each(function (current) {
        var exists = false;
        if (self.teamParticipants.findWhere({id: current.get('id')})) {
          exists = true;
        } else {
          if (self.participants.findWhere({id: current.get('id')})) {
            exists = true;
          }
        }
        current.set('disabled', exists);
      });
    },

    onRoleItemChanged: function (e) {
      // add selected role to all participants
      this.participants.each(function (current) {
        current.roles.add(e.item);
      });
    },

    onClickSave: function () {
      var self = this;
      // save participants to the team
      var error = false;
      var count = this.participants.length;
      this.participants.each(function (current) {
        self.teamParticipants.addNewParticipant(current);
        current.save(
            {
              add: current.roles.models
            }, {
              success: function (response) {
                if ((--count) === 0) {
                  self.refreshAfterSave(error);
                }
              },
              error: function (response) {
                error = true;
                if ((--count) === 0) {
                  self.refreshAfterSave(error);
                }
              }
            });
      });
    },

    refreshAfterSave: function (error) {
      var self = this;
      // notify on error
      if (error === true) {
        ModalAlert.showError(lang.addParticipantsErrorMessageDefault);
      }
      function afterFetch() {
        // trigger save event to signal the save of the collection
        self.teamParticipants.trigger('saved', self.teamParticipants);
      }

      // refresh team participants
      self.teamParticipants.fetch({
        success: function () {
          self.teamParticipants.setNewParticipant();
        }
      }).then(afterFetch,afterFetch);
    },

    onClickClear: function () {
      // clear participants dialog
      this.participants.reset();
      // set focus to user picker
      this.userPickerRegion.currentView.currentlyFocusedElement().focus();
      // update scrollbars
      this.updateScrollbar();
    },

    onParticipantsRemove: function () {
      this.onParticipantsChanged();
      if (this.participants && this.participants.length>0) {
        //set focus on the previous item
        this.participantsRegion.currentView.trigger('moveTabIndex', this.participantsRegion.currentView);
      } else {
        // set focus to user picker
        this.userPickerRegion.currentView.currentlyFocusedElement().focus();
      }
      this.updateScrollbar();
    },

    onParticipantsChanged: function () {
      // disable clear - if no item is available
      var disableClear = (this.participants.length === 0);
      // disable save - if at least one items has no roles
      var disableSave = (this.participants.length === 0);
      this.participants.each(function (participant) {
        if ((participant.roles === undefined) || (participant.roles.length === 0)) {
          disableSave = true;
        }
      });
      // set button models
      this.buttonModel.get('reset').set('disabled', disableClear);
      this.buttonModel.get('submit').set('disabled', disableSave);
      // whenever the participants change, update the perfect scrollbar
      this.$el.find('.conws-addparticipants-members').perfectScrollbar({
        suppressScrollX: true,
        scrollYMarginOffset: 15
      });
    },

    // Update the scrollbars for the participant list, if the list has changed.
    updateScrollbar: function () {
      // scroll to top as the function is
      // called from within 'onShown'.
      var sc1 = this.$el.find('.conws-addparticipants-members');
      _.each(sc1, function (sc) {
        $(sc).perfectScrollbar('update');
      })
    }
  });

  // add mixin
  _.extend(AddParticipantsView.prototype, LayoutViewEventsPropagationMixin);

  // return view
  return AddParticipantsView;
})
;
