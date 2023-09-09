/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/utils/contexts/factories/version',
  'csui/utils/contexts/factories/next.version',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/perspective/perspective.context.plugin'
], function ($, VersionModelFactory, NextVersionModelFactory, ApplicationScopeModelFactory,
    AncestorCollectionFactory, PerspectiveContextPlugin) {
  'use strict';

  var VersionPerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function VersionPerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.call(this, options);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory);

      this.nextVersionFactory = this.context.getFactory(NextVersionModelFactory, {
            permanent: true,
            detached: true
      });
      this.nextVersion = this.nextVersionFactory.property;

      this.nextVersion.on('change:id change:version_number', this.onVersionChanged, this);

      this.listenTo(this.context, 'retain:perspective', this.onRetainPerspective);
      createVersionModel.call(this);
    },

    onClear: function () {
      this._clearModels(true);
      var self = this;
      $.Deferred().resolve().then(function () {
        self._setAncestortAttrs();
      });
    },

    onRefresh: function () {
      this._clearModels(false);
    },

    onRetainPerspective: function () {
      this._setAncestortAttrs();
    },

    isFetchable: function (factory) {
      return factory.property !== this.version;
    },

    _setAncestortAttrs: function () {
      if (this.applicationScope.id === 'version') {
        var ancestors = this.context.getCollection(AncestorCollectionFactory);
        ancestors.node.set('id', this.nextVersion.get('id'), { silent: true });
      }
    },

    _clearModels: function (recreateVersion) {
      if (this.applicationScope.id !== 'version') {
        clearCurrentVersion.call(this);
        return this.nextVersion.clear({silent: true});
      }

      clearCurrentVersion.call(this);
      this.version.set(this.nextVersion.attributes);

      function clearCurrentVersion() {
        if (recreateVersion) {
          createVersionModel.call(this);
        } else {
          this.version.clear({silent: true});
        }
      }
    },

    onVersionChanged: function () {
      if (!this.context.loadingPerspective) {

        this.context.triggerMethod('request:perspective', this);
        this.applicationScope.set('id', 'version');

        var nodeId = this.nextVersion.get('id');
        var versionNumber = this.nextVersion.get('version_number');

        this.nextVersion.clear({ silent: true });
        this.nextVersion.actions.reset([], { silent: true });
        this.nextVersion.set({ id: nodeId, version_number: versionNumber }, { silent: true });
        var self = this;
        var promise = this.fetching = this.nextVersionFactory.fetch({
          success: function () {
            self.onVersionFetchSuccess();
          },
          error: function (model, jqxhr) {
            self.onVersionFetchFailure(model, jqxhr);
          }
        });
      }
    },

    onVersionFetchSuccess: function () {
      this.context.loadPerspective('json!csui/utils/contexts/perspective/impl/perspectives/version.overview.json');
    },

    onVersionFetchFailure: function (sourceModel, error) {
      this.context.rejectPerspective(sourceModel, error);
    },
  });

  function createVersionModel() {
    this.version = this.context.getModel(VersionModelFactory);
    this.version.markFetched();
  }

  return VersionPerspectiveContextPlugin;
});
