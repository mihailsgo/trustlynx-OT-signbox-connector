csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/url',
  'csui/utils/contexts/factories/user',
  'esoc/widgets/userwidget/userwidget',
  'conws/widgets/team/impl/controls/avatar/avatar.view',
  'conws/widgets/team/impl/controls/rolepicker/rolepicker.view',
  'conws/widgets/team/impl/dialogs/addparticipants/impl/participant.roles.view',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/dialogs/addparticipants/impl/participant.listitem',
  'hbs!conws/widgets/team/impl/dialogs/addparticipants/impl/participant.listitem.details',
  'hbs!conws/widgets/team/impl/dialogs/addparticipants/impl/participant.listitem.roles',
  'hbs!conws/widgets/team/impl/dialogs/addparticipants/impl/participant.listitem.delete',
  'css!conws/widgets/team/impl/dialogs/addparticipants/impl/participant.listitem'
], function (_, $, Marionette, TabableRegionBehavior, LayoutViewEventsPropagationMixin, Url,
    UserModelFactory, UserWidget, Avatar,
    RolePicker, ParticipantRolesListView, lang, itemTemplate, detailsTemplate, rolesTemplate,
    deleteTemplate) {

  var ParticipantPropertiesView = Marionette.ItemView.extend({

    template: detailsTemplate,

    templateHelpers: function () {
      return {
        type: this.model.getMemberType(),
        name: this.model.displayName(),
        email: this.model.displayEmail(),
        title: this.model.displayTitle(),
        department: this.model.displayDepartment(),
        office: this.model.displayOffice()
      };
    },

    ui: {
      personalizedImage: '.csui-icon-user',
      defaultImage: '.csui-icon-paceholder'
    },

    // constructor for the 'add participant' listitem
    constructor: function ParticipantPropertiesView(options) {
      options || (options = {});

      // apply properties to parent
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
      this.avatar = new Avatar({model: this.model});
    },

    onRender: function () {
      // render profile image
      if (this.model.get('type') !== undefined && this.model.get('type') === 0) {
        var loggedUser = this.model.collection.workspaceContext.getModel(UserModelFactory),
          userProfilePicOptions = {
            connector: this.model.connector,
            model: this.model,
            userid: this.model.get('id'),
            context: this.model.collection.workspaceContext,
            showUserProfileLink: true,
            showMiniProfile: true,
            loggedUserId: loggedUser.get('id'),
            placeholder: this.$el.find('.participant-picture'),
            showUserWidgetFor: 'profilepic'
          };
        UserWidget.getUser(userProfilePicOptions);
      }
      else {
        this.$('.participant-picture').append(this.avatar.render().$el);
      }
    }
  });

  var ParticipantRolesView = Marionette.LayoutView.extend({

    regions: {
      rolesListRegion: '.participant-roles-list',
      rolePickerRegion: '.conws-participants-rolepicker'
    },

    template: rolesTemplate,

    constructor: function ParticipantRolesView(options) {
      options || (options = {});

      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      // propagate events to regions
      this.propagateEventsToRegions();
    },

    onRender: function () {
      // participant roles list
      var roles = new ParticipantRolesListView({
        collection: this.model.roles
      });
      this.rolesListRegion.show(roles);
      this.listenTo(roles, 'childview:remove:role', this.onRoleItemRemove);

      // role picker
      var role = new RolePicker({
        placeholder: lang.addParticipantsRolePickerPlaceholderMore,
        roles: this.model.collection.roles,
        showInherited: false,
        prettyScrolling: true
      });
      this.rolePickerRegion.show(role);
      this.listenTo(role, 'item:change', this.onRoleItemChanged);
    },

    onRoleItemChanged: function (e) {
      this.model.roles.add(e.item);
    },

    onRoleItemRemove: function (view, args) {
      // remove assigned role
      this.model.roles.remove(args.model);

      // set focus to input field of search if the last role is remove
      if (this.model.roles.length === 0) {
        this.rolePickerRegion.currentView.trigger('updateFocus');
      }
    }
  });

  var ParticipantDeleteView = Marionette.ItemView.extend({

    template: deleteTemplate,

    templateHelpers: function () {
      return {
        removeParticipant: lang.addParticipantsRemove
      };
    },

    events: {
      'click .remove': 'onRemoveOnClick',
      'keydown .remove': 'onRemoveOnKeyDown'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function ParticipantDeleteView(options) {
      options || (options = {});

      // apply properties to parent
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    onRemoveOnClick: function (e) {
      // stop propagation
      e.preventDefault();
      e.stopPropagation();
      // remove participant
      this.model.collection.remove(this.model);
    },

    onRemoveOnKeyDown: function (e) {
      // Enter, Space or DEL?
      if (e.keyCode === 13 || e.keyCode === 32 || e.keyCode === 46) {
        // stop propagation
        e.preventDefault();
        e.stopPropagation();
        // remove participant
        this.model.collection.remove(this.model);
      }
    },

    // delete button is focused
    currentlyFocusedElement: function () {
      return this.$('.remove');
    }
  });

  var ParticipantListItemView = Marionette.LayoutView.extend({

    template: itemTemplate,

    tagName: 'li',

    className: 'binf-list-group-item conws-participant',

    regions: {
      content: '.participant-content',
      roles: '.participant-roles',
      delete: '.participant-delete'
    },

    // constructor for the 'add participant' listitem
    constructor: function ParticipantListItemView(options) {
      options || (options = {});

      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      // listen to the change of the roles
      this.listenTo(this.model.roles, 'reset remove add', this.onParticipantRolesChanged);
      // listen to the change of the model
      this.listenTo(this.model, 'remove', this.onParticipantRemove);

      // propagate events to regions
      this.propagateEventsToRegions();
    },

    onRender: function () {
      // render content
      this.content.show(
          new ParticipantPropertiesView({
            model: this.model
          }));
      // render roles
      this.roles.show(
          new ParticipantRolesView({
            model: this.model
          }));
      // render remove button
      this.delete.show(
          new ParticipantDeleteView({
            model: this.model
          }));
      // styling
      this.applyRolesStyle();
      this.applyRolesHeight(true);
    },

    onParticipantRemove:function () {
      this._parent.selectedIndex = this._index;
    },

    onParticipantRolesChanged: function (model, collection, options) {
      // and trigger participant collection change
      this.model.collection.trigger('change', this.model.collection);
      // change style ...
      this.applyRolesStyle();
      // change height - in case the options index property is
      // available the event is triggered due to a remove action.
      var added = _.isUndefined(options.index);
      this.applyRolesHeight(added);
    },

    applyRolesStyle: function () {
      // depending on the roles count the
      // item is styled
      if (this.model.roles.length !== 0) {
        this.$el.addClass('has-role');
        this.$el.removeClass('no-role');
      } else {
        this.$el.addClass('no-role');
        this.$el.removeClass('has-role');
      }
    },

    applyRolesHeight: function (add) {
      // the item height has to be calculated manually
      // as it should grow with the roles count
      //
      // get the top + bottom margin height
      var space = this.$el.outerHeight() - this.$el.height();
      // get the roles picker height
      var picker = this.$('.conws-participants-rolepicker .cs-search').outerHeight();
      // calculate  the roles list height
      var roles = this.$('.participant-roles-list').outerHeight();
      var len = this.model.roles.length;
      if (len > 1) {
        roles = (roles / (add ? len - 1 : len + 1)) * len;
      } else if (len === 1) {
        roles = (roles / (add ? len : len + 1)) * len;
      }
      this.$el.height(picker + roles + (space / 2));
    }
  });

  // add mixin
  _.extend(ParticipantRolesView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(ParticipantListItemView.prototype, LayoutViewEventsPropagationMixin);

  // return view
  return ParticipantListItemView;
});
