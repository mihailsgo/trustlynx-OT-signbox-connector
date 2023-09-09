/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module','csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base', 'csui/controls/progressblocker/blocker', 'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/children', 'csui/utils/contexts/factories/children2',
  'csui/widgets/nodestable/nodestable.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/behaviors/default.action/impl/defaultaction',
  'i18n!csui/widgets/metadata.navigation/impl/nls/lang',
  'css!csui/widgets/metadata.navigation/impl/metadata.navigation'
], function (module, _, $, Backbone, Marionette, base, BlockingView, NodeModelFactory,
    ChildrenCollectionFactory, Children2CollectionFactory, NodesTableView,
    ViewEventsPropagationMixin, MetadataNavigationViewImpl, LargeFileSettingsFactory,
    ModalAlert, MetadataModelFactory, nodeExtraData, DefaultActionController, lang) {
  'use strict';

  var config = module.config();
  if (NodesTableView.useV2RestApi) {
    ChildrenCollectionFactory = Children2CollectionFactory;
  }
  var MetadataNavigationView = Marionette.ItemView.extend({

    className: 'cs-metadata-navigation-wrapper',

    template: false,

    constructor: function MetadataNavigationView(options) {
      options = _.defaults(options, config);
      options.data || (options.data = {});
      options.showCloseIcon = false;
      this.options = options;
      if (!!this.options.originatingView && !!this.options.originatingView.supportOriginatingView) {
        this.options.baseOriginatingView = this.options.originatingView;
        this.options.originatingView = this;
      }
      this.context = this.options.context;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.largeFileSettingsFactory = this.context.getFactory(LargeFileSettingsFactory);
      this.options.largeFileSettingsModel = this.largeFileSettingsFactory && this.largeFileSettingsFactory.property;
      BlockingView.imbue(this);
    },

    onRender: function () {
      var fetching = this._ensureCompleteData();
      if (fetching) {
        return fetching.done(_.bind(this.render, this));
      }
      this.metadataNavigationView && this.metadataNavigationView.destroy();
      var mnv = this.metadataNavigationView = new MetadataNavigationViewImpl(this.options);
      this.propagateEventsToViews(this.metadataNavigationView);

      this.metadataNavigationView.render();
      Marionette.triggerMethodOn(mnv, 'before:show', mnv, this);
      this.$el.append(mnv.el);
      this.$el.attr({'role': 'region', 'aria-label': lang.MetadataNavWrapperAria});
      Marionette.triggerMethodOn(mnv, 'show', mnv, this);
    },

    onBeforeDestroy: function () {
      if (this.metadataNavigationView) {
        this.cancelEventsToViewsPropagation(this.metadataNavigationView);
        this.metadataNavigationView.destroy();
      }
    },

    _modelIdChanged: function () {
      var metadataModel = this.options.context.getModel(MetadataModelFactory),
          metadataInfo  = metadataModel.get('metadata_info');
      if(metadataInfo && (this.contextCollection !==  metadataInfo.collection)){
        this.deleteData();
        this.render();
      }
    },

    deleteData: function (){
      delete this.options.selected;
      delete this.options.collection;
      delete this.options.containerCollection;
    },

    _ensureCompleteData: function () {
      var options = this.options;
      if (options.model && options.collection && options.containerCollection) {
        return;  // return nothing (undefined) for synchronous code flow in onRender
      }
      return this._loadingDataByMetadata();
    },

    _loadingDataByMetadata: function () {
      var self = this;
      var deferred;
      var options = this.options;
      if (!options.model || (!options.collection && !options.containerCollection)) {
        deferred = $.Deferred();
      }

      function loadCollectionAfterModel() {
        self._loadCollection()
            .always(function () {
              self.unblockActions();
            })
            .done(function (response) {
              deferred && deferred.resolve(response);
            })
            .fail(function (error) {
              deferred && deferred.reject(error);
            });
      }
      if (!options.model) {
        var nodeId = options.data.id && {id: options.data.id};
        if (!nodeId) {
          var metadataModel = options.context.getModel(MetadataModelFactory);
          if (metadataModel) {
            nodeId = metadataModel.get('metadata_info').id;
          }
        }
        var defaultActionController = new DefaultActionController();
        options.model = options.context.getModel(NodeModelFactory, {
          attributes: nodeId && {id: nodeId},
          temporary: true,
          options: {
            defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
              defaultActionController.commands),
            delayRestCommands: false
          }
        });
        options.selected = options.model;
        self.blockActions();
        loadCollectionAfterModel();
      } else if (!options.collection || !options.containerCollection) {
        options.selected = options.model;
        self.blockActions();
        loadCollectionAfterModel();
      }

      return deferred && deferred.promise();
    },

    _loadCollection: function () {
      var self = this;
      var deferred = $.Deferred();
      var options = this.options;
      var collection = options.collection || options.containerCollection;

      function ensureModelInCollection() {
        if (!collection.findWhere({id: options.model.get('id')})) {
          collection.add(options.model, {at: 0, silent: true});
        }
      }

      function updateMetadataInfo(collection) {
        var metadataModel = options.context.getModel(MetadataModelFactory);
        if (metadataModel) {
          var metadataInfo = metadataModel.get('metadata_info');
          metadataInfo.collection = collection;
        }
      }

      function setCollectionToOptions() {
        options.collection || (options.collection = collection);
        options.containerCollection || (options.containerCollection = collection);
      }

      if (!collection) {
        var metadataModel = options.context.getModel(MetadataModelFactory);
        if (metadataModel) {
          var metadataInfo = metadataModel.get('metadata_info');
          this.contextCollection = metadataInfo && metadataInfo.collection;
          if (this.contextCollection && this.contextCollection.length > 0) {
            collection = this.contextCollection.clone();
            ensureModelInCollection();
            updateMetadataInfo(collection);
            setCollectionToOptions();
            delete options.context.viewStateModel.get('state').collection;
            return deferred.resolve().promise();
          }
        }
      }

      if (!collection) {
        options.model.ensureFetched()
            .done(function (response) {
              if (options.model.get('parent_id') === -1) {
                collection = new Backbone.Collection();
                ensureModelInCollection();
                updateMetadataInfo(collection);
                setCollectionToOptions();
                deferred.resolve();
                return;
              }
              var defaultActionController = new DefaultActionController();

              options.container = options.context.getModel(NodeModelFactory,
                {attributes: {id:options.model.get('parent_id')},
                temporary: true,
                options: {
                  defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
                      defaultActionController.commands),
                  delayRestCommands: true
                }
              });

              options.container.ensureFetched()
                  .done(function (response) {
                    collection = options.context.getCollection(
                        ChildrenCollectionFactory, {
                          options: {
                            node: options.container,
                            defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
                              defaultActionController.commands),
                            delayRestCommands:true
                          }
                        });
                    collection.setFields && collection.setFields(nodeExtraData.getModelFields());
                    collection.setExpand && collection.setExpand(nodeExtraData.getModelExpand());
                    collection.ensureFetched()
                        .done(function (response2) {
                          ensureModelInCollection();
                          updateMetadataInfo(collection);
                          setCollectionToOptions();
                          deferred.resolve(response2);
                        })
                        .fail(function (error2) {
                          self._showFetchNodeFailMessage(error2, options.container.get("id"));
                          deferred.reject(error2);
                        });
                  })
                  .fail(function (error) {
                    self._showFetchNodeFailMessage(error, options.container.get("id"));
                    deferred.reject(error);
                  });
            })
            .fail(function (error) {
              self.unblockActions();
              self._showFetchNodeFailMessage(error, options.model.get("id"));
              deferred && deferred.reject(error);
            });

        return deferred.promise();
      }

      return deferred.resolve().promise();
    },

    _showFetchNodeFailMessage: function (error, nodeId) {
      var errorObj = new base.Error(error);
      var title = lang.FetchNodeFailTitle;
      var message = _.str.sformat(lang.FetchNodeFailMessage, nodeId, errorObj.message);
      ModalAlert.showError(message, title);
    }

  });

  _.extend(MetadataNavigationView.prototype, ViewEventsPropagationMixin);

  return MetadataNavigationView;

});
