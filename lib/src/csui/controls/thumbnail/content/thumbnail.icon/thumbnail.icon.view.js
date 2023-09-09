/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/utils/node.links/node.links',
  'hbs!csui/controls/thumbnail/content/thumbnail.icon/impl/thumbnail.icon',
  'hbs!csui/controls/thumbnail/content/thumbnail.icon/impl/thumbnail.image',
  'i18n!csui/controls/thumbnail/content/thumbnail.icon/impl/nls/localized.strings',
  'csui/controls/thumbnail/content/content.registry',
  'csui/controls/thumbnail/content/thumbnail.icon/gallery.plugin.view',
  'csui/utils/thumbnail/thumbnail.object',
  'csui/utils/url',
  'csui/lib/exif',
  'css!csui/controls/thumbnail/content/thumbnail.icon/impl/thumbnail.icon'
], function (module, _, $, Backbone, Marionette, base, NodeTypeIconView, nodeLinks, template,
    templateImage, lang, ContentRegistry, GalleryPluginView, Thumbnail, Url, EXIF) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    parallelism: 3,
    streaming: false
  });
  
  var ThumbnailIconView = Marionette.LayoutView.extend({

    className: 'csui-thumbnail-icon-view',

    ui: {
      thumbnailIcon: '.csui-thumbnail-content-icon',
      iconcloseGallery: '.icon-close-gallery'
    },

    events: {
      'keydown': 'onKeyInView',
      'keydown click @ui.iconcloseGallery': 'handleShiftKey',
      'click @ui.thumbnailIcon': 'showThumbCarousel',
      'keyup @ui.thumbnailIcon': 'showGalleryView'
    },

    template: template,

    regions: {
      imageRegion: '.csui-thumbnail-content-icon'
    },

    templateHelpers: function () {
      var node             = this.model,
          thumbnailAction  = this.model.get("mime_type") &&
                             this.model.get("mime_type").match(/^image|video\/*[-.\w\s]*$/g) ||
                             this.model.get("type") === 144,
          defaultActionUrl = nodeLinks.getUrl(this.model),
          typeAndName      = _.str.sformat(lang.typeAndNameAria, node.get('type_name'),
              node.get('name'));
      return {
        thumbnailAction: thumbnailAction,
        cid: (this.model && this.model.cid) || this.options.model.cid,
        defaultActionUrl: defaultActionUrl,
        typeAndNameAria: typeAndName,
        inactive: node.get('inactive'),
        inCreateMode: !this.model.get('id') // if node is in create mode e.g. add folder,
      };
    },

    constructor: function ThumbnailIconView(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      this.thumbnailObj = new Thumbnail({node: this.model});
      this.listenTo(this.thumbnailObj, 'loadUrl', this.render);
      this.showingCarousel = false;
    },

    onRender: function () {
      var originatingView = this.options.originatingView;
      if ((originatingView.getContainerPrefs &&
           !!originatingView.getContainerPrefs('isThumbnailEnabled'))
          || !originatingView.getContainerPrefs || !originatingView.container.get('persist')) {
        if (this.thumbnailObj.available()) {
          var hasImageUrl = this.thumbnailObj.imgUrl ||
                            (this.thumbnailObj.node &&
                             this.thumbnailObj.node.get('csuiThumbnailImageUrl'));
          var imageView;
          if (config.streaming && hasImageUrl) {
            if (!this.thumbnailObj.node.get("mime_type").match(/^video\/*[-.\w\s]*$/g)) {
              imageView = new ThumbnailImageView({model: this.model});
              this.imageRegion.show(imageView);
              return; // don't show the NodeTypeIconView
            }
          } else if (hasImageUrl) {
            imageView = new ThumbnailImageView({model: this.model});
            this.imageRegion.show(imageView);
            return; // don't show the NodeTypeIconView
          } else {
            this.thumbnailObj.loadUrl();
          }
        }
        var iconView = new NodeTypeIconView({node: this.model, size: 'contain'});
        this.imageRegion.show(iconView);
      }
    },

    showGalleryView: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.showThumbCarousel(event);
      }
    },


    showThumbCarousel: function (event) {
      if (!this.showingCarousel) {
        this.showingCarousel = true;
        var self            = this,
            showGalleryView = false;
        if (base.isSafari() || base.isMSBrowser() || base.isAppleMobile()) {
          showGalleryView = this.model.get("mime_type") &&
                            (this.model.get("mime_type").match(/^image\/*[-.\w\s]*$/g) ||
                             this.model.get("mime_type").match(/^video\/(mp4|mov|quicktime)$/g));
        } else {
          showGalleryView = this.model.get("mime_type") &&
                            (this.model.get("mime_type").match(/^image\/*[-.\w\s]*$/g) ||
                             this.model.get("mime_type").match(/^video\/(mp4|webm|ogg|mov|quicktime)$/g));
        }
        if (showGalleryView && showGalleryView.length > 0) {
          this.options.originatingView.blockingView.enable();
          var thumbNailCollection = _.filter(self.model.collection.models, function (model) {
            if (base.isSafari() || base.isMSBrowser() || base.isAppleMobile()) {
              return model.get("mime_type") &&
                     (model.get("mime_type").match(/^image\/*[-.\w\s]*$/g) ||
                      model.get("mime_type").match(/^video\/(mp4|mov|quicktime)$/g));
            } else {
              return model.get("mime_type") &&
                     (model.get("mime_type").match(/^image\/*[-.\w\s]*$/g) ||
                      model.get("mime_type").match(/^video\/(mp4|webm|ogg|mov|quicktime)$/g));
            }
          }, this);
          var galleryPluginView = new GalleryPluginView({
        	  thumbNailCollection: thumbNailCollection,
        	  model: self.model,
        	  originatingView: self.options.originatingView,
        	  event: event,
        	  streaming: config.streaming
          });
          galleryPluginView.render();
          
          setTimeout(function () {
        	 self.showingCarousel = false;
          }, 250);         
        } else if (!this.model.get("inactive") && !!this.model.get('id')) {
          this.showingCarousel = false;
          this.trigger('execute:defaultAction', event);
        }
      }
    },

    onKeyInView: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.$el.find('a.csui-thumbnail-content-default-action').trigger('click');
      }
    }
  });

  var ThumbnailImageView = Marionette.ItemView.extend({

    templateHelpers: function () {
      var description = this.model.get('description');

      return {
        imgUrl: this.model.get('csuiThumbnailImageUrl'),
        title: description ? description : this.model.get('name')
      };
    },

    template: templateImage,

    constructor: function ThumbnailImageView(options) {
      options || (options = {});

      ThumbnailImageView.__super__.constructor.call(this, options);
    }
  });

  ContentRegistry.registerByKey('thumbnailIcon', ThumbnailIconView);
  return ThumbnailIconView;
});
