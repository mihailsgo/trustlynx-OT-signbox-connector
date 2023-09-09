/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.capture/impl/fileuploadpanel.capture.list/fileuploadpanel.capture.list.item.view',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
], function (_, Marionette, PerfectScrollingBehavior, FileUploadPanelCaptureListItemView, lang) {
  "use strict";

  var FileUploadPanelCaptureListView = Marionette.CollectionView.extend({
    className: 'xecmpf-file-upload-capture-list',
    childView: FileUploadPanelCaptureListItemView,
    constructor: function FileUploadPanelCaptureListView(options) {
      Marionette.CollectionView.prototype.constructor.call(this, options);
      this.listenTo(this, 'update:form:status', (function (args) {
        var dataId = args.dataId,
          valid = args.valid;
        this.children.forEach(function (view) {
          if (view.model.get('dataId') === dataId) {
            view.updateFormStatus(valid);
          }
        });
      }).bind(this));

      this.selectedIndex = 0;
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    onRender: function () {
      if (this.children.length > 0) {
        this.children.findByIndex(0).$el.prop('tabindex', '0');
      }
    },
    childEvents: {
      'click:item': 'onClickItem'
    },
    onClickItem: function (childView) {
      if (!childView.model.get('upload_err')) {
        this.children.forEach((function (view) {
          if (view.$el.hasClass('selected')) {
            view.$el.removeClass('selected');
            this.trigger('get:form:status', view.model.get('dataId'));
          }
        }).bind(this));
        childView.$el.addClass('selected');
        this.trigger('on:document:select', childView.model.get('dataId'));
      }
    },
    events: {
      'keydown .xecmpf-file-upload-capture-list-item': 'doClickOnEnter',
      'keydown': 'doArrowNavigate'
    },
    doClickOnEnter: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        event.target.click();
      }
    },
    doArrowNavigate: function (e) {
      var $preElem = this.currentlyFocusedElement();
      switch (e.keyCode) {
        case 38: // up
          this._moveTo(e, this._selectPrevious(), $preElem);
          break;
        case 40: // down
          this._moveTo(e, this._selectNext(), $preElem);
          break;
        case 33: // page up
          this._moveTo(e, this._selectFirst(), $preElem);
          break;
        case 34: // page down
          this._moveTo(e, this._selectLast(), $preElem);
          break;
      }
    },
    currentlyFocusedElement: function () {
      var collection = this.collection;
      if ((this.selectedIndex !== 0) && (this.selectedIndex >= collection.length)) {
        this.selectedIndex = collection.length - 1;
      }
      var $item = this.$el.find(".xecmpf-file-upload-capture-list-item:nth-of-type(" + (this.selectedIndex + 1) + ")");
      var elementOfFocus = ($item.length !== 0) ? this.$($item[0]) : null;
      return elementOfFocus;
    },
    _moveTo: function (event, $elem, $preElem) {
      event.preventDefault();
      event.stopPropagation();
      setTimeout(_.bind(function () {
        $preElem && $preElem.prop('tabindex', '-1');
        $elem.prop('tabindex', '0');
        $elem.trigger('focus');
      }, this), 50);
    },
    _selectNext: function () {
      var collection = this.model || this.collection;
      if (this.selectedIndex < collection.length - 1) {
        this.selectedIndex++;
      }
      return this.currentlyFocusedElement();
    },
    _selectPrevious: function () {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
      return this.currentlyFocusedElement();
    },
    _selectFirst: function () {
      this.selectedIndex = 0;
      return this.currentlyFocusedElement();
    },
    _selectLast: function () {
      this.selectedIndex = this.collection.length - 1;
      return this.currentlyFocusedElement();
    }
  });

  return FileUploadPanelCaptureListView;

});