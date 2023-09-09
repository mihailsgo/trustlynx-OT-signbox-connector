/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/handlebars',
  'nuc/lib/marionette',
  'smart/utils/user.avatar.color',
  'i18n!smart/controls/user/nls/lang',
  'hbs!smart/controls/user/impl/miniprofile',
  'css!smart/controls/user/impl/userprofile.css'
], function (module, $, _, Handlebars, Marionette, UserAvatarColor, lang, MiniProfileTemplate) {
  var config = module.config();
  _.defaults(config, {
    hideFollow: false
  });

  var MiniProfileView = Marionette.ItemView.extend({
    className: 'esoc-miniprofile-view',
    template: MiniProfileTemplate,
    ui: {
      initialsPlaceholder: '.esoc-miniprofile-default-avatar      '
    },
    templateHelpers: function () {
      var showPresenceIndicator = this.options.showPresenceIndicator !== undefined &&
        this.options.showPresenceIndicator,
        attributes = this.options.model.attributes;
      return {
        className: this.options.className,
        otherUser: attributes.otherUser,
        messages: {
          showPresenceIndicator: showPresenceIndicator,
          chat: lang.chat
        },
        contentparams: {
          "id": attributes.id,
          "display_name": attributes.display_name,
          "office_location": attributes.office_location,
          "business_email": attributes.business_email,
          "business_phone": attributes.business_phone,
          "business_phone_label": lang.simpleUserProfilePhoneLabel,
          "cell_phone_label": lang.simpleUserProfileMobile,
          "cell_phone": attributes.cell_phone,
          "title": attributes.title,
          "initials": attributes.initials,
        }
      };
    },

    events: {
      'keydown': 'onKeyInView'
    },

    initialize: function (options) {
      this.options = options;
    },
    constructor: function MiniProfileView(options) {
      options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);
      if (!this.model.id) {
        this.model.id = this.model.get('id');
      }

      var config = module.config();
      if (!!config && this.options.enableSimpleSettingsModel === undefined) {
        this.options.enableSimpleSettingsModel = config.enableSimpleUserProfile;
      }
      this.focusablesSelector = 'a[href], *[tabindex]';
    },

    onKeyInView: function (event) {

      if (event.keyCode === 9 || event.shiftKey) {
        var tabableElements = this.$el.find(this.focusablesSelector);
        if (event.target === tabableElements[0] && event.shiftKey && event.keyCode === 9) {
          tabableElements.last().trigger('focus');
          event.preventDefault();
        } else if (event.target === tabableElements[tabableElements.length - 1] &&
          !event.shiftKey) {
          tabableElements.first().trigger('focus');
          event.preventDefault();
        }
      }
    },

    getParentView: function () {
      return this.options.userWidgetView;
    },

    getElementOffset: function (ele) {
      return ele.is(':visible') ? ele.offset() : { top: 0, left: 0 };
    },

    showActions: function (responseData) {
      var that = this;
      this.model.attributes.chatSettings = (responseData && responseData.chatSettings) || this.model.attributes.chatSettings;
      $(".esoc-mini-profile-loading-img").hide();
      if (this.options.model.attributes.otherUser &&
        !this.options.model.attributes.deleted && !!this.options.model.attributes.chatSettings &&
        !!this.options.model.attributes.chatSettings.chatEnabled) {
        $(".esoc-miniprofile-chat-action-" +
          this.model.attributes.id).removeClass('binf-hidden');
        $('.esoc-simple-mini-profile-user-img .esoc-mini-profile-chat-comment').css(
          'display', 'inline-block');
          $('.esoc-simple-mini-profile-user-img .esoc-mini-profile-chat-comment').css(
            'display', 'inline-block');
            $(".esoc-miniprofile-chat-action-" +
            this.model.attributes.id).on('click', function (e) {
            that.options.tguser = that.options.model.get('name');
            that.options.domain = that.options.model.get('chatSettings') &&
              that.options.model.get('chatSettings').chatDomain;
            that.launchChatWindow();
          });

      } else {
        $(".esoc-miniprofile-chat-action-" +
          this.model.attributes.id).addClass('binf-hidden');
      }
    },

    onRender: function (e) {

      this.options.userbackgroundcolor = UserAvatarColor.getUserAvatarColor(this.model.attributes);
      this.trigger("on:render");
      var that = this;
      this.listenTo(this, "update:presence:indicator", _.bind(function (args) {
        if (args.showPresenceIndicator) {
          var presenceEle = this.$el.find("#esoc-mini-profile-presence-indicator"),
            status = args.status || "Away";
          presenceEle.removeClass("binf-hidden");
          presenceEle.find(".esoc-chat-presence-indicator").addClass("esoc-chat-presence-" + status);
          presenceEle.find(".esoc-chat-presence-indicator").attr({ 'title': status, 'aria-label': status });
        }
      }, this));
      $(".esoc-viewminiprofile-action, .esoc-mini-profile-user-name, .esoc-mini-profile-pic").off(
        'click').on('click',
          function (e) {
            e.stopPropagation();
            that.trigger("click:userprofilepic", e);
          });
    },

    onShow: function () {
      if (this.model.attributes.otherUser) {
        this.trigger("display:actions");
        this.listenTo(this, "show:display:actions", _.bind(function (responseData) {
          this.showActions(responseData);
        }, this));
      } else {
        $(" .esoc-mini-profile-loading-img").hide();
        $(" .esoc-mini-profile-actions").show();
      }

      if (this.model.id !== undefined) {
        var photoElement = this.$el.find("img.esoc-userprofile-img-" + this.options.model.get("id"));
        photoElement.hide();
        photoElement.removeClass("binf-hidden");
        this.ui.initialsPlaceholder.addClass("esoc-user-show-profilepic");
        this.ui.initialsPlaceholder.css("display", "inline-flex");
        this.ui.initialsPlaceholder.removeClass("binf-hidden");
        this.trigger("set:profile:pic");
        this._assignUserColor();
      }
    },

    launchChatWindow: function () {
      this.trigger("launch:chat:window");
    },
    _assignUserColor: function () {
      var defaultPhotElement = $(".esoc-user-default-avatar-" + this.options.userid);

      defaultPhotElement.css("background", this.options.userbackgroundcolor);
    }
  });
  return MiniProfileView;
});
