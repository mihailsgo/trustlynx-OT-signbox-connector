csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/contexts/factories/user',
  'esoc/widgets/userwidget/userwidget',
  'conws/widgets/team/impl/controls/avatar/avatar.view',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/dialogs/addoreditrole/impl/roleparticipants/impl/participant.listitem',
  'hbs!conws/widgets/team/impl/dialogs/addparticipants/impl/participant.listitem.details',
  'hbs!conws/dialogs/addoreditrole/impl/roleparticipants/impl/participant.listitem.delete',
  'css!conws/dialogs/addoreditrole/impl/roleparticipants/impl/participant.listitem'
], function (_, $, Marionette, TabableRegionBehavior, LayoutViewEventsPropagationMixin,
  UserModelFactory, UserWidget, Avatar, lang, itemTemplate, detailsTemplate,
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
        this.avatar = new Avatar({ model: this.model });
      },

      onRender: function () {
        // render profile image
        if (this.model.get('type') !== undefined && this.model.get('type') === 0) {
          var loggedUser = this.model.collection.context.getModel(UserModelFactory),
            userProfilePicOptions = {
              connector: this.model.connector,
              model: this.model,
              userid: this.model.get('id'),
              context: this.model.collection.context,
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

    var ParticipantDeleteView = Marionette.ItemView.extend({

      template: deleteTemplate,

      templateHelpers: function () {
        return {
          removeParticipant: lang.addParticipantsRemove,
          removeParticipantAria: _.str.sformat(lang.removeParticipantAria, this.model.displayName())           
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
        delete: '.participant-delete'
      },

      // constructor for the 'add participant' listitem
      constructor: function ParticipantListItemView(options) {
        options || (options = {});

        // apply properties to parent
        Marionette.LayoutView.prototype.constructor.apply(this, arguments);

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
        // render remove button
        this.delete.show(
          new ParticipantDeleteView({
            model: this.model
          }));
      },

      onParticipantRemove: function () {
        this._parent.selectedIndex = this._index;
      }
    });

    // add mixin
    _.extend(ParticipantListItemView.prototype, LayoutViewEventsPropagationMixin);

    // return view
    return ParticipantListItemView;
  });
