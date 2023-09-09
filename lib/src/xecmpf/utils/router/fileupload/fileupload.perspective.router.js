/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/application.scope.factory',
  'i18n!xecmpf/widgets/fileupload/impl/nls/lang'
], function (_, PerspectiveRouter, ApplicationScopeModelFactory, 

    lang) {
  'use strict';

  var FileUploadPerspectiveRouter = PerspectiveRouter.extend({

    routes: {
      'nodes/:node_id/fileupload': 'openFileUploadPerspective'
    },

    constructor: function FileUploadPerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);

      this.listenTo(this.applicationScope, 'change:id', this._updateUrl);
    },

    openFileUploadPerspective: function ( id ) {
      if( id ){
        
          this.context.wsid = id;
      } else {
        this.context.wsid = 0;
      }

      this.openApplicationScope('fileupload');
    },

    openApplicationScope: function (scope) {
      this._updatePageTitle();
      this.applicationScope.set('id', scope);
    },

    _updatePageTitle: function () {
      document.title = lang.dialogTitle;
    },

    _updateUrl: function () {
      var scope = this.applicationScope.id;
      if (scope !== 'fileupload') {
        return;
      }
      
      var url = "nodes/"+ this.context.wsid + '/fileupload';
      this.navigate(url);
    }

  });

  return FileUploadPerspectiveRouter;

});
