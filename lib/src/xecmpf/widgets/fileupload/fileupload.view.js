/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/tile/tile.view',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/node',
  'conws/models/workspacecontext/workspacecontext.factory',
  'csui/utils/contexts/factories/application.scope.factory',
  'xecmpf/widgets/fileupload/impl/fileupload.content/fileupload.content.view',
  'xecmpf/widgets/fileupload/impl/factory/fileupload.collection.factory',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'hbs!xecmpf/widgets/fileupload/impl/fileuploadexpandicon',
  'i18n!xecmpf/widgets/fileupload/impl/nls/lang',
  'css!xecmpf/widgets/fileupload/impl/fileupload'], function (_, Marionette, base, TileView, ConnectorFactory,
    NodeModelFactory, WorkspaceContextFactory, ApplicationScopeModelFactory, 
    FileUploadContentView, FileUploadFactory, TabablesBehavior, ExpandBtn, lang) {

  var FileUploadView = TileView.extend({
    className: TileView.prototype.className + ' xecmpf-file-upload',
    
    ui: {
      fileuploadExpandViewBtn: ".xecmpf-file-upload-expand" 
    },
    events: {
      'click @ui.fileuploadExpandViewBtn': 'onClickExpand',
      'keydown @ui.fileuploadExpandViewBtn': 'doClickOnEnter'
    },
    constructor: function FileUploadView(options) {
      options = options || {};
      if (!options.context) {
        throw new Error("Context is not available");
      }
      options.title = this._getTitle();
      options.icon = 'xecmpf-fileupload-title-icon';
      options.connector = options.context.getObject(ConnectorFactory);
      if (!options.workspaceContext) {
        options.workspaceContext = options.context.getObject(WorkspaceContextFactory);
      }
      options.node = options.context.getModel(NodeModelFactory);
      options.workspaceContext.setWorkspaceSpecific(FileUploadFactory);
      TileView.prototype.constructor.call(this, options);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
    },
    contentView: FileUploadContentView,
    contentViewOptions: function () {
      return {
        context: this.options.context,
        connector: this.options.connector,
        node: this.options.node
      };
    },
    behaviors: {
      TabablesBehavior: {behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    currentlyFocusedElement: function () {
      return this.$el.find('.xecmpf-file-upload-expand');
    },
    onBeforeShow: function () {
      this.$('.tile-controls').html(ExpandBtn({
        titleExpand: lang.expand || "Expand",
        expandArea: lang.expandArea || "Expand FileUpload Widget"
      }))
    },
    onClickExpand: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.triggerMethod('expand');
      this.onClickOpenPerspective();
    },
    doClickOnEnter: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        this.triggerMethod('expand');
        this.onClickOpenPerspective();
      }
    },

    onClickOpenPerspective: function () {

      if( this.options.context ) {
        this.options.context.wsid = this.options.node? this.options.node.get("id") : 0;
      }
      
      this.applicationScope.set('id', 'fileupload');      
      this.trigger('open:fileupload:perspective');
    },

    _getTitle: function () {
      var title = lang.dialogTitle;
      if (this.options.data && this.options.data.title) {
        title = base.getClosestLocalizedString(this.options.data.title, lang.dialogTitle);
      }
      return title;
    }
  });
  return FileUploadView;
});