/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require', 'csui/lib/underscore',
  'csui/utils/contexts/impl/node.opening.context',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/impl/delayed.actions.for.node',
  'csui-ext!csui/utils/contexts/browsing/browsing.context',
  'csui/behaviors/default.action/impl/defaultaction'
], function (require, _, NodeOpeningContext, NodeModelFactory,
    PreviousNodeModelFactory, delayedActions, contextPlugins, DefaultActionController) {
  'use strict';

  var BrowsingContext = NodeOpeningContext.extend({
    constructor: function BrowsingContext(options) {
      NodeOpeningContext.prototype.constructor.apply(this, arguments);
      var defaultActionController = new DefaultActionController();

      this.on('request', this._changeNode, this);

      this.previousNode = this.getModel(PreviousNodeModelFactory, {
        permanent: true,
        detached: true
      });
      delayedActions.relayActionEvents(this);
      var browseNodeOptions = _.extend({
        delayRestCommands: true,
        defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
          defaultActionController.commands)
      }, this._getNodeOptions());
      this.node = this.getModel(NodeModelFactory, {
        options: browseNodeOptions,
        permanent: true,
        detached: true
      });
      var Plugins = _
          .chain(options && options.plugins || contextPlugins)
          .flatten(true)
          .unique()
          .reverse()
          .value();
      this._plugins = _.map(Plugins, function (Plugin) {
        return new Plugin({context: this});
      }, this);
      _.invoke(this._plugins, 'onCreate');
    },

    _isFetchable: function (factory) {
      return NodeOpeningContext.prototype._isFetchable.apply(this, arguments) &&
             _.all(this._plugins, function (plugin) {
               return plugin.isFetchable(factory) !== false;
             });
    },

    onNextNodeChanged: function () {
      if (this.nextNode.get('container') !== false) {
        this.enterContainer();
      } else {
        this.openNewNodePage();
      }
    },

    openNewNodePage: function () {
      this.openNodePage(this.nextNode);
      this.nextNode.clear({silent: true});
    },

    enterContainer: function () {
      this.triggerMethod('before:enter:container', this, this.nextNode);
      this.nextNode
          .fetch()
          .then(function () {
            this._enteringContainer = true;
            return this.fetch();
          }.bind(this))
          .fail(function (error) {
            require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
              ModalAlert.showError(error.toString());
            });
          });
    },

    _changeNode: function () {
      if (this._enteringContainer) {
        this.previousNode.clear({silent: true});
        this.previousNode.set(this.node.attributes);
        this.node.clear({silent: true});
        this.node.set('id', this.nextNode.get('id'), {silent: true});
        setTimeout(function () {
          this.node.unset('id', {silent: true});
          this.node.set(this.nextNode.attributes);
          delayedActions.updateNodeActions(this);
          this.nextNode.clear({silent: true});
        }.bind(this));
        this._enteringContainer = false;
      }
    },

    fetch: function () {
      var parameters = Array.prototype.slice.apply(arguments),
          self = this;

      function continueFetching () {
        NodeOpeningContext.prototype.fetch.apply(self, parameters);
      }

      if (!this._enteringContainer && this.node.isFetchable()) {
        this.triggerMethod('before:enter:container', this, this.node);
        return this.node
            .fetch()
            .then(continueFetching);
      }
      return continueFetching();
    }
  });

  return BrowsingContext;
});
