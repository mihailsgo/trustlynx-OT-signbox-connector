/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'i18n', 'csui/utils/base',
  'hbs!csui/controls/thumbnail/content/thumbnail.icon/util/gallery',
  'hbs!csui/controls/thumbnail/content/thumbnail.icon/util/gallery.item',
  'hbs!csui/controls/thumbnail/content/thumbnail.icon/util/filmstrip.item',
  'css!csui/controls/thumbnail/content/thumbnail.icon/util/gallary',
  'csui/lib/jquery.touchSwipe'
], function (_, $, i18n, base, GalleryTemplate, GalleryItemTemplate, FlimStripItemTemplate) {
  'use strict';

  var data, galleryContent, galleryItems, galleryFilmItems, totalItems, currentItem, currentItemName, filmStripActiveItem, filmStripWidth, nextFocusIndex, leadingView;

  function createGalleryContainer(args) {
    var galleryData      = args.galleryData,
        currentItemIndex = args.currentItemIndex,
        lang             = args.lang,
        onlyVideos       = args.onlyVideos,
        view             = args.view;
    data = galleryData;
    totalItems = galleryData.length;
    currentItem = galleryData[currentItemIndex];
    currentItemName = currentItem.name;
    nextFocusIndex = 0;
    leadingView = view || {};

    galleryContent = $('<div />', {
      'class': 'binf-gallery-container',
      'html': GalleryTemplate({
        "totalItems": galleryData.length,
        "currentItem": currentItem.index + 1,
        "currentItemName": currentItemName,
        "lang": lang,
        "onlyVideos": onlyVideos
      })
    });

    galleryItems = $('<div />', {
      'class': 'binf-carousel-inner',
      'html': GalleryItemTemplate({data: galleryData})
    });

    galleryFilmItems = $('<div />', {
      'class': 'csui-carousel-film-strip-inner',
      'html': FlimStripItemTemplate({data: galleryData})
    });

    galleryContent.find(".csui-carousel-film-strip .binf-carousel").html(galleryFilmItems);
    galleryContent.find(".csui-preview-carousal").html(galleryItems);

    _.each(galleryData, function (data, index) {
      var originalImageContainer = galleryContent.find(".binf-item-" + data.model.cid).find(
          ".csui-gallery-original-icon");
      if (data.model.flipRight) {
        originalImageContainer.find("img").css({
          "-webkit-transform": "scaleX(-1)",
          "-moz-transform": "scaleX(-1)",
          "-o-transform": "scaleX(-1)",
          "transform": "scaleX(-1)",
          "filter": "FlipH",
          "-ms-filter": "FlipH"
        });
      }
      originalImageContainer.find("img").css({
        "-webkit-transform": "rotate(" + data.model.transformDegrees + "deg)",
        "-moz-transform": "rotate(" + data.model.transformDegrees + "deg)",
        "-ms-transform": "rotate(" + data.model.transformDegrees + "deg)",
        "-o-transform": "rotate(" + data.model.transformDegrees + "deg)",
        "transform": "rotate(" + data.model.transformDegrees + "deg)"
      });
      originalImageContainer.find("img").attr({
        'aria-label': lang.OpenTitle,
        'title': lang.OpenTitle
      });
    }, this);
    if (data.length < 2) {
      galleryContent.find("#binf-carousel").children(".binf-left").hide();
      galleryContent.find("#binf-carousel").children(".binf-right").hide();
    }
    filmStripWidth = 74;
    var carouselFilmStripWidth = filmStripWidth * data.length;
    if ($(window).width() < carouselFilmStripWidth) {
      galleryContent.find('.csui-carousel-film-strip-inner').css('width',
          carouselFilmStripWidth + 'px');
      galleryContent.find('.csui-carousel-film-strip-inner').addClass('csui-film-strip-adjust');
    }

    galleryContent.find('#binf-carousel').on('slid.binf.carousel', updateSlide);
    galleryContent.find('.csui-thumb-toggle-control').on('click', {lang: lang}, thumbToggle);
    galleryContent.find('.csui-download-gallery').on('click keydown', downloadItem);
    galleryContent.find('.csui-gallery-original-icon>img').on('click keydown',
        executeDefaultAction);
    galleryContent.find('.csui-preview-carousal-container .binf-carousel-control').on('keydown',
        onKeyInPreviewCarouselControl);
    galleryFilmItems.find(".binf-item").on('keydown', onKeyInGalleryFilmStrip);
    if (!base.isMSBrowser()) {  // fix for LPAD-79476
      galleryContent.find('#binf-carousel').swipe({
        swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
          if (direction == 'left') {
            $(this).binf_carousel('next');
          }
          if (direction == 'right') {
            $(this).binf_carousel('prev');
          }
        },
        allowPageScroll: "vertical"
      });
    }
    return galleryContent;
  }
  $(window).on('resize', function () {
    if (base.isTouchBrowser()) {
      $('.csui-thumbcarousel-dialog').addClass('csui-adjust-gallery-backdrop');
    }
  });

  function downloadItem(event) {
    if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) ||
        event.type === 'click') {//enter(13) & space(32) or click
      currentItem.downloadItem(event);
    }
  }

  function executeDefaultAction(event) {
    if (event.type === "keydown" && (event.keyCode === 13 || event.keyCode === 32) ||
        event.type === 'click') {//enter(13) & space(32) or click
      leadingView && (leadingView.model = currentItem.model);
      currentItem.executeDefaultAction(event);
    }
  }

  function updateSlide(e, el) {
    var activeThumbnail;
    if (e.type === 'click' || e.type === 'keyup') {
      activeThumbnail = el;
    } else {
      activeThumbnail = e.relatedTarget;
    }
    filmStripWidth = $(
            galleryContent.find('.csui-carousel-film-strip-inner .binf-thumb-img')[0]).width() + 10;
    filmStripActiveItem = galleryContent.find('.csui-carousel-film-strip-inner').find(
        '.binf-item').removeClass('binf-active');
    var filmStripActiveElement = $(filmStripActiveItem[$(activeThumbnail).index()]);
    filmStripActiveElement.addClass('binf-active');
    if (currentItem && currentItem.index >= 0) {
      currentItem = data[$(activeThumbnail).index()];
      if (data[currentItem.index].model && data[currentItem.index].model.contentURL &&
          !data[currentItem.index].model.addedOriginalImage) {
        $(activeThumbnail).addClass("csui-item-original");
        data[currentItem.index].addedOriginalImage = true;
        if ($(activeThumbnail).find("img").length > 0) {
          $(activeThumbnail).find("img").attr("src", data[currentItem.index].model.contentURL);
        }
        if ($(activeThumbnail).find("video").length > 0) {
          $(activeThumbnail).find("video").attr("src", data[currentItem.index].model.contentURL);
          $(activeThumbnail).find(".outer-border").addClass("binf-hidden");
        }
      }
      $(this).find("video").trigger('pause');
      currentItemName = currentItem.name;
      galleryContent.find('.csui-current-total-items').html(
          (currentItem.index + 1) + ' / ' + totalItems);
      galleryContent.find('.csui-active-item-name .item-name').html(currentItemName);
      currentItem.updateScroll(filmStripActiveElement);
    }
  }
  function thumbToggle(event) {
    galleryContent.find('.csui-carousel-film-strip .binf-carousel').slideToggle();
    galleryContent.find('.binf-glyphicon-menu-down').toggleClass('binf-glyphicon-menu-up');
    if (galleryContent.find('.binf-glyphicon-menu-up').length > 0) {
      galleryContent.find('.binf-glyphicon-menu-up').attr('title', event.data.lang.showTitle);
    } else {
      galleryContent.find('.binf-glyphicon-menu-down').attr('title', event.data.lang.hideTitle);
    }
  }

  function onKeyInPreviewCarouselControl(event) {
    if (event.type === "keydown" && event.keyCode === 32) {//space(32)
      $(event.currentTarget).trigger('click');
    }
    if (event.type === "keydown" && event.keyCode === 9 && !event.shiftKey) {// Tab
      $(galleryFilmItems.find(".binf-item")[0]).attr('tabindex', 0);
    }
    nextFocusIndex = 0;
  }

  function onKeyInGalleryFilmStrip(event) {
    var focusableElements = galleryFilmItems.find('.binf-item');
    switch (event.keyCode) {
    case 9:
      if (!event.shiftKey) {
        galleryContent.parents('.binf-modal-content').find('.cs-close').trigger('focus');
        event.preventDefault();
        event.stopPropagation();
      } else {
        $(focusableElements[0]).attr('tabindex', -1);
      }
      break;
    case 13:  // enter
    case 32:  // space
      $(event.currentTarget) && $(event.currentTarget).find(".binf-thumb").trigger("click");
      break;
    case 39: // arrow right
      nextFocusIndex < (focusableElements.length - 1) && ++nextFocusIndex;
      $(focusableElements[nextFocusIndex]).trigger('focus');
      break;
    case 37: // arrow left
      nextFocusIndex > 0 && --nextFocusIndex;
      $(focusableElements[nextFocusIndex]).trigger('focus');
      break;
    }
    nextFocusIndex = nextFocusIndex;
  }

  return {
    createGalleryContainer: createGalleryContainer,
    updateSlide: updateSlide,
    thumbToggle: thumbToggle,
    downloadItem: downloadItem,
    executeDefaultAction: executeDefaultAction
  };
});
