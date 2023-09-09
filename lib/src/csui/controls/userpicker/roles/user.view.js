/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/node-type.icon/node-type.icon.item.view.mixin',
  'hbs!csui/controls/userpicker/impl/user',
  'css!csui/controls/userpicker/impl/userpicker'
], function (_, $, Marionette, base, NodeTypeIconItemViewMixin, template) {

  var UserView = Marionette.ItemView.extend({

    template: template,

    tagName: 'div',

    className: 'csui-userpicker-item',

    ui: {
      personalizedImage: '.csui-icon-user',
      defaultImage: '.csui-icon-paceholder'
    },

    templateHelpers: function () {
      return {
        'name': base.formatMemberName(this.model),
        'email': this.model.get('business_email'),
        'title': this.model.get('title'),
        'department': this.model.get('group_id_expand') && this.model.get('group_id_expand').name,
        'office': this.model.get('office_location'),
        'disabled': this.model.get('disabled'),
        'disabled-message': this.options.disabledMessage,
        'lightWeight': !!this.options.lightWeight,
        'userImgSrc': "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
      };
    },

    constructor: function UserView(options) {
      options || (options = {});
      options.disabledMessage || (options.disabledMessage = '');
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.model.connector || (this.model.connector = this.options.connector);
      this.makeNodeTypeIconItemView();
    },

    attachElContent: function() {
      var result = Marionette.ItemView.prototype.attachElContent.apply(this,arguments);
      if (!this.options.lightWeight) {
        var targetElement = this.$('.member-picture');
        var iconClasses = 'csui-icon-paceholder csui-icon csui-initials image_user_placeholder';
        var imageClasses = 'csui-icon-user csui-icon binf-img-circle esoc-userprofile-img-' + this.model.get('id');
        this.renderNodeTypeIconView(this.model,targetElement,iconClasses,imageClasses);
      }
      return result;
    }

  });

  NodeTypeIconItemViewMixin.mixin(UserView.prototype);

  return UserView;
});
