/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/jquery',
  'nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/lib/marionette',
  'smart/utils/user.avatar.color',
  'smart/controls/user/user.profile.tabs.view',
  'smart/controls/globalmessage/globalmessage',
  'hbs!smart/controls/user/impl/user.profile',
  'hbs!smart/controls/user/impl/edit.profile.photo',
  'i18n!smart/controls/user/nls/lang',
  'css!smart/controls/user/impl/userprofile.css',
  'css!smart/controls/user/impl/profileloading.css'
], function ($, _, Backbone, Marionette,
  UserAvatarColor,
  SimpleUserWidgetViewTabs,
  GlobalMessage,
  simpleUserWidgetTemplate,
  EditProfilePhotoTemplate, Lang) {

  var SimpleUserWidgetView = Marionette.ItemView.extend({
    className: 'esoc-simple-user-widget-view',

    template: simpleUserWidgetTemplate,
    editProfilePhotoTemplate: EditProfilePhotoTemplate,
    ui: {
      initialsPlaceholder: '.image_user_placeholder',
      userProfileClose: '.esoc-user-widget-view-close'
    },
    templateHelpers: function () {
      var extendedInfo = this.options.model.attributes.extendedInfo,
        canEdit = !this.options.model.attributes.otherUser &&
          (!!extendedInfo && extendedInfo.isEditable),
        chatEnabled = this.chatEnabled || (this.model.get("chatSettings") && this.model.get("chatSettings").chatEnabled),
        presenceEnabled = this.showPresenceIndicator;

      return {
        uniqueId: this.uniqueId,
        messages: {
          displayname: !!this.model.attributes.display_name ? this.model.attributes.display_name :
            this.options.display_name,
        },
        userid: this.options.userid,
        simpleUserProfileLabel: Lang.simpleUserProfileLabel,
        closeButtonTooltip: Lang.closeButtonTooltip,
        chatLabel: Lang.chatLabel,
        closeLabel: Lang.closeLabel,
        chatSettings: { chatEnabled: chatEnabled, presenceEnabled: presenceEnabled },
        otherUser: this.options.otherUser,
        showChatIcon: this.options.model.get("otherUser") && chatEnabled,
        isEditable: !!this.options.enableUploadProfilePicture && !this.model.attributes.otherUser,
        backButton: this.options.showBackButton
      };
    },
    events: {
      'mouseover .esoc-simple-user-widget-header .edit-user': 'onMouseoverProfilePic',
      'mouseout .edit-user': 'onMouseoutProfilePic',
      'focusin .edit-user': 'onMouseoverProfilePic',
      'focusout .edit-user': 'onMouseoutProfilePic',
      'click .esoc-simple-user-widget-header .edit-user': 'editProfilePhoto',
      'click .esoc-user-profile-chat-comment': 'launchChatWindow',
      'keydown .esoc-user-profile-chat-comment': 'launchChatWindow',
      'keydown .user-widget-view-close': 'closeSimpleUserWidget',
      'click .esoc-simple-user-profile-pic-edit': 'uploadPhoto',
      'click .esoc-simple-user-profile-pic-delete': 'deletePhoto',
      'keydown .esoc-simple-user-profile-pic-edit': 'uploadPhoto',
      'keydown .esoc-simple-user-profile-pic-delete': 'deletePhoto',
      'keydown': 'onKeyDown'
    },

    triggers: {
      'click .cs-go-back': "click:back:button"
    },

    onKeyDown: function (event) {
      var tabEle = this.$el.find(".esoc-user-profile-tab"),
        tabbleEle = tabEle.find("a").filter('*[tabindex=0]');

      if (!tabbleEle.length) {
        tabEle.first().find("a").attr("tabindex", 0);
      }

      if (this.options.customKN) {
        this.trigger("custom:KN", event);
      } else {
        if (event.keyCode === 9 || event.shiftKey) {
          var tabableElements = this.$el.find(this.focusablesSelector).filter('*[tabindex=0]:visible');
          if (event.target === tabableElements[0] && event.shiftKey && event.which === 9) {
            tabableElements.last().trigger('focus');
            event.preventDefault();
          } else if (event.target === tabableElements[tabableElements.length - 1] &&
            !event.shiftKey) {
            tabableElements.first().trigger('focus');
            event.preventDefault();
          }
        }
      }
    },

    initialize: function (options) {
      this.options = options;

      this.uniqueId = _.uniqueId();
      var mouseoverOnDefaultAvatar = 'mouseover #esoc-simple-user-default-avatar-' + this.uniqueId;
      this.events[mouseoverOnDefaultAvatar] = 'onMouseoverProfilePic';
      var focusOnDefaultAvatar = 'focusin #esoc-simple-user-default-avatar-' + this.uniqueId;
      this.events[focusOnDefaultAvatar] = 'onMouseoverProfilePic';
      var mouseoutFromDefaultAvatar = 'mouseout #esoc-simple-user-default-avatar-' + this.uniqueId;
      this.events[mouseoutFromDefaultAvatar] = 'onMouseoutProfilePic';
      var focusoutFromDefaultAvatar = 'focusout #esoc-simple-user-default-avatar-' + this.uniqueId;
      this.events[focusoutFromDefaultAvatar] = 'onMouseoutProfilePic';
      var keydownOnDefaultAvatar = 'keydown #esoc-simple-user-default-avatar-' + this.uniqueId;
      this.events[keydownOnDefaultAvatar] = 'editProfilePhoto';
      var mouseoverOnImageAvatar = 'mouseover #esoc-simple-user-image-avatar-' + this.uniqueId;
      this.events[mouseoverOnDefaultAvatar] = 'onMouseoverProfilePic';
      var focusOnImageAvatar = 'focusin #esoc-simple-user-image-avatar-' + this.uniqueId;
      this.events[focusOnImageAvatar] = 'onMouseoverProfilePic';
      var mouseoutFromImageAvatar = 'mouseout #esoc-simple-user-image-avatar-' + this.uniqueId;
      this.events[mouseoutFromImageAvatar] = 'onMouseoutProfilePic';
      var focusoutFromImageAvatar = 'focusout #esoc-simple-user-image-avatar-' + this.uniqueId;
      this.events[focusoutFromImageAvatar] = 'onMouseoutProfilePic';
      var keydownOnImageAvatar = 'keydown #esoc-simple-user-image-avatar-' + this.uniqueId;
      this.events[keydownOnImageAvatar] = 'editProfilePhoto';
      this.focusablesSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]),' +
        'textarea:not([disabled]),  button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]';
      this.delegateEvents();
    },
    constructor: function SimpleUserWidgetView(options) {
      options = options || {};
      this.chatEnabled = options.chatEnabled;
      this.showPresenceIndicator = this.chatEnabled && options.showPresenceIndicator;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.listenTo(this, 'render', this._assignUserColor);
      this.listenTo(this, 'upload:inprogress', this.uploadInProgress);
      this.listenTo(this, 'upload:done', this.uploadDone);
      this.listenTo(this, 'update:profilepic:failure', this.updateProfilePicFailure);
      this.listenTo(this, 'delete:done', this.deletedDone);
    },
    openErrorMessage: function (args) {
      if(args.region){
        GlobalMessage.setMessageRegionView(args.region);
      }
      const options = {
        doAutoClose: false,
      };
      const msg = GlobalMessage.showMessage("error", this.replaceBreakTagWithNewLine(args.errorContent), '', options);
    },
    replaceBreakTagWithNewLine: function (content) {
      if (content) {
        var breakTagRegEx = /<br\s*[\/]?>/gi;
        return content.replace(breakTagRegEx, '\n');
      } else {
        return "";
      }
    },

    uploadInProgress: function () {
      this.$el.find(
        ".esoc-userprofile-actions .esoc-profile-img-load-container").removeClass(
          "esoc-progress-display");
      this.$el.find(".esoc-userprofile-actions .esoc-full-profile-avatar").removeClass(
        "esoc-profile-opacity");
      this.$el.find($("#esoc-profilepic-desktop-attachment")).val("");

    },

    uploadDone: function () {
      $(".esoc-simple-profile-img-load-container").removeClass(
        "esoc-simple-profile-img-load-icon");
    },

    updateProfilePicFailure: function (photoErrorArgs) {
      $(".esoc-simple-profile-img-load-container").removeClass(
        "esoc-simple-profile-img-load-icon");
      this.openErrorMessage(photoErrorArgs);
    },

    deletedDone: function () {
      this.$el.find(".esoc-userprofile-default-avatar").css("display", "inline-flex");
    },

    onShow: function (e) {
      var that = this;

       var tabsViewRegion = new Marionette.Region(
          { el: this.$el.find(".esoc-simple-user-widget-tabs") });
        this.options.uniqueId = _.uniqueId();
        var tabsview = new SimpleUserWidgetViewTabs(this.options);
        tabsViewRegion.show(tabsview);
        tabsview.triggerMethod("after:show");
        var firstEle = tabsViewRegion.$el.find(".esoc-user-profile-tab").first();
        if(firstEle.length){
          firstEle.trigger('click');
          firstEle.addClass("binf-active");
          firstEle.find("a").attr("tabindex",0);
        }

      this.trigger("set:profile:pic");
      if (this.model.attributes.chatSettings && this.model.attributes.chatSettings.chatEnabled &&
        this.model.attributes.chatSettings.presenceEnabled && this.options.showPresenceIndicator) {
        this.trigger("render:presence:view");
        this.listenTo(this, "update:presence", _.bind(function (args) {
          if (args.showPresenceIndicator) {
            var presenceEle = this.$el.find("#esoc-user-profile-presence-indicator"),
              status = args.status || "Away";
            presenceEle.removeClass("binf-hidden");
            presenceEle.find(".esoc-chat-presence-indicator").addClass("esoc-chat-presence-" + status);
            presenceEle.find(".esoc-chat-presence-indicator").attr({'title': status, 'aria-label':status});
          }
        }, this));
      }
      if (!this.options.enableUploadProfilePicture || this.model.attributes.otherUser) {
        this.$el.find("#esoc-simple-user-default-avatar-" + this.uniqueId).attr("tabindex", "-1");
        this.$el.find("#esoc-simple-user-image-avatar-" + this.uniqueId).attr("tabindex", "-1");
      }
      
      if (tabsview.extraTabsShownCount <= 1) {
        this.$el.find(".esoc-simple-user-widget-tabs .tab-links-header").hide();
        this.$el.find(".esoc-simple-user-widget-body").addClass("smart-without-tab-header");
      }
    },
    uploadPhoto: function (e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      var that = this,
        profilepicInput = this.$el.find("#esoc-profilepic-desktop-attachment");
      profilepicInput.off("change").on("change", function (e) {
        if (profilepicInput.val().length > 0) {
          var formData = new FormData(),
            photo = profilepicInput[0].files[0];
          if (photo) {
            formData.append("photo", photo);
          }
          that.$el.find(".esoc-userprofile-actions .esoc-full-profile-avatar").addClass(
            "esoc-profile-opacity");
          that.$el.find(".esoc-userprofile-actions .esoc-profile-img-load-container").addClass(
            "esoc-progress-display");
          $(".esoc-simple-profile-img-load-container").addClass(
            "esoc-simple-profile-img-load-icon");
          var uploadPhotoOptions = { formData: formData, target: e.target, upload: true };
          that.trigger("update:ajax:call", uploadPhotoOptions);
          that.$el.find(".edit-user").css("opacity", "0");
        }
      });
      e.preventDefault();
      profilepicInput.trigger("click");
      this.$el.find(".edit-user").css("opacity", "0");
      this.$el.find(".esoc-full-profile-avatar-cursor").trigger('focus');
    },

    editProfilePhoto: function (e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      if (this.$el.find(".esoc-simple-user-edit-pic-popover").is(':visible')) {
        this.popoverTarget.binf_popover('destroy');
      }
      else {
        var that = this,
          getElementOffset = function (ele) {
            return ele.is(':visible') ? ele.offset() : { top: 0, left: 0 };
          };
        if (!!that.options.enableUploadProfilePicture && !!that.model.attributes.photo_url) {
          this.popoverTarget = that.$el.find('.edit-user');
          var contentparams = {
            "uploadProfilePicture": Lang.uploadProfilePicture,
            "deleteProfilePicture": Lang.deleteProfilePicture
          },
            content = this.editProfilePhotoTemplate(contentparams);
          this.popoverTarget.binf_popover({
            content: content,
            html: true,
            placement: function (tip, element) { //$this is implicit
              $(tip).addClass("esoc-simple-user-edit-pic-popover");
              var _tempElement = $('<div/>').addClass(
                "esoc-simple-user-edit-pic-popover binf-popover esoc-simple-user-edit-pic-popover-temp-div")
                .append(that.editProfilePhotoTemplate);
              that.popoverTarget.find('.edit-user').append(_tempElement);
              var popOverMaxHeight = $(".esoc-simple-user-edit-pic-popover-temp-div").height() + 40,
                popOverMaxWidth = $(".esoc-simple-user-edit-pic-popover-temp-div").width() + 40;
              _tempElement.remove();
              var offset = getElementOffset($(element)),
                window_top = offset.top,
                window_bottom = (($(window).height()) -
                  (window_top + that.popoverTarget.outerHeight(true)));
              if (window_bottom > popOverMaxHeight) {
                return "bottom";
              }
              else if (window_top > popOverMaxHeight) {
                return "top";
              } else {
                return "auto";
              }
            }
          });
          this.popoverTarget.binf_popover('show');
          $("*").one('scroll', function () {
            that.popoverTarget.binf_popover('destroy');
          });
          $('.esoc-simple-user-widget-view').on('click', function (e) {
            $('.esoc-simple-user-widget-view [aria-describedby]').each(function () {
              if (!that.popoverTarget.is(e.target) &&
                that.popoverTarget.has(e.target).length === 0 &&
                $('.binf-popover').has(e.target).length === 0) {
                that.popoverTarget.binf_popover('destroy');
              }
            });
          });
          $('.esoc-simple-user-widget-view .csui-icon-edit').on('click', function (e) {
            that.popoverTarget.binf_popover('destroy');
          });
          $('.esoc-simple-user-widget-view .btn-container').on('click', function (e) {
            that.popoverTarget.binf_popover('destroy');
          });
          this.$el.find(".esoc-simple-user-profile-pic-update").on('keydown', function (e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode !== 13) {
              e.preventDefault();
              e.stopPropagation();
            }
            if (keyCode === 27) {
              that.popoverTarget.binf_popover('destroy');
              that.$el.find(".edit-user").css("opacity", "1");
              if (that.popoverTarget.siblings('span').first().is(":visible")) {
                that.popoverTarget.siblings('span').first().focus();
              }
              else {
                that.popoverTarget.siblings('img').first().focus();
              }
            }
            if (e.target.classList.contains("esoc-simple-user-profile-pic-edit")) {
              if (keyCode === 40 || keyCode === 38) {
                $(".esoc-simple-user-profile-pic-delete").trigger('focus');
              }
            }
            else if (e.target.classList.contains("esoc-simple-user-profile-pic-delete")) {
              if (keyCode === 40 || keyCode === 38) {
                $(".esoc-simple-user-profile-pic-edit").trigger('focus');
              }
            }
          });
          this.$el.find(".esoc-simple-user-profile-pic-edit").trigger('focus');
          this.$el.find(".esoc-simple-user-profile-pic-edit").attr("tabindex", "0");
          this.$el.find(".esoc-simple-user-profile-pic-delete").attr("tabindex", "0");
        }
        else {
          this.uploadPhoto(e);
        }
      }
    },

    deletePhoto: function (e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      this.popoverTarget.binf_popover('destroy');
      this.trigger("update:ajax:call", { target: e.target, upload: false });
    },

    onMouseoverProfilePic: function () {
      this.$el.find(".edit-user").css("opacity", "1");
    },

    onMouseoutProfilePic: function () {
      this.$el.find(".edit-user").css("opacity", "0");
    },

    launchChatWindow: function (e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      this.options.tguser = this.options.model.get('name');
      this.options.domain = this.options.model.get('chatSettings') &&
        this.options.model.get('chatSettings').chatDomain;
      this.trigger("launch:chat:window");
    },

    onDestroy: function () {
      var element = this.options.targetEle;
      if (element && $(element).is(':visible')) {
        $(element).trigger('focus');
      } else if (!element) {
        element = $('.nav-profile');
        if (element && element.length) {
          element.trigger('focus');
        }
      }
      this.$el.find(".esoc-simple-user-profile-pic-update").off('keydown');
      if (this.$el.hasClass('csui-dialog-page-reload')) {
        location.reload();
      }
    },

    closeSimpleUserWidget: function (e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      var target = $(e.target);
      target.trigger('click');
    },

    closeSimpleUserWidgetUponClick: function (e) {
      this.trigger('destroy');
    },

    processKeyEvent: function (e) {
      if (e.type === "keydown") {
        var keyCode = e.keyCode || e.which;
        if (keyCode !== 32 && keyCode !== 13) {
          return true;
        }
      }
      return false;
    },

    _assignUserColor: function () {
      var userbackgroundcolor = UserAvatarColor.getUserAvatarColor(this.model.attributes);
      this.ui.initialsPlaceholder.css("color", "#FFFFFF");
      this.ui.initialsPlaceholder.css("background", userbackgroundcolor);
    }
  });
  return SimpleUserWidgetView;
});
