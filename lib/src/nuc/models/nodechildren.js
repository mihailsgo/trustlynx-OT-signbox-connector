/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'nuc/lib/jquery', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/utils/url', 'nuc/models/node/node.model', 'nuc/models/nodes',
  'nuc/models/nodechildrencolumns',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/browsable/browsable.mixin',
  'nuc/models/mixins/delayed.commandable/delayed.commandable.mixin',
  'nuc/models/node.children/server.adaptor.mixin',
  'nuc/utils/log', 'nuc/utils/deepClone/deepClone'
], function (module, $, _, Backbone, Url, NodeModel, NodeCollection,
    NodeChildrenColumnCollection, NodeResourceMixin, ExpandableMixin,
    BrowsableMixin, DelayedCommandableMixin, ServerAdaptorMixin, log) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30
  });

  log = log(module.id);
  var NodeChildrenCollection = NodeCollection.extend(/** @lends NodeChildrenCollection.prototype */{


    constructor: function NodeChildrenCollection(models, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize,
        columnsFromDefinitionsOrder: false
      }, options);

      NodeCollection.prototype.constructor.call(this, models, options);

      this.makeNodeResource(options)
          .makeExpandable(options)
          .makeDelayedCommandable(options)
          .makeBrowsable(options)
          .makeServerAdaptor(options);

      this.options = options;
      this.includeActions = options.includeActions;
      this.columns = new NodeChildrenColumnCollection();
    },
    clone: function () {
      return new this.constructor(this.models, {
        node: this.node,
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        expand: _.clone(this.expand),
        includeActions: this.includeActions,
        commands: _.clone(this.includeCommands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands
      });
    },
    isFetchable: function () {
      return this.node.isFetchable();
    }
  });

  BrowsableMixin.mixin(NodeChildrenCollection.prototype);
  ExpandableMixin.mixin(NodeChildrenCollection.prototype);
  DelayedCommandableMixin.mixin(NodeChildrenCollection.prototype);
  ServerAdaptorMixin.mixin(NodeChildrenCollection.prototype);
  NodeResourceMixin.mixin(NodeChildrenCollection.prototype);
  var originalFetch = NodeChildrenCollection.prototype.fetch;
  NodeChildrenCollection.prototype.Fetchable = {
    fetch: function (options) {
      return originalFetch.call(this, options);
    }
  };

  return NodeChildrenCollection;
});
