/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/base', 'csui/widgets/metadata/impl/header/metadata.header.view',
  'csui/widgets/metadata/impl/metadata.dropdowntab.view',
  'csui/utils/contexts/factories/node',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/mixins/view.state/metadata.view.state.mixin',
  'csui/widgets/metadata/impl/metadata.controller',
  'csui/controls/progressblocker/blocker', 'csui/utils/commandhelper',
  'csui/widgets/permissions/permissions.view',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/contexts/factories/next.node',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/impl/metadata'
], function (module, _, $, Marionette, base, MetadataHeaderView, MetadataDropdownTabView,
    NodeModelFactory, ViewEventsPropagationMixin, MetadataViewStateMixin, MetadataController,
    BlockingView, CommandHelper, PermissionsView, ModalAlert, NextNodeModelFactory, lang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    showExtraRightActionBar: false
  });

  var MetadataView = Marionette.ItemView.extend({
    className: 'cs-metadata',

    template: false,

    constructor: function MetadataView(options) {
      var self = this;
      options || (options = {});
      options.data || (options.data = {});
      this.options = options;
      this.context = options.context;
      
      this.enableViewState = options.enableViewState === undefined ? true : options.enableViewState;
      if (this.enableViewState && this.isShowPermissionView() && !options.model) {
        this.initOptionsFromMetadataInfo(options);
      }

      this.options.showExtraRightActionBar = this.options.showPermissionView ||
                                             config.showExtraRightActionBar;
      this.targetView = options.targetView;
      
      this.thumbnailViewState = options.originatingView &&
                                options.originatingView.thumbnailViewState;

      var doNodeFetch = false;

      if (!options.model) {
        options.model = options.context.getModel(NodeModelFactory);
        var keys = _.keys(options.model.attributes);
        if(!options.model.fetching && keys.length === 1 && keys[0] === 'id') {
          options.model.fetched = false;
        }
        doNodeFetch = true;
      }

      var viewStateModel = this.context && this.context.viewStateModel;
      if (this._isViewStateModelEnabled()) {
        if (doNodeFetch && options.model && options.model.ensureFetched) {
          if (this.isShowPermissionView() && !options.model.fetched) {
            options.model.delayRestCommands = false;
          }
          options.model.ensureFetched();
        }
        if (!this.isMetadataNavigation()) {
          this.options.showBackIcon = true;
          if (viewStateModel && !viewStateModel.hasRouted()) {
            this.options.showBackIcon = false;
          }
          this._isViewStateModelEnabled() && this._addUrlParametersSupport(options.context);
          this.listenTo(this, 'metadata:close', this._backToPreviousPerspective);
          this.listenTo(options.model, 'delete', this._navigateToParent);
        } else {
          this.options.showBackIcon = false;
        }
      } else if (this.options.navigationView === false) {
        this.listenTo(options.model, 'delete', function () {
          self.trigger('metadata:close');
        });
      }
      options.model.unset('initialPanel', {silent: true});
      if (options.data.initialPanel) {
        options.model.set('initialPanel', options.data.initialPanel, {silent: true});
      }
      this.options.showShortcutSwitch = true;
      this.options.showRequiredFieldsSwitch = true;
      if (this.options.model.get('type') === 1 || !!this.options.model.get('shortcutNode')) {  // shortcut
        if (!doNodeFetch && (!!this.options.model.get('shortcutNode') && this.options.model.get('type') !== 1 ||
          (this.options.model.original &&
            (this.options.model.original.get('type') === undefined ||
              this.options.model.original.get('type') < 0) ||
            !this.options.model.get('original_id')))) {
          this.options.shortcutNode = this.options.model.get('shortcutNode');
        } else if (!!this.options.model.get('shortcutNode') && this.options.model.get('type') !== 1) {
          this.options.shortcutNode = this.options.model.get('shortcutNode');
        }
        else {
          this.options.model.connector.assignTo(this.options.model.original); //TODO: have to do this?
          this.options.shortcutNode = this.options.model;
          var shortcutResourceScope = this.options.shortcutNode.getResourceScope();
          this.options.model.original.setResourceScope(shortcutResourceScope);
          this.options.model = this.options.model.original;
          this.options.model.set('shortcutNode', this.options.shortcutNode, { silent: true });
        }
        this.options.actionsPromise = this._ensureCompleteNode();
      } else if (this.options.model.refetchNodeActions) {
        this.options.actionsPromise = this._ensureCompleteNode();
      } else {
        this.options.actionsPromise = $.Deferred().resolve().promise();
      }
      if (!!this.options.originatingView && !!this.options.originatingView.supportOriginatingView) {
        this.options.baseOriginatingView = this.options.originatingView;
        this.options.originatingView = this;
      }

      Marionette.ItemView.prototype.constructor.call(this, options);
      BlockingView.imbue(this);

      this.options.showDropdownMenu = true;
      this.options.originatingView = this.options.originatingView || this;
      this.metadataHeaderView = new MetadataHeaderView(_.extend({
        metadataScenario: true,
        originatingView: this
      }, this.options));
      this.listenTo(this.metadataHeaderView, "metadata:item:name:save", this._saveItemName)
      .listenTo(this.metadataHeaderView, "shortcut:switch", function (view) {
        self.options.model = view.node;
        self.options.model.set('shortcutNode', self.model.get('shortcutNode'), {silent: true});
        this._ensureCompleteNode()
        .always(function () {
          !!self.metadataTabView && self.metadataTabView.destroy();
          if (!!self.options.showPermissionView) {
            self.metadataTabView = new PermissionsView({
              model: self.options.model,
              originatingView: self.options.originatingView,
              context: self.options.context,
              showCloseIcon: self.options.originatingView ? false : true,
              showBackIcon: self.options.originatingView ? true : false,
              selectedTab: status.selectedTab,
              selectedProperty: self.options.selectedProperty
            });

          } else {
            self.metadataTabView = new MetadataDropdownTabView({
              context: self.options.context,
              node: self.options.model,
              containerCollection: self.options.containerCollection,
              originatingView: self.options.originatingView,
              metadataView: self,
              activeTab: self.options.activeTab,
              delayTabContent: self.options.delayTabContent
            });
          }

          self.$el.append(self.metadataTabView.render().$el);
          self.propagateEventsToViews(self.metadataTabView);
        });
      })
      .listenTo(this.metadataHeaderView, "metadata:close", function () {
        self.trigger("metadata:close");
      })
      .listenTo(this.options.context, 'retain:perspective', function () {
        self._closeMetadata();
      });

      var tabOptions = {
        context: this.options.context,
        node: this.options.model,
        containerCollection: this.options.containerCollection,
        originatingView: this.options.originatingView,
        metadataView: this,
        blockingParentView: this,
        activeTab: this.options.activeTab,
        selectedTab: this.options.selectedTab || this.getViewStateDropdown(),
        selectedProperty: this.options.selectedProperty,
        delayTabContent: self.options.delayTabContent
      };

      if (this.options.showPermissionView) {
        this.options.actionsPromise.always(function () {
           self.metadataTabView = new PermissionsView({
            model: self.options.model,
            originatingView: self.options.originatingView,
            context: self.options.context,
            showCloseIcon: self.options.originatingView ? false : true,
            showBackIcon: self.options.originatingView ? true : false,
            selectedTab: status.selectedTab,
            selectedProperty: self.options.selectedProperty
          });
          self.propagateEventsToViews(self.metadataTabView, self.metadataHeaderView);
          if (self._isViewStateModelEnabled()) {
            self.listenTo(self.context.viewStateModel, 'change:state', self.onViewStateChanged);
          }
        });
      }
      else {
        this.options.actionsPromise.always(function () {
          self.metadataTabView = new MetadataDropdownTabView(tabOptions);
          self.propagateEventsToViews(self.metadataTabView, self.metadataHeaderView);
          if (self._isViewStateModelEnabled()) {
            self.listenTo(self.context.viewStateModel, 'change:state', self.onViewStateChanged);
          }
        });
      }

      if (this.enableViewState) {
        viewStateModel && !this.isMetadataNavigation() &&
        this.listenTo(viewStateModel, "navigate", function (historyEntry) {
          if (historyEntry && self.options.showBackIcon !== true) {
            self.options.showBackIcon = true;
            self.metadataHeaderView.showBackIcon(true, self.__isRendered);
          }
        });
      }

    },

    onRender: function () {
      var fetching = this.options.model.fetchingActions || this.options.model.fetching;
      if (fetching) {
        return fetching.always(_.bind(this.render, this));
      }

      this.__isRendered = true;
      var mhv = this.metadataHeaderView.render();
      var mdv = this.metadataTabView.render();

      Marionette.triggerMethodOn(mhv, 'before:show', mhv, this);
      Marionette.triggerMethodOn(mdv, 'before:show', mdv, this);

      this.$el.append(mhv.el);
      this.$el.append(mdv.el);

      this.$el.attr({'role': 'region', 'aria-label': lang.metadataRegionAria});

      Marionette.triggerMethodOn(mhv, 'show', mhv, this);
      Marionette.triggerMethodOn(mdv, 'show', mdv, this);

      if (this._isViewStateModelEnabled() && !this.showPermissionView) {
        this._listenToDropdownSelection();
      }
    },

    _isViewStateModelEnabled: function () {
      var viewStateModel = this.context && this.context.viewStateModel;
      return this.enableViewState && viewStateModel && viewStateModel.get('enabled');
    },

    onViewStateChanged: function () {
      var selection = this.getViewStateDropdown() || this.getDefaultViewStateDropdown(),
          tabLinks = this.metadataTabView.tabLinks;
      if (tabLinks && tabLinks.selected) {
        if (selection && tabLinks.selected.get('name') !== selection) {
          tabLinks.activateDropdownTab(selection, true);
        }
      }
    },

    _listenToDropdownSelection: function () {
      var tabLinks = this.metadataTabView.tabLinks;
      if (tabLinks && tabLinks.selected) {
        var dropDownName = this.getViewStateDropdown();
        if (dropDownName !== tabLinks.selected.get('name')) {
          this.setViewStateDropdown(tabLinks.selected.get('name'),
              {default: !dropDownName, title: tabLinks.selected.get('title').toLowerCase()});
        }
        this.listenTo(tabLinks.selected, 'change', this._onDropDownSelectionChanged);
      }
    },

    _onDropDownSelectionChanged: function (model) {
      this.setViewStateDropdown(model.get('name'), {title: model.get('title').toLowerCase()});
    },

    onBeforeDestroy: function () {
      if (this.metadataTabView) {
        this.cancelEventsToViewsPropagation(this.metadataTabView);
        this.metadataTabView.destroy();
      }
      if (this.metadataHeaderView) {
        this.cancelEventsToViewsPropagation(this.metadataHeaderView);
        this.metadataHeaderView.destroy();
      }
      if (this.targetView && this.thumbnailViewState) {
        this.targetView.thumbnail.resultsView.triggerMethod("metadata:close");
      }
    },

    _saveItemName: function (args) {
      var self = this;
      var itemName = args.sender.getValue();
      var data = {'name': itemName};
      if (this.model.changed && this.model.changed.name_multilingual) {
        _.extend(data, {
          name_multilingual: this.model.changed.name_multilingual
        });
      }
      var metadataController = new MetadataController();
      var node = this.options.model;
      var collection = this.options.collection;
      var shortcutOriginal;
      if (this.options.shortcutNode && this.options.shortcutNode.original === node) {
        var originalNodeInCollection = this.options.collection.findWhere(
            {id: node.get('id')});
        if (originalNodeInCollection) {
          shortcutOriginal = node;
          node = originalNodeInCollection;
        } else {
          collection = undefined;
        }
      }

      var contextualNode = self.context.getModel(NodeModelFactory);
      if (contextualNode) {
        contextualNode.set('name', itemName);
      }

      self._blockActions();
      metadataController.save(node, data)
      .done(function () {
        return node.fetch()
        .then(function () {
          if (shortcutOriginal) {
            shortcutOriginal.set(node.attributes);
          }
          args.success && args.success();
          self._unblockActions();
          if (self.options.originatingView &&
              _.isFunction(self.options.originatingView.unblockActions)) {
            self.options.originatingView.unblockActions();
          }
        });
      })
      .fail(function (error) {
        self._unblockActions();
        var errorMsg = CommandHelper._getErrorMessageFromResponse(error);
        errorMsg === undefined && (errorMsg = lang.failedToSaveName);
        args.error && args.error(errorMsg);
      });
    },

    _ensureCompleteVersionNode: function () {
      this._blockActions();
      return this.options.model.fetch()
      .always(_.bind(this._unblockActions, this))
      .fail(function (request) {
        var error = new base.Error(request);
        ModalAlert.showError(error.message);
      });
    },

    _ensureCompleteNode: function () {
      var node = this.options.model;
      if (node && node.refetchNodeActions) {
        if (!node.fetchingActions) {
          node.fetchingActions = node.setEnabledLazyActionCommands(true);
        }
        node.fetchingActions
          .done(_.bind(function () {
            node.refetchNodeActions = false;
            node.fetchingActions = false;
          }, this))
          .fail(_.bind(function (request) {
            var error = new base.Error(request);
            ModalAlert.showError(error.message);
          }, this));
        return node.fetchingActions;
      } else if (this.options.showShortcutSwitch) {
        return node.fetch();
      }
      return $.Deferred().resolve().promise();
    },

    _backToPreviousPerspective: function () {
      if (this._isViewStateModelEnabled()) {
        this.context.viewStateModel.restoreRouterOfLastApplicationScope();
      } else {
        this._setNextNodeModelFactory(this.options.model.get('id'));
      }
    },

    _navigateToParent: function () {
      var parentId = this.options.model.get('parent_id');
      if (parentId) {
        this._setNextNodeModelFactory(parentId);
      } else {
        this._backToPreviousPerspective();
      }
    },

    _setNextNodeModelFactory: function (id) {
      if (this.context && id !== undefined) {
        var nextNode = this.context.getModel(NextNodeModelFactory);
        if (nextNode) {
          if (nextNode.get('id') === id) {
            nextNode.unset('id', {silent: true});
          }
          nextNode.set('id', id);
        }
      }
    },

    _closeMetadata: function () {
      var node = this.options.model;
      if (node.get('type') === 1 && node.original && node.original.get('type') === 0) {
        this.trigger("metadata:close");
      } else {
        this.trigger('metadata:close:without:animation');
      }
    },

    _blockActions: function () {
      var origView = this.options.originatingView;
      origView && origView.blockActions && origView.blockActions();
    },

    _unblockActions: function () {
      var origView = this.options.originatingView;
      origView && origView.unblockActions && origView.unblockActions();
    },

    _addUrlParametersSupport: function (context) {
      var viewStateModel = context && context.viewStateModel;
      viewStateModel && viewStateModel.addUrlParameters(['dropdown'], context);
    }

  });

  _.extend(MetadataView.prototype, ViewEventsPropagationMixin);
  _.extend(MetadataView.prototype, MetadataViewStateMixin);

  return MetadataView;
});
