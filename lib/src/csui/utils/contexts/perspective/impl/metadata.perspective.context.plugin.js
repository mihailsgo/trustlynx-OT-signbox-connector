/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette', 'csui/lib/jquery',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/factories/node',
  'csui/utils/log',
  'csui/models/node/node.model'
], function (module, _, Backbone, Marionette, $, ApplicationScopeModelFactory,
    MetadataModelFactory, PerspectiveContextPlugin, NodeModelFactory, log) {
  'use strict';

  log = log(module.id);

  var MetadataPerspectiveContextPlugin = PerspectiveContextPlugin.extend({

    constructor: function MetadataPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.metadataModel = this.context
          .getModel(MetadataModelFactory, {
            permanent: true,
            detached: true
          })
          .on('change:metadata_info', this.onMetadataChanged, this);

      this.listenTo(this.context, "clear", this._prepareContext);
    },

    _prepareContext: function () {
      if (['properties', 'permissions'].indexOf(this.applicationScope.get('id')) !== -1) {
        var metadataInfo = this.metadataModel.get('metadata_info');
        if (metadataInfo && metadataInfo.id) {
          this.node = this.context.getModel(NodeModelFactory);
          this.node.set('id', metadataInfo.id);
        }
      }
    },

    onMetadataChanged: function () {
      var metadata_info = this.metadataModel.get('metadata_info');
      if (!metadata_info) {
        return;
      }
      if (['properties', 'permissions'].indexOf(this.applicationScope.get('id')) !== -1) {
         {
          var model = metadata_info.model;
          if (metadata_info.navigator) {
            if (model) {
              this.node.set( model.attributes);
            }
          }
          if (metadata_info.collection && metadata_info.collection === this.lastMetadataInfo.collection) {
            return;
          }
        }
      }
      this.lastMetadataInfo = metadata_info;
      if (metadata_info.showPermissionView) {
        this.applicationScope.set('id', 'permissions');
      } else {
        this.applicationScope.set('id', 'properties');
      }
      var perspectivePath = 'json!csui/utils/contexts/perspective/impl/perspectives/',
          perspectiveName;
      if (this.metadataModel.get('metadata_info').navigator) {
        perspectiveName = 'metadata.navigation.json';
      } else {
        perspectiveName = 'metadata.json';
      }

      this.context.loadPerspective(perspectivePath + perspectiveName, true);
    }

  });

  return MetadataPerspectiveContextPlugin;

});
