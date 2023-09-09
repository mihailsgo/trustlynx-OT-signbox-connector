/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore',
  'csui/lib/marionette',
  'csui/behaviors/item.error/item.error.behavior',
  'csui/controls/tile/behaviors/blocking.behavior',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/dialogs/file.open/file.open.dialog',
  'xecmpf/widgets/fileupload/impl/models/fileupload.model',
  'xecmpf/widgets/fileupload/impl/fileupload.content/fileupload.info/fileupload.info.view',
  'xecmpf/controls/draganddrop/draganddrop.view',
  'xecmpf/controls/fileuploadpanel/fileuploadpanel.view',
  'hbs!xecmpf/widgets/fileupload/impl/fileupload.content/fileupload.content',
  'i18n!xecmpf/widgets/fileupload/impl/nls/lang',
  'css!xecmpf/widgets/fileupload/impl/fileupload.content/fileupload.content'],
  function (_, Marionette, ItemErrorBehavior, BlockingBehavior, PerfectScrollingBehavior,
    TabablesBehavior, LayoutViewEventsPropagationMixin, FileOpenDialog, FileUploadModel, FileUploadInfoView,
      DragAndDrop, FileUploadPanelView, FileUploadContentViewTemplate, lang) {

    var FileUploadContentView = Marionette.LayoutView.extend({
      className: 'xecmpf-file-upload-content-view',
      constructor: function FileUploadContentView(options) {
        options = options || {};
        options.model = new FileUploadModel({}, options); // initializing model to fetch doc information
        Marionette.LayoutView.prototype.constructor.call(this, options);
        this.propagateEventsToRegions();
        this.listenTo(this.model, "sync", this.renderRegions);
        this.listenTo(this.model, "request", this.blockActions);
        this.listenTo(this.model, "error", this.unblockActions);
        this.model.fetch(); // triggering service call
      },
      initialize: function (options) {
        this.dragNDrop = new DragAndDrop({
          addableTypes: '144',
          context: this.options.context,
          connector: this.model.connector,
          originatingView: this
        });
        this.fileUploadPanelView = new FileUploadPanelView({
          connector: this.options.connector,
          context: this.options.context,
          node: this.options.node
        });
      },
      onRender: function () {
        this.dragNDrop.setDragParentView(this, '.xecmpf-fileupload-drag-drop');             
      },
      behaviors: {
        ItemError: {
          behaviorClass: ItemErrorBehavior
        },
        Blocking: {
          behaviorClass: BlockingBehavior
        },
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
      renderRegions: function () {
        this.docInfoView = new FileUploadInfoView({
          collection: this.model.get('data')
        });
        this.docInfoRegion.show(this.docInfoView);
        this.unblockActions();
      },
      openFileDilogBykeyboard: function (event){

        if (event.keyCode === 32 || event.keyCode === 13) {
          event.preventDefault();
          event.stopPropagation();
          this.openFileDialog(event);
        }
      },
      openFileDialog: function () {
        var fileOpenDialog = new FileOpenDialog({multiple: true}),
            that = this;
        fileOpenDialog.listenTo(fileOpenDialog, 'add:files', function (files) {
              fileOpenDialog.destroy();
              that.fileUploadPanelView.showSidePanelView(files, function() {
                that.model.fetch();
              });
            })
            .show();
      },
      onDrop: function(files) {
        var that = this;
        that.fileUploadPanelView.showSidePanelView(files, function() {
          that.model.fetch();
        });
      }
    });
    
    _.extend(FileUploadContentView.prototype, LayoutViewEventsPropagationMixin);

    return FileUploadContentView;
  });