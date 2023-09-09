/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/jquery',
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/pages/start/perspective.router',
  'csui/utils/contexts/factories/next.node', 'csui/models/node/node.model',
  'i18n!csui/pages/start/nls/lang', 'i18n!csui/pages/start/impl/nls/lang'
], function (module, $, _, Backbone, PerspectiveRouter, NextNodeModelFactory, NodeModel, publicLang, lang) {
  'use strict';

  var NodePerspectiveRouter = PerspectiveRouter.extend({
    routes: {
      'nodes/:id': 'openNodePerspective',
      'nodes/:id(?*query_string)': 'openNodePerspective'
    },

    name: 'Node',

    constructor: function NodePerspectiveRouter(options) {
      PerspectiveRouter.prototype.constructor.apply(this, arguments);

      this.nextNode = this.context.getModel(NextNodeModelFactory);

      this.listenTo(this.nextNode, 'change:id', this._updateNodeUrl);
      this.listenTo(this.nextNode, 'before:change:id', function(){
        this.lastNodeId = this.nextNode.get('id');
        this.activate(true);
      }.bind(this));

      this.lastNodeId = this.nextNode.get('id');

    },

    openNodePerspective: function (id, query_string) {
      
      this.navigateFromUrl = true;

      if (NodeModel.usesIntegerId) {
        id = parseInt(id);
        if (isNaN(id)) {
          this.nextNode.unset('id', {silent: true});
          return this.context.rejectPerspective(new Backbone.Model(),
            new Error(lang.invalidObjectName));
        }
      }

      var setId = id && id !== this.nextNode.get('id');
      this.activate(false);
      if (!this.restoring) {
        this.initViewStateFromUrlParams(query_string, setId);
      }

      var context = this.context,
          viewStateModel = context.viewStateModel;

      if (setId) {
        this.nextNode.set('id', id);
      }
      setTimeout(function () {
        if (setId) {
          if (viewStateModel && viewStateModel.get('state') &&
              viewStateModel.get('state').filter) {
            viewStateModel.trigger('change:state');
          }
        }
      }, 1000);

    },

    onOtherRoute: function (/*thisRouter, activeRouter*/) {
      this.nextNode.clear({silent: true});
    },

    isViewStateModelSupported: function () {
      return true;
    },

    onViewStateChanged: function () {
      if (this.nextNode.get('id')) {
        this._updateNodeUrlImmediately();
      }
    },

    restore: function (routerInfo) {
      this.openNodePerspective(routerInfo.sessionState.id, routerInfo.state);
    },
    
    resetQueryStringParams: function() {
      var viewStateModel = this.context.viewStateModel,
          constants = viewStateModel.CONSTANTS;
      viewStateModel.unset(constants.QUERY_STRING_PARAMS);
    },

    waitForPerspectiveChange: function (callback) {
      this.listenToOnce(this.context, 'retain:perspective change:perspective error:perspective', callback);
    },

    _updateNodeUrl: function () {

      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }

      var callback = function () {
        this.stopListening(this.context, 'retain:perspective change:perspective error:perspective', callback);

        this._updateNodeUrlImmediately();
        this._updatePageTitle();

      }.bind(this);

      this.waitForPerspectiveChange(callback);

    },

    _updateNodeUrlImmediately:function() {
      
      if (this.navigateFromUrl) {
        this.navigateFromUrl = false;
      } else {
        this.resetQueryStringParams();
      }

      if (!this.nextNode.isFetchable()) {
        return;
      }

      var nextNode   = this.nextNode,
          nextNodeId = nextNode.get('id'),
          uri        = 'nodes/' + encodeURIComponent(nextNodeId);

      if (this !== this.getActiveRouter()) {
        this.activate(true);
      }

      this.navigate(uri);
    },

    initSessionViewState: function () {
      this._updateSessionState();
    },

    _updateSessionState: function () {
      var nextNode       = this.nextNode,
          nextNodeId     = nextNode && nextNode.get('id'),
          viewStateModel = this.context && this.context.viewStateModel;

      var currentId = viewStateModel.getSessionViewState('id');
      if (currentId && currentId === nextNodeId) {
        return;
      }
      if (viewStateModel && nextNodeId) {
        var newSessionState = {};
        if (this.restoring || 
            this.lastNodeId === undefined || 
            this.lastNodeId === this.nextNode.get('id')) {
          _.extend(newSessionState, viewStateModel.get(viewStateModel.CONSTANTS.SESSION_STATE));
        }
        _.extend(newSessionState, {id: nextNodeId});
        viewStateModel.unset(viewStateModel.CONSTANTS.SESSION_STATE, {silent: true});
        viewStateModel.set(viewStateModel.CONSTANTS.SESSION_STATE, newSessionState);
      }
    },

    _updatePageTitle: function () {
      document.title = _.str.sformat(publicLang.NodeTitle, this.nextNode.get('name'), this.nextNode.get('type_name'), publicLang.ProductName);
      this._updateBackToTitle();
    },

    _updateBackToTitle: function() {
      var viewStateModel = this.context && this.context.viewStateModel;
      viewStateModel && viewStateModel.set(viewStateModel.CONSTANTS.BACK_TO_TITLE, this.nextNode.get('name'));
    }

  });

  return NodePerspectiveRouter;
});
