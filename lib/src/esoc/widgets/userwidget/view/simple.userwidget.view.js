/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/handlebars',
  'csui/lib/marionette',
  'csui/utils/url',
  'csui/controls/form/fields/userfield.view',
  'csui/utils/user.avatar.color',
  'esoc/widgets/userwidget/model/extended.model',
  'esoc/widgets/userwidget/userprofile',
  'esoc/widgets/userwidget/util',
  'esoc/widgets/userwidget/view/extendedinfotextfield.view',
  'esoc/widgets/userwidget/chat/view/presence.view',
  'esoc/widgets/userwidget/chat/chatfactory',
  'esoc/widgets/utils/chat/impl/util',
  'esoc/widgets/userwidget/view/simple.userwidget.form.view',
  'esoc/widgets/userwidget/view/simple.userwidget.tabs.view',
  'hbs!esoc/widgets/userwidget/impl/simple.userwidget',
  'hbs!esoc/widgets/userwidget/impl/edit.profile.photo',
  'i18n!esoc/widgets/userwidget/nls/lang',
  'css!esoc/widgets/userwidget/impl/userwidget.css'
], function ($, _, Backbone, Handlebars, Marionette, Url, UserFieldView,
    UserAvatarColor,
    UserExtendedInfoModel,
    UserProfile, Util,
    ExtendedInfoTextFieldView, PresenceView, ChatFactory, ChatUtil,
    SimpleUserWidgetFormView, SimpleUserWidgetViewTabs, simpleUserWidgetTemplate,
    EditProfilePhotoTemplate, Lang) {

  var SimpleUserWidgetView = Marionette.ItemView.extend({
    className: 'esoc-simple-user-widget-view',

    template: simpleUserWidgetTemplate,
    editProfilePhotoTemplate: EditProfilePhotoTemplate,
    util: Util,
    ui: {
      initialsPlaceholder: '.image_user_placeholder',
      userProfileClose : '.esoc-user-widget-dialog-close'
    },
    templateHelpers: function () {
      var extendedInfo = this.options.model.attributes.extendedInfo,
          canEdit      = !this.options.model.attributes.otherUser &&
                         (!!extendedInfo && extendedInfo.isEditable),
          chatEnabled = this.model.attributes.chatSettings && this.model.attributes.chatSettings.chatEnabled,
          presenceEnabled = chatEnabled && this.model.attributes.chatSettings.presenceEnabled && this.options.showPresenceIndicator;

      return {
        uniqueId: this.uniqueId,
        sidePanel: this.options.sidePanel,
        messages: {
          displayname: !!this.model.attributes.display_name ? this.model.attributes.display_name :
                       this.options.display_name,
          showReportsTo: canEdit || (!!extendedInfo && !!extendedInfo.reportsTo)
        },
        simpleUserProfileLabel: Lang.simpleUserProfileLabel,
        isEnableUploadProfilePicture: (!!this.options.enableUploadProfilePicture) ? true : false,
        dialogCloseButtonTooltip: Lang.dialogCloseButtonTooltip,
        chatLabel: Lang.chatLabel,
        closeDialogLabel: Lang.closeDialogLabel,
        chatSettings: { chatEnabled: chatEnabled, presenceEnabled: presenceEnabled }
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
      'click .csui-side-panel-user-profile .esoc-user-widget-dialog-close': 'closeSimpleUserWidgetUponClick',
      'keydown .esoc-user-widget-dialog-close': 'closeSimpleUserWidget',
      'click .esoc-simple-user-profile-pic-edit': 'uploadPhoto',
      'click .esoc-simple-user-profile-pic-delete': 'deletePhoto',
      'keydown .esoc-simple-user-profile-pic-edit': 'uploadPhoto',
      'keydown .esoc-simple-user-profile-pic-delete': 'deletePhoto',
      'keydown': 'onKeyDown'
    },

    onKeyDown: function (event) {
      if (event.keyCode === 9 || event.shiftKey) {
        var tabableElements = this.$el.find(this.focusablesSelector).filter(':visible');
        if (event.target === tabableElements[0] && event.shiftKey && event.which === 9) {
          this.options.sidePanel ? $('.cs-footer-btn.binf-btn').trigger('focus') : tabableElements.last().trigger('focus');
          event.preventDefault();
          event.stopPropagation();
        } else if (event.target === tabableElements[tabableElements.length - 1] &&
          !event.shiftKey) {
            this.options.sidePanel ? $('.cs-footer-btn.binf-btn').trigger('focus') : tabableElements.first().trigger('focus');
          event.preventDefault();
          event.stopPropagation();
        } else if (event.target === $('#csui-side-panel-cancel')[0]) {
          if (event.shiftKey && event.which === 9) {
            tabableElements.last().trigger('focus');
          } else if (event.keyCode === 9) {
            tabableElements.first().trigger('focus');
          }
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },

    initialize: function (options) {
      this.options = options;
      if (!this.options.model.attributes.isError) {
        var self         = this,
            ExtendedInfo = Backbone.Model.extend({}),
            messages     = this.templateHelpers().messages,
            extdInfo     = this.model.attributes.extendedInfo,
            defaultAttrs = {
              userid: this.model.attributes.userid,
              connector: this.options.connector,
              isEditable: !this.model.attributes.otherUser && !!extdInfo &&
                          extdInfo.isEditable
            };
      }
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
      var generalOptions = _.extend({}, options);
      generalOptions.model = new UserExtendedInfoModel(generalOptions);
      generalOptions.model.fetch({
        success: generalOptions.model.fetchSuccess,
        error: generalOptions.model.fetchError,
        async: false
      });
      Marionette.ItemView.prototype.constructor.call(this, generalOptions);
      this.listenTo(this, 'render', this._assignUserColor);
      this.listenTo(this,'sidepanel:keydown',this.onKeyDown);
    },
    onShow: function (e) {
      var that = this;

      var tabsViewRegion = new Marionette.Region(
        { el: this.$el.find(".esoc-simple-user-widget-tabs") });
      this.options.uniqueId = _.uniqueId();
      var tabsview = new SimpleUserWidgetViewTabs(this.options);
      tabsViewRegion.show(tabsview);
      tabsview.triggerMethod("after:show");

      tabsViewRegion.$el.find("#esoc-simple-user-profile-tab-" + this.options.uniqueId).trigger('click');

      var userId                = !!this.options.model.id ? this.options.model.id :
                                  this.options.userid,
          userProfilePicOptions = {
            userid: userId,
            context: this.options.context,
            photoElement: this.$el.find(".esoc-userprofile-img-" + Util.escapeSelector(userId)),
            defaultPhotElement: this.$el.find(".esoc-user-default-avatar-" + Util.escapeSelector(userId)),
            parentView: this,
            viewShownEvent: true
          };
      this.util.commonUtil.setProfilePic(userProfilePicOptions);
      if (this.model.attributes.chatSettings && this.model.attributes.chatSettings.chatEnabled &&
          this.model.attributes.chatSettings.presenceEnabled && this.options.showPresenceIndicator) {
        var presenceOptions = {
          id: this.model.attributes.id,
          context: this.options.context,
          username: this.model.attributes.name,
          subscribeEvent: true
        };
        var presenceRegion = new Marionette.Region({
          el: this.$el.find("#esoc-user-profile-presence-indicator")
        });
        ChatFactory.initializeApplication(this.options).promise().done(function () {
          var presenceView = new PresenceView(presenceOptions);
          presenceRegion.show(presenceView);
        });
      }
      if (!this.options.enableUploadProfilePicture || this.model.attributes.otherUser) {
        this.$el.find("#esoc-simple-user-default-avatar-" + this.uniqueId).attr("tabindex", "-1");
        this.$el.find("#esoc-simple-user-image-avatar-" + this.uniqueId).attr("tabindex", "-1");
      }
      if (!tabsview.extraTabsShownCount) {
        this.$el.find(".esoc-simple-user-widget-tabs .tab-links-header").hide();
      }
    },
    uploadPhoto: function (e) {
      if (this.processKeyEvent(e)) {
        return;
      }
      var that            = this,
          profilepicInput = this.$el.find("#esoc-profilepic-desktop-attachment");
      profilepicInput.off("change").on("change", function (e) {
        if (profilepicInput.val().length > 0) {
          var formData = new FormData(),
              photo    = profilepicInput[0].files[0];
          if (photo) {
            formData.append("photo", photo);
          }
          that.$el.find(".esoc-userprofile-actions .esoc-full-profile-avatar").addClass(
              "esoc-profile-opacity");
          that.$el.find(".esoc-userprofile-actions .esoc-profile-img-load-container").addClass(
              "esoc-progress-display");
          $(".esoc-simple-profile-img-load-container").addClass(
              "esoc-simple-profile-img-load-icon");
          var v2url      = that.options.connector.getConnectionUrl().getApiBase('v2'),
              ajaxParams = {
                "itemview": that,
                "url": Url.combine(v2url,
                    that.util.commonUtil.REST_URLS.updatePhotoUrl),
                "type": "POST",
                "requestType": "updatePhoto",
                "data": formData,
                "targetElement": e.target,
                "connector": that.options.connector
              };
          that.util.commonUtil.updateAjaxCall(ajaxParams);
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
              return ele.is(':visible') ? ele.offset() : {top: 0, left: 0};
            };
        if (!!that.options.enableUploadProfilePicture && !!that.model.attributes.photo_url) {
          this.popoverTarget = that.$el.find('.edit-user');
          var contentparams = {
                "uploadProfilePicture": Lang.uploadProfilePicture,
                "deleteProfilePicture": Lang.deleteProfilePicture
              },
              content       = this.editProfilePhotoTemplate(contentparams);
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
                  popOverMaxWidth  = $(".esoc-simple-user-edit-pic-popover-temp-div").width() + 40;
              _tempElement.remove();
              var offset        = getElementOffset($(element)),
                  window_top    = offset.top,
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
          $('.esoc-simple-user-widget-dialog').on('click', function (e) {
            $('.esoc-simple-user-widget-dialog [aria-describedby]').each(function () {
              if (!that.popoverTarget.is(e.target) &&
                  that.popoverTarget.has(e.target).length === 0 &&
                  $('.binf-popover').has(e.target).length === 0) {
                that.popoverTarget.binf_popover('destroy');
              }
            });
          });
          $('.esoc-simple-user-widget-dialog .csui-icon-edit').on('click', function (e) {
            that.popoverTarget.binf_popover('destroy');
          });
          $('.esoc-simple-user-widget-dialog .btn-container').on('click', function (e) {
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
              that.popoverTarget.siblings('img').first().trigger('focus');
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
      var v2url      = this.options.connector.getConnectionUrl().getApiBase('v2'),
          ajaxParams = {
            "itemview": this,
            "url": Url.combine(v2url,
                this.util.commonUtil.REST_URLS.deletePhotoUrl),
            "type": "DELETE",
            "requestType": "deletePhoto",
            "targetElement": e.target,
            "connector": this.options.connector
          };
      this.util.commonUtil.updateAjaxCall(ajaxParams);
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
      ChatUtil.launchChatWindow(this.options);
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
    saveOrDeclineAlert: function(e){
      var self = this;
      require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
        alertDialog.confirmWarning(Lang.txtEnableContentMgt, Lang.hrdUnsaved,
          {
            buttons: {
              showYes: true,
              labelYes: Lang.lblSave,
              showNo: true,
              labelNo: Lang.lblDiscard
            }
          })
          .done(function () {
            if( self.options.context.canBeSavedDirectlyMethod && typeof self.options.context.canBeSavedDirectlyMethod.saveContentMgtData === 'function'){
              self.options.context.canBeSavedDirectlyMethod.saveContentMgtData(true);          

            }
          }).fail(function(){
            self.options.context.canBeSavedDirectlyAlert= false;
            self.closeSimpleUserWidgetUponClick(e);
          });
      });
    },
    leaveOrCancelAlert: function(e){     
      var deferred    = $.Deferred();
      var self = this;
      require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
        self.dialog = alertDialog.confirmQuestion("",
        Lang.txtLeaveContentMgt,
            {
              buttons: {
                showYes: true,
                labelYes:Lang.lblLeave,
                showNo: false,
                showCancel: true,
                labelCancel: Lang.cancel
              },
            }).then(function (result) {
              self.options.context.cannotMoveOutOfSettingPage=false;
              self.closeSimpleUserWidgetUponClick(e);
        }, function () {
            deferred.resolve();            
        });
      }, deferred.reject);
    },
    closeSimpleUserWidgetUponClick: function (e) {
     if(this.options.context.cannotMoveOutOfSettingPage){
       this.leaveOrCancelAlert(e);
       return;
     }
     else if(this.options.context.canBeSavedDirectlyAlert){
       this.saveOrDeclineAlert(e);
       return
     }
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
      this.ui.initialsPlaceholder.css("background", "#FFFFFF");
      this.ui.initialsPlaceholder.css("color", userbackgroundcolor);
    }
  });
  return SimpleUserWidgetView;
});
