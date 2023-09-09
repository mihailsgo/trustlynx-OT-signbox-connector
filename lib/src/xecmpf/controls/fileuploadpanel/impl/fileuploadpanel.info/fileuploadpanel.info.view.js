/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/controls/side.panel/side.panel.view',
  'csui/controls/tile/behaviors/blocking.behavior',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/dialogs/file.open/file.open.dialog',
  'xecmpf/controls/draganddrop/draganddrop.view',
  'xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.info/fileuploadpanel.info.item.view',
  'hbs!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.info/fileuploadpanel.info',
  'i18n!xecmpf/controls/fileuploadpanel/impl/nls/lang',
  'css!xecmpf/controls/fileuploadpanel/impl/fileuploadpanel.info/fileuploadpanel.info',
], function (_, $, Marionette, SidePanelView, BlockingBehavior, PerfectScrollingBehavior, FileOpenDialog, DragAndDrop, FileInfoItemView, fileUploadInfoTemplate, lang) {
  "use strict";

  var FileUploadPanelInfoView = Marionette.CompositeView.extend({
    className: 'xecmpf-file-upload-panel-info',
    template: fileUploadInfoTemplate,
    selectedIndex: 0,
    constructor: function FileUploadPanelInfoView(options) {
      Marionette.CompositeView.prototype.constructor.call(this, options);
    },
    initialize: function (options) {
      this.dragNDrop = new DragAndDrop({
        addableTypes: '144',
        context: this.options.context,
        connector: this.options.connector,
        originatingView: this
      });
    },
    onRender: function () {
      this.dragNDrop.setDragParentView(this, '.xecmpf-file-upload-panel-list-section');
      this.$el.find('.xecmpf-file-upload-panel-list-section .xecmpf-file-upload-item:first-child').attr('tabindex', 0);
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.xecmpf-file-upload-panel-list-section',
        suppressScrollX: true,
        scrollYMarginOffset: 15
      },
      Blocking: {
        behaviorClass: BlockingBehavior
      }
    },
    childViewContainer: '.xecmpf-file-upload-panel-list-section',
    childView: FileInfoItemView,
    childEvents: {
      'delete:uploaded:item': 'deleteUploadedItem'
    },
    templateHelpers: function () {
      return {
        totalFiles: this.options.collection.length,
        filesLabel: lang.filesLabel,
        uploadItemLabel: lang.uploadItemLabel
      }
    },
    ui: {
      fileUploadBtn: '#xecmpf-file-upload-btn',
      listSection: '.xecmpf-file-upload-panel-list-section',
      listItem: '.xecmpf-file-upload-panel-list-section .xecmpf-file-upload-item'
    },
    events: {
      'click @ui.fileUploadBtn': 'openFileDialog',
      'keydown @ui.fileUploadBtn': 'doClickOnEnter',
      'keydown @ui.listSection': 'doArrowNavigate',
      'focusin @ui.listItem': 'showDeleteIcon',
    },
    openFileDialog: function () {
      var fileOpenDialog = new FileOpenDialog({ multiple: true }),
        that = this;
      fileOpenDialog.listenTo(fileOpenDialog, 'add:files', (function (files) {
        that.collection.addUploadedItems(files);
        that.onItemsUpdate();
        fileOpenDialog.destroy();
      }).bind(this))
        .show();
    },
    onDrop: function (files) {
      this.collection.addUploadedItems(files);
      this.onItemsUpdate();
    },
    deleteUploadedItem: function (src, model, data) {
      this.collection.removeUploadedItem(model);
      this.onItemsUpdate(data && data.keyBoardEvent ? true: false);
    },
    onItemsUpdate: function (focusItem) {
      document.querySelector('#xecmpf-file-upload-panel-info-count').innerText = this.collection.length;
      document.querySelector('.xecmpf-file-upload-panel-info-control > span').setAttribute('aria-label', lang.filesLabel + ' ' + this.collection.length);
      this.$el.find('.xecmpf-file-upload-panel-list-section .xecmpf-file-upload-item:first-of-type').attr('tabindex', 0);
      this.selectedIndex = 0;
      if (focusItem) {
        this.$el.find('.xecmpf-file-upload-panel-list-section .xecmpf-file-upload-item:first-of-type').focus();
      }
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
        case 46: // delete
          $(e.target).find('.xecmpf-file-upload-item-delete .xecmpf-file-upload-item-delete-icon').trigger('click');
          this.$el.find('.xecmpf-file-upload-panel-list-section .xecmpf-file-upload-item:first-of-type').focus();
          break;
      }
    },
    currentlyFocusedElement: function () {
      var collection = this.collection;
      if ((this.selectedIndex !== 0) && (this.selectedIndex >= collection.length)) {
        this.selectedIndex = collection.length - 1;
      }
      var $item = this.$(".xecmpf-file-upload-panel-list-section .xecmpf-file-upload-item:nth-of-type(" + (this.selectedIndex + 1) + ")");
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
    },
    showDeleteIcon: function (event) {
      this.$el.find('.xecmpf-file-upload-item-delete-icon').removeClass('show');
      $(event.currentTarget).find('.xecmpf-file-upload-item-delete-icon').addClass('show');
    }
  });

  return FileUploadPanelInfoView;

});