/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/log',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/node.perspectives',
  'csui/utils/classic.nodes/classic.nodes',
  'csui/utils/contexts/impl/delayed.actions.for.node',
  'csui/utils/contexts/perspective/plugins/node/main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data',
  'csui/models/perspective/personalization.model'
], function (module, _, Backbone, log, NodeModelFactory, NextNodeModelFactory,
    PreviousNodeModelFactory, ApplicationScopeModelFactory,
    PerspectiveContextPlugin, nodePerspectives, classicNodes,
    delayedActions, mainNodeExtraData, nodeExtraData, mergeExtraData,
    PersonalizationModel) {
  'use strict';

  log = log(module.id);
  var delayCommands = /\bdelayCommands\b(?:=([^&]*)?)?/i.exec(location.search);
  delayCommands = delayCommands ? delayCommands[1] !== 'false' : undefined;

  var config = module.config();
  if(delayCommands !== undefined) {
    config.delayCommands = delayCommands;
  }

  var sendOriginParams  = config.sendOriginParams;

  var nodeOptions = {
    fields: mergeExtraData(mainNodeExtraData.getModelFields(), nodeExtraData.getModelFields()),
    expand: mergeExtraData(mainNodeExtraData.getModelExpand(), nodeExtraData.getModelExpand()),
    includeResources: ['metadata', 'perspective']
  };

  var NodePerspectiveContextPlugin = PerspectiveContextPlugin.extend({
    constructor: function NodePerspectiveContextPlugin(options) {
      PerspectiveContextPlugin.prototype.constructor.apply(this, arguments);

      this.applicationScope = this.context
          .getModel(ApplicationScopeModelFactory);

      this.nextNodeFactory = this.context.getFactory(NextNodeModelFactory, {
        options: nodeOptions,
        permanent: true,
        detached: true
      });
      this.nextNode = this.nextNodeFactory.property;
      if( config.delayCommands) {
        delayedActions.delayCommands(this.nextNode);
      }
      delayedActions.relayActionEvents(this);
      this.nextNode.on('change:id', this.onNextNodeChanged, this);
      this.previousNode = this.context
          .getModel(PreviousNodeModelFactory, {
            permanent: true,
            detached: true
          });
      createNodeModel.call(this);
    },

    onClear: function () {
      this._clearModels(true);
    },

    onRefresh: function () {
      this._clearModels(false);
    },

    isFetchable: function (factory) {
      return factory.property !== this.node;
    },

    _clearModels: function (recreateNode) {
      if (this.applicationScope.id !== 'node') {
        clearCurrentNode.call(this);
        return this.nextNode.clear({silent: true});
      }

      clearCurrentNode.call(this);
      var delayChangeEvents = !recreateNode && (
          this.context.hasCollection('children') ||
          this.context.hasCollection('children2'));
      this.node.set(this.nextNode.attributes, {silent: delayChangeEvents});
      if (this.nextNode.delayRestCommands && this.nextNode.get('csuiDelayedActionsRetrieved')) {
        this.node.actions.reset(this.nextNode.actions.models, {silent: delayChangeEvents});
      }

      if (delayChangeEvents) {
        var children = this.context.hasCollection('children') &&
                       this.context.getCollection('children') ||
                       this.context.hasCollection('children2') &&
                       this.context.getCollection('children2');
        var updated;
        children.once('reset update', function () {
          if (!updated) {
            updated = true;
            this.node.triggerAllChanges();
            delayedActions.updateNodeActions(this);
            delayedActions.resumeRelayingActionEvents(this);
          }
        }, this);
      } else {
        delayedActions.updateNodeActions(this);
        delayedActions.resumeRelayingActionEvents(this);
      }

      function clearCurrentNode() {
        this.previousNode.clear({silent: true});
        this.previousNode.set(this.node.attributes, {silent: true});
        if (recreateNode) {
          createNodeModel.call(this);
        } else {
          this.node.clear({silent: true});
        }
      }
    },

    onNextNodeChanged: function () {
      Backbone.trigger('closeToggleAction');
      var nextNodeId = this.nextNode.get('id');
      if (nextNodeId == null || nextNodeId <= 0) {
        return;
      }
      if (this.fetching) {
        return;
      }

      this.context.triggerMethod('request:perspective', this);
      this.applicationScope.set('id', 'node');
      delayedActions.suppressRelayingActionEvents(this);
      var id = this.nextNode.get('id');
      this.nextNode.clear({ silent: true });
      this.nextNode.actions.reset([], { silent: true });
      this.nextNode.set('id', id, { silent: true });
      var self = this;
      var promise = this.fetching = this.nextNodeFactory.fetch({
        headers: sendOriginParams ? { 'X-OriginParams': location.search } : undefined,
        success: function () {
          self.onNodeFetchSuccess(promise);
        },
        error: function (model, jqxhr) {
          self.onNodeFetchFailure(promise, model, jqxhr);
        }
      });
    },

    onNodeFetchSuccess: function (promise) {
      if (suppressFetchResult.call(this, promise)) {
        return;
      }
      PersonalizationModel.loadPersonalization(this.nextNode, this.context)
        .then(this._changePerspective.bind(this, this.nextNode),
              this.context.rejectPerspective.bind(this.context));
    },

    onNodeFetchFailure: function (promise, sourceModel, error) {
      if (suppressFetchResult.call(this, promise)) {
        return;
      }

      this.context.rejectPerspective(sourceModel, error);
    },

    _changePerspective: function (sourceModel, personalization) {
      var classicUrl = classicNodes.getUrl(sourceModel);
      if (classicUrl) {
        window.location.replace(classicUrl);
        return;
      }

      var perspectiveModule,
          perspective = nodePerspectives.findByNode(sourceModel);
      var emptySource = _.isEmpty(sourceModel.get('perspective')) && _.isEmpty(personalization);
      var oldNonContainer = !config.enableNewPerspectiveNodes && !sourceModel.get('container');
      var importantPerspective = perspective.get('important');
      if (emptySource || oldNonContainer || importantPerspective) {
        perspectiveModule = perspective.get('module');
      }
      if (perspective) {
        sourceModel.set({"persist": perspective.get("persist")}, {silent: true});
      }
      if (perspectiveModule) {
        return this.context.overridePerspective(sourceModel, perspectiveModule);
      }

      this.context.applyPerspective(sourceModel, false, personalization);
    }
  });

  function createNodeModel() {
    this.node = this.context
        .getModel(NodeModelFactory, {
          options: nodeOptions
        });
    this.node.markFetched();
    if( config.delayCommands) {
      delayedActions.delayCommands(this.node);
    }
  }
  function suppressFetchResult(promise) {
    var fetching = this.fetching;
    this.fetching = null;
    if (promise === fetching) {
      return false;
    }
    log.debug('Suppressing the node perspective delivery in {0}.', this.cid) && console.log(log.last);
    var error = new Error('Earlier node navigation suppressed.');
    this.context.triggerMethod('error:perspective', this, error);
    return true;
  }

  return NodePerspectiveContextPlugin;
});
