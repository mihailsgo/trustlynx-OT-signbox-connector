/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/utils/contexts/factories/application.scope.factory',
    'csui/utils/contexts/perspective/perspective.context.plugin'
], function (_, ApplicationScopeModelFactory,
    PerspectiveContextPlugin) {
    'use strict';

    var supportedPerspectives = {
        fileupload: 'fileupload'
    };

    var FileUploadPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

        constructor: function FileUploadPerspectiveContextPlugin(options) {
            PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

            this.applicationScope = this.context
                .getModel(ApplicationScopeModelFactory)
                .on('change:id', this._fetchFileUploadPerspective, this);

        },

        _fetchFileUploadPerspective: function () {
            var scope = this.applicationScope.id;
            if (!supportedPerspectives[scope] || this.loadingPerspective) {
                return;
            }

            this.context.loadPerspective('json!xecmpf/utils/contexts/fileupload/' +
                supportedPerspectives[scope] + '.json');
        }

    });

    return FileUploadPerspectiveContextPlugin;

});