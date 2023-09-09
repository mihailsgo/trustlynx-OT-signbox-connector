/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/jquery.parse.param',
  'csui/lib/marionette',
  'csui/models/nodes',
  'csui/utils/base',
  'csui/controls/thumbnail/content/thumbnail.icon/util/gallery.view',
  'i18n!csui/controls/thumbnail/content/thumbnail.icon/impl/nls/localized.strings',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/controls/dialog/dialog.view',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/contexts/factories/node',
  'csui/utils/commandhelper',
  'csui/utils/log',
  'csui/utils/commands/download',
  'csui/utils/taskqueue',
  'csui/utils/thumbnail/thumbnail.object',
  'csui/lib/exif'
], function (module, _, $, parseParams, Marionette, NodeCollection, 
		base, GalleryView, lang, PerfectScrollingBehavior, DialogView, Alert, NodeModelFactory, CommandHelper, log,
		DownloadCommand, TaskQueue, Thumbnail, EXIF) {
  'use strict';

  log = log(module.id);
  
  var config = module.config();
  _.defaults(config, {
    parallelism: 3,
    streaming: false
  });
  
  var disableMultipleClicks = false;

  var GalleryPluginView = Marionette.ItemView.extend({

    className: 'gallery-container',

    template: false,

    constructor: function GalleryPluginView(options) {
      options.data || (options.data = {});      
      Marionette.ItemView.prototype.constructor.call(this, options);
      config.streaming = config.streaming || this.options.streaming;
    },
    
    onRender: function() {
      var self = this;
      var thumbNailCollection = this.options.thumbNailCollection;
	  var thumbnailGalleryData = [],
	  	  currentItemIndex     = 0;
	  this.model = this.options.model;
	  this.imageCount = 0;
	  this.fetchGalleryImageURL(thumbNailCollection);
	  _.each(thumbNailCollection, function (node) {
          if (config.streaming && node.get("type") === 144 &&
              node.get("mime_type").match(/^video\/!*[-.\w\s]*$/g)) {
            if (!node.thumbnail) {
              node.thumbnail = new Thumbnail({node: node});
            }
            var photoOptions = node.thumbnail.getPhotOptions(node);
            node.contentURL = photoOptions.url;
          }
          if (node.get("mime_type") && (node.get("mime_type").match(/^image\/*[-.\w\s]*$/g))) {
        	  self.imageCount = self.imageCount + 1;
          }
      });
      self.thumbNailCollection = thumbNailCollection;
      _.each(thumbNailCollection, function (model, idx) {
        var thumbnailData = {
          name: model.get('name'),
          contentURL: model.contentURL ? model.contentURL :
                      model.thumbnail ? model.thumbnail.imgUrl : '',
          thumbnailURL: (model.thumbnail && model.thumbnail.imgUrl) ? model.thumbnail.imgUrl :
                        model.contentURL ? model.contentURL : '',
          id: model.cid,
          index: idx,
          activeItem: model.get('id') === self.model.get('id'),
          downloadItem: self.downloadItem.bind(null, model),
          executeDefaultAction: self.executeDefaultAction.bind(null, self),
          updateScroll: self.updateScroll.bind(null, self),
          isVideo: model.get("mime_type").match(/^video\/*[-.\w\s]*$/g),
          videoType: model.get("mime_type"),
          model: model,
          videoNotSupportMsg: lang.videoNotSupportMsg,
          originalAvailable: model.contentURL ? true : false,
          thumbnailAvailable: (model.thumbnail && model.thumbnail.imgUrl) ? true : false,
          streaming: config.streaming
        };
        if (model.get('id') === self.model.get('id')) {
          currentItemIndex = idx;
        }
        thumbnailGalleryData.push(thumbnailData);

      }, self);
      var galleryContainer = GalleryView.createGalleryContainer({
            galleryData: thumbnailGalleryData,
            currentItemIndex: currentItemIndex,
            lang: lang,
            view: this,
            onlyVideos: (self.imageCount === 0)
          }),
          galleryView  = new GalleryContentView({el: galleryContainer[0]}),
          dialog           = new DialogView({
            title: "",
            headerView: '',
            view: galleryView,
            className: "csui-thumbcarousel-dialog " + (self.options.customStyle ? self.options.customStyle : ""),
            userClassName: "",
            largeSize: true
          });
      if (PerfectScrollingBehavior.usePerfectScrollbar()) {
        galleryContainer.find('.binf-filmstrip-container').addClass('csui-no-scrolling');
      }
      if (!disableMultipleClicks) {
        dialog.show();
        disableMultipleClicks = true;
      } else {
    	self.options.originatingView && self.options.originatingView.blockingView && self.options.originatingView.blockingView.disable();
        return false;
      }
      var dialogLabelElemId = _.uniqueId('dialogLabelId'),
          dialogHeaderTitle = dialog.headerView.$el.find('.binf-modal-title');
      if (dialogHeaderTitle) {
        dialogHeaderTitle.attr('id', dialogLabelElemId);
        dialogHeaderTitle.html(lang.GalleyViewTitle);
        dialog.headerView.$el.attr('aria-labelledby', dialogLabelElemId);
      }

      dialog.headerView.$el.find('.cs-icon-cross').removeClass("cs-icon-cross").addClass(
          "icon-close-gallery");
      dialog.headerView.$el.on('keydown click', _.bind(this.handleShiftKey, this));
      self.options.originatingView && self.options.originatingView.blockingView && self.options.originatingView.blockingView.disable();
      self.galleryView = galleryView;
      self.dialogView = dialog;

      var activeThumbnail = galleryContainer.find('.csui-preview-carousal .binf-active');
      setTimeout(function () {
        GalleryView.updateSlide(self.options.event, activeThumbnail);
      }, 200);	  
    },
    
    handleShiftKey: function (event) {
        var shiftKey = event.shiftKey;
        if (event.shiftKey && event.keyCode === 9) {
          var cid = this.thumbNailCollection[this.thumbNailCollection.length - 1].cid;
          setTimeout(function () {
            $(".binf-filmstrip-item-" + cid).trigger('focus');
          }, 200);
        }
        disableMultipleClicks = false;
    },
    
    downloadItem: function (nodeModel, event) {
        new DownloadCommand().execute({
          nodes: new NodeCollection([nodeModel])
        });
    },

    executeDefaultAction: function (self) {
      self.listenTo(self.options.originatingView,'destroy:gallery', function () {
       self.dialogView.$el.find(".cs-close").click();
      });
      self.options.originatingView.thumbnail.trigger('execute:defaultAction', self.model);
    },
      
    updateScroll: function (view, element) {
      view.galleryView.updateScrollbar(element);
    },
    
    fetchGalleryImageURL: function (models) {
        var self     = this,
            queue    = new TaskQueue({
              parallelism: config.parallelism
            }),
            promises = _.map(models, function (model) {
              var deferred = $.Deferred();
              if (!model.contentURL) {
                queue.pending.add({
                  worker: function () {
                    self._fetchImageOpenURL(model).done(function (node) {
                      deferred.resolve(node);
                    }).fail(function (node) {
                      deferred.reject(node);
                    });

                    return deferred.promise();
                  }
                });
              }
              return deferred.promise(promises);  // return promises
            });
        return $.whenAll.apply($, promises);
      },

      _fetchImageOpenURL: function (node) {
        var self           = this,
            deferredObject = $.Deferred();
        if (!node.thumbnail) {
          node.thumbnail = new Thumbnail({node: node});
        }
        var photoOptions = node.thumbnail.getPhotOptions(node);

        if (node.get("type") === 144) {
          if (!config.streaming) {
            node.connector.makeAjaxCall(photoOptions).done(
                _.bind(function (response, textStatus, jqXHR) {
                  node.contentURL = node.thumbnail.getContentUrl(response);
                  node.addedOriginalImage = true;
                  self.displayGalleryItems(node, response);
                  deferredObject.resolve();
                }, this)).fail(_.bind(function (jqXHR, textStatus, errorThrown) {
              node.contentURL = node.thumbnail && node.thumbnail.defaultImgUrl;
              node.addedOriginalImage = false;
              self.displayGalleryItems(node, undefined);
              deferredObject.reject(errorThrown);
            }, this));
          } else if (config.streaming && !node.get("mime_type").match(/^video\/!*[-.\w\s]*$/g)) {
            node.connector.makeAjaxCall(photoOptions).done(
                _.bind(function (response, textStatus, jqXHR) {
                  node.contentURL = node.thumbnail.getContentUrl(response);
                  node.addedOriginalImage = true;
                  self.displayGalleryItems(node, response);
                  deferredObject.resolve();
                }, this)).fail(_.bind(function (jqXHR, textStatus, errorThrown) {
              node.contentURL = node.thumbnail && node.thumbnail.defaultImgUrl;
              node.addedOriginalImage = false;
              self.displayGalleryItems(node, undefined);
              deferredObject.reject(errorThrown);
            }, this));
          }
        }
        return deferredObject.promise();
      },

      displayGalleryItems: function (node, response) {
        var transformDegrees = 0, flipRight = false,
            self                            = this;

        if (node.get("mime_type").match(/^video\/!*[-.\w\s]*$/g)) {
          var video = self.galleryView &&
                      self.galleryView.$el.find(".binf-item-" + node.cid).find("video");
          if (video.length > 0) {
            video.attr("src", node.contentURL);
            self.galleryView.$el.find(".binf-item-" + node.cid).addClass(
                "csui-item-original");
            self.galleryView.$el.find(
                ".binf-item-" + node.cid + " .csui-img-loader").addClass(
                "binf-hidden");
          }
        } else {
          var galleryItem    = self.galleryView &&
                               self.galleryView.$el.find(".binf-item-" + node.cid),
              thumbnailImage = galleryItem.find(".csui-gallery-thumbnail-icon"),
              originalImage  = galleryItem.find(".csui-gallery-original-icon");

          if (thumbnailImage.length > 0) {
            thumbnailImage.addClass("binf-hidden");
          } else {
            self.galleryView.$el.find(
                ".binf-item-" + node.cid + " .outer-border").addClass(
                "binf-hidden");
          }
          originalImage.find("img").attr("src", node.contentURL);
          originalImage.find("img").addClass("csui-item-original");
          originalImage.removeClass("binf-hidden");

          if (response) {
            EXIF.getData(response, function () {
              var myData      = this,
                  orientation = myData && myData.exifdata && myData.exifdata.Orientation;
              if (orientation === 7 || orientation === 8) {
                transformDegrees = -90;
              } else if (orientation === 5 || orientation === 6) {
                transformDegrees = 90;
              } else if (orientation === 3 || orientation === 4) {
                transformDegrees = 180;
              } else {
                transformDegrees = 0;
              }
              node.transformDegrees = transformDegrees;
              if (orientation === 2 || orientation === 4 || orientation === 5 ||
                  orientation === 7) {
                flipRight = true;
                node.flipRight = true;
              }
              if (flipRight) {
                originalImage.find("img").css({
                  "transform": "scaleX(-1)",
                  "filter": "FlipH",
                  "-ms-filter": "FlipH"
                });
              }
              originalImage.find("img").css({
                "transform": "rotate(" + transformDegrees + "deg)"
              });

            });
          }
          var filmstripItem = self.galleryView &&
                              self.galleryView.$el.find(".binf-filmstrip-item-" + node.cid);
          if (!filmstripItem.find("img").attr("src") ||
              (!!filmstripItem.find("img").attr("src") &&
               filmstripItem.find("img").hasClass('binf-hidden'))) {
            filmstripItem.find("img").attr("src", node.contentURL).removeClass('binf-hidden');
            filmstripItem.find(".mime_image").addClass('binf-hidden');
          }
        }
      }

  });
    
  var GalleryContentView = Marionette.View.extend({

    constructor: function GalleryContentView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.binf-filmstrip-container',
        suppressScrollY: true,
        scrollXMarginOffset: 2
      }
    },
    updateScrollbar: function (element) {
      this.trigger('update:scrollbar');
      var container = this.$(this.behaviors.PerfectScrolling.contentParent),
          scrollX   = this.$el.find('.binf-filmstrip-container').scrollLeft(),
          adjustScrollLeft;
      if (element.offset().left + element.width() >= container.width()) {
        adjustScrollLeft = element.offset().left - container.width() + scrollX + element.width() +
                           20;
      } else if (element.offset().left <= 0) {
        adjustScrollLeft = element.offset().left + scrollX - 5;
      }
      this.$(this.behaviors.PerfectScrolling.contentParent).animate(
          {scrollLeft: adjustScrollLeft}, "fast");
    }
  });
  
  return GalleryPluginView;
});
