csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/url',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/controls/avatar/impl/avatar',
  'css!conws/widgets/team/impl/controls/avatar/impl/avatar'
], function (_, $, Marionette, Url, lang, template) {

  var AvatarView = Marionette.LayoutView.extend({

    template: template,

    templateHelpers: function () {
      return {
        type: this.model.getMemberType()
      };
    },

    ui: {
      profileImage: '.participant-picture > img',
      profileImageDefault: '.participant-picture > span'
    },

    // constructor for the 'add participant' listitem
    constructor: function AvatarView(options) {
      options || (options = {});

      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },

    onRender: function () {
      // render profile image
      this._displayProfileImage();
    },

    _displayProfileImage: function () {
      var photoUrl = this._getUserPhotoUrl();
      // esoc-userprofile-img-{userid} - the common class for all profile pictures of given userid
      this.ui.profileImage.addClass("esoc-userprofile-img-" + this.model.get('id'));
      if (photoUrl) {
        var getPhotoOptions = this.model.connector.extendAjaxOptions({
          url: photoUrl,
          dataType: 'binary'
        });
        this._releasePhotoUrl();
        this.model.connector.makeAjaxCall(getPhotoOptions)
            .always(_.bind(function (response, statusText, jqxhr) {
              if (jqxhr.status === 200) {
                this.photoUrl = URL.createObjectURL(response);
                this.ui.profileImage.attr("src", this.photoUrl);
                this.ui.profileImageDefault.remove();
              } else {
                this.ui.profileImage.remove();
                this.ui.profileImageDefault.addClass(this._getPlaceholderImageClass());
              }
            }, this));
      } else {
        this.ui.profileImage.remove();
        this.ui.profileImageDefault.addClass(this._getPlaceholderImageClass());
      }
    },

    _getUserPhotoUrl: function () {
      var connection = this.model.connector.connection,
          cgiUrl     = new Url(connection.url).getCgiScript(),
          memberId   = this.model.get('id'),
          photoId    = this.model.get('photo_id');
      // If the photo id is not set, there was a problem retrieving it. It
      // does not make sense to try it once more from the client side, waste
      // time and server resources and litter the log by 404 errors.
      if (photoId) {
        // constant REST api path, because the service is not returning the photo_url
        var photoPath = _.str.sformat('api/v1/members/{0}/photo?v={1}', memberId, photoId);
        return Url.combine(cgiUrl, photoPath);
      }
    },

    _getPlaceholderImageClass: function () {
      return (this.model.getMemberType() === 'user')
          ? 'conws-avatar-user-placeholder'
          : (this.model.getMemberType() === 'group')
                 ? 'conws-avatar-group-placeholder'
                 : 'conws-avatar-role-placeholder';
    },

    _releasePhotoUrl: function () {
      if (this.photoUrl) {
        URL.revokeObjectURL(this.photoUrl);
      }
    }
  });

  return AvatarView;

});
