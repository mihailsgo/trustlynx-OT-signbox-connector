/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', "csui/lib/jquery", 'csui/lib/marionette', 'csui/utils/log'
], function (module, _, $, Marionette, log) {
  'use strict';

  log = log(module.id);

  return {

    _getNodesFromCollection: function (collection, ids, connector) {
      var deferred      = $.Deferred(),
          nodesNotInCollection = [],
          nodesInCollection = [];

      var nodes = ids.map(function (id) {
        var node = collection.find({id: id});
        if (node) {
          nodesInCollection.push(node);
        } else {
          node = new collection.model({id: id}, {connector: connector});
          nodesNotInCollection.push(node);
        }
        return node;
      }.bind(this));

      if (nodesNotInCollection.length === 0) {
        return deferred.resolve(nodes, nodesInCollection);
      } else {
        this.blockActions && this.blockActions();
        this._fetchNodes(nodesNotInCollection, collection).done(function () {
          deferred.resolve(nodes, nodesInCollection);
          this.unblockActions && this.unblockActions();
        }.bind(this));
      }

      return deferred.promise();
    },

    _fetchNodes: function (nodes, collection) {
      var deferred  = $.Deferred(),
          deferreds = [];
      nodes.forEach(function (node) {
        deferreds.push(node.fetch({collection: collection}));
      });

      $.whenAll.apply($, deferreds).always(function () {
        deferred.resolve();
      });

      return deferred.promise();
    }

  };

});
