/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
    'module',
    'csui/lib/jquery',
    'csui/lib/underscore',
    'csui/lib/backbone',
    'csui/models/node/node.model',
    'csui/models/nodeancestors',
    'csui/utils/contexts/factories/factory',
    'xecmpf/widgets/boattachments/impl/boattachmentutil'


], function (module, $, _, Backbone, NodeModel,
             NodeAncestorCollection, ConnectorFactory, BOAttachmentUtil) {

    var BOAttachmentModel = NodeModel.extend({

        constructor: function BOAttachmentModel(attributes, options) {
            options || (options = {});
            if (!options.connector) {
                options.connector = options.collection && options.collection.connector || undefined;
            }
            this.connector = options.connector;
            NodeModel.prototype.constructor.call(this, attributes, options);

        },
        idAttribute: 'id',
        parse: function (response, options) {
            var node = NodeModel.prototype.parse.call(this, response, options);

            if (!node.size_formatted ) {
                node.size_formatted =
                    BOAttachmentUtil.formatFilzeSize(node);
            }
            if ( node.version === 0 ){
                node.version = "";
            }

            if (node.actions) {
                node.actions[node.actions.length] = {
                    body: "",
                    content_type: "",
                    form_href: "",
                    href: "",
                    method: "GET",
                    name: "Snapshot",
                    signature: "Snapshot"
                }
            }

            node.ancestors = new NodeAncestorCollection(
                response.data.ancestors, {
                node: this, autofetch: false
            });

            return node;
        }

    });

    BOAttachmentModel.prototype.fetch = function (options) {
      return fetchNodeActions(this).then(_.bind(function (actions) {
        this.set('actions', actions)
      }, this))
    };

    function fetchNodeActions(node, options) {
      var deferred = $.Deferred();
      require(['csui/models/node.actions'], function (NodeActionCollection) {
        var actions = new NodeActionCollection(undefined, {
          connector: node.connector,
          nodes: [node.get('id')],
          commands: _.result(node, 'urlQueryWithActionsOnly').actions
        });
        return actions
        .fetch()
        .then(function () {
          return actions.reduce(function (actions, node) {
            var attributes = node.actions.toJSON();
            return actions.concat(attributes);
          }, []);
        }).then(deferred.resolve, deferred.reject)
      }, deferred.reject);
      return deferred.promise();
    }

    return BOAttachmentModel;
});
