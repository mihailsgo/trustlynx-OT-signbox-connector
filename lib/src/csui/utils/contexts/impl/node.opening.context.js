/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/utils/contexts/context',
  'csui/utils/contexts/factories/connector',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/node.links/node.links',
  'csui/utils/contexts/factories/user',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/utils/contexts/perspective/plugins/node/main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data'
], function (_,Context, ConnectorFactory, NextNodeModelFactory,
    nodeLinks, UserModelFactory, DefaultActionController,
    mainNodeExtraData, nodeExtraData, mergeExtraData) {
  'use strict';
  var nodeOptions = {
    fields: mergeExtraData(mainNodeExtraData.getModelFields(), nodeExtraData.getModelFields()),
    expand: mergeExtraData(mainNodeExtraData.getModelExpand(), nodeExtraData.getModelExpand()),
    includeResources: ['metadata', 'perspective']
  };

  nodeOptions.fields['versions.element(0)'] = ['mime_type'];

  var NodeOpeningContext = Context.extend({
    constructor: function NodeOpeningContext(options) {
      Context.prototype.constructor.apply(this, arguments);
      var defaultActionController = new DefaultActionController();

      this.connector = this.getObject(ConnectorFactory, {
        permanent: true,
        detached: true
      });
      this.user = this.getModel(UserModelFactory, {
        permanent: true
      });
      var nodeOpeningOptions = _.extend({
        delayRestCommands: true,
        defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
          defaultActionController.commands)
      }, this._getNodeOptions());
      this.nextNode = this.getModel(
          NextNodeModelFactory, {
            options: nodeOpeningOptions,
            permanent: true,
            detached: true
          })
          .on('change:id', this.onNextNodeChanged, this);
    },

    _isFetchable: function (factory) {
      return Context.prototype._isFetchable.apply(this, arguments) &&
             (factory.property !== this.user || !this.user.get('id'));
    },

    openNodePage: function (node) {
      this.triggerMethod('before:open:page', this, this.nextNode);
      window.open(nodeLinks.getUrl(node));
    },

    _getNodeOptions: function() {
      return nodeOptions;
    }
  });

  return NodeOpeningContext;
});
