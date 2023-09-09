/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/nodesprites',
  'csui/controls/node-type.icon/node-type.icon.item.view.mixin',
  'hbs!csui/controls/typeaheadpicker/impl/typeaheaditem',
  'css!csui/controls/typeaheadpicker/impl/typeaheadpicker'
], function (_, $, Marionette, base, nodeSpriteCollection,
  NodeTypeIconItemViewMixin, template) {

  var TypeaheadItemView = Marionette.ItemView.extend({

    template: template,

    tagName: 'div',

    className: 'csui-typeaheadpicker-item',

    ui: {
      customImage: '.item-picture .csui-custom-image',
      defaultIcon: '.item-picture .csui-default-icon'
    },

    templateHelpers: function () {
      var moreHtml;
      if (this.options.hbs && this.options.hbs.itemMoreTemplate) {
        var moreData = this.options.hbs.itemMoreHelper ? this.options.hbs.itemMoreHelper.call(this) : this.model.attributes;
        moreHtml = this.options.hbs.itemMoreTemplate(moreData);
      }
      return {
        'name': this.formatItemName(this.model),
        'moreHtml': moreHtml,
        'disabled': this.model.get('disabled'),
        'disabled-message': this.options.disabledMessage,
        'lightWeight': !!this.options.lightWeight,
        'imageUrl': "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
        cssItemName: this.options.css && this.options.css.itemName || 'name',
        cssCustomImage: this.options.css && this.options.css.customImage || 'csui-icon binf-img-circle',
        cssDefaultIcon: this.options.css && this.options.css.defaultIcon || 'csui-icon csui-initials image_typeahead_placeholder'
      };
    },

    formatItemName: function(model) {
      return this.options.formatItemName ? this.options.formatItemName(model) : base.formatMemberName(model);
    },

    constructor: function TypeaheadItemView(options) {
      options || (options = {});
      options.disabledMessage || (options.disabledMessage = '');

      if (options.css && options.css.root) {
        this.className = options.css.root;
      }
      Marionette.ItemView.prototype.constructor.call(this, options);

      this.model.connector || (this.model.connector = this.options.connector);
      this.makeNodeTypeIconItemView();
    },

    attachElContent: function() {
      var result = Marionette.ItemView.prototype.attachElContent.apply(this,arguments);
      if (!this.options.lightWeight) {
        var targetElement = this.$('.item-picture');
        var iconClasses = this.options.css && this.options.css.defaultIcon || 'csui-icon csui-initials image_typeahead_placeholder';
        var imageClasses = this.options.css && this.options.css.customImage || 'csui-icon binf-img-circle';
        iconClasses += ' csui-default-icon';
        imageClasses += ' csui-custom-image';
        var options ={};
        if ((" "+iconClasses+" ").indexOf(" csui-initials ")<0 && (" "+iconClasses+" ").indexOf(" csui-nodesprites ")<0) {
          options.nodeSprite = new nodeSpriteCollection.model({ className: iconClasses });
        }
        this.renderNodeTypeIconView(this.model,targetElement,iconClasses,imageClasses,options);
      }
      return result;
    }

  });

  NodeTypeIconItemViewMixin.mixin(TypeaheadItemView.prototype);

  return TypeaheadItemView;
});
