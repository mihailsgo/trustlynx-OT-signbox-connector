/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/base',
  'csui/controls/userpicker/roles/user.view', // UserItemView
  'csui/utils/user.avatar.color', // UserAvatarColor
  'csui/utils/url', //URL
  'hbs!csui/dialogs/restructure/impl/memberlist/impl/memberlist', // listTemplate
  'hbs!csui/dialogs/restructure/impl/memberlist/impl/memberitem', // itemTemplate
  'i18n!csui/dialogs/restructure/impl/nls/lang', // lang
  'css!csui/dialogs/restructure/impl/memberlist/impl/memberlist'
], function (_, Marionette, base,
    UserItemView, UserAvatarColor, Url,
    listTemplate, itemTemplate, lang) {
  'use strict';

  var MemberItemView = UserItemView.extend({
    constructor: function MemberItemView(options) {
      options || (options = {});
      UserItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'render', this._assignUserColor);
    },

    onRender: function () {
      if (!this.options.lightWeight) {
        this._displayProfileImage();
      }
    },

    onDestroy: function () {
      this._releasePhotoUrl();
    },

    className: 'csui-member-list-item binf-list-group-item',

    template: itemTemplate,

    tagName: "li",

    attributes: {tabindex:'0'},

    ui: {
      personalizedImage: '.csui-icon-user',
      defaultImage: '.csui-icon-paceholder'
    },

    templateHelpers: function () {
      return {
        'name': base.formatMemberName(this.model),
        'initials': this.model.get('initials'),
        'userImgSrc': "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
        };
    },

    events: {
      'click .icon-remove': 'onClickRemove',
      'focus .circle_delete': 'onFocusEnter',
      'blur .circle_delete': 'onFocusLeave',
      'keydown':'onKeyDown'
    },

    onClickRemove: function () {
      this.triggerMethod('remove:member');
      !this.cancelClick && this.destroy();
    },

    onKeyDown: function(event){
      if(event.keyCode === 46 ){ // delete key
        this.onClickRemove();
      }
    },

    onFocusEnter: function(){
      this.$el.addClass('focused');
    },

    onFocusLeave: function(){
      this.$el.removeClass('focused');
    },

    _displayProfileImage: function () {
      var photoUrl = this._getUserPhotoUrl();
      this.ui.personalizedImage.addClass("csui-userprofile-img-" + this.model.get('id'));
      if (photoUrl) {
        var getPhotoOptions = {
          url: photoUrl,
          dataType: 'binary'
        };
        this._releasePhotoUrl();
        this.options.model.connector.makeAjaxCall(getPhotoOptions)
            .always(_.bind(function (response, statusText, jqxhr) {
              if (jqxhr.status === 200) {
                this._showPersonalizedImage(response);
              } else {
                this._showDefaultImage();
              }
            }, this));
      } else {
        this._showDefaultImage();
      }
    },

    _getUserPhotoUrl: function () {
      var connection = (this.options.model && this.options.model.connector.connection) ||
                       (this.options.connector && this.options.connector.connection),
          cgiUrl     = new Url(connection.url).getCgiScript(),
          photoPath  = this.model.get('photo_url');
      if (photoPath && photoPath.indexOf('?') > 0) {
        return Url.combine(cgiUrl, photoPath);
      }
    },

    _showPersonalizedImage: function (imageContent) {
      this._releasePhotoUrl();
      this._photoUrl = URL.createObjectURL(imageContent);
      this.ui.personalizedImage.attr("src", this._photoUrl);
      this.ui.defaultImage.addClass('binf-hidden');
      this.ui.personalizedImage.removeClass('binf-hidden');
    },

    _showDefaultImage: function (imageContent) {
      this._releasePhotoUrl();
      this.ui.personalizedImage.addClass('binf-hidden');
      this.ui.defaultImage.removeClass('binf-hidden');
    },

    _releasePhotoUrl: function () {
      if (this._photoUrl) {
        URL.revokeObjectURL(this._photoUrl);
        this._photoUrl = undefined;
      }
    },

    _assignUserColor: function(){
      if ( this.model.get('type') === 0 ) {
        var userbackgroundcolor = UserAvatarColor.getUserAvatarColor(this.model.attributes);
        this.ui.defaultImage.css("background",userbackgroundcolor);
      }
    }

  });

  var MemberListView = Marionette.CompositeView.extend({

    className: 'csui-member-list-group',

    constructor: function MemberListView(options) {
      options || (options = {});
      options.data || (options.data = {});
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);

      this.$el.one('mouseenter', _.bind(function () {
        this.triggerMethod('dom:refresh');
      }, this));
    },

    template: listTemplate,

    templateHelpers: function () {
      var title = this.options.data.title;
      return {
        title: title
       };
    },

    childViewContainer: '.binf-list-group',

    childView: MemberItemView,
	  childViewOptions: function () {
      return {
        connector: this.options.connector,
        templateHelpers: function () {
          return {
            name: base.formatMemberName(this.model),
            ariaDelete: lang.removeAssignee
          };
        }
      };
    },

    onChildviewRemoveMember: function (childView) {
      this.triggerMethod('remove:member', childView);
    }

  }, {
    getNameByValue: function (obj, val) {
      var prop = _.findWhere(obj, {value: val});
      return prop && prop.name;
    }
  });

  return MemberListView;

});
