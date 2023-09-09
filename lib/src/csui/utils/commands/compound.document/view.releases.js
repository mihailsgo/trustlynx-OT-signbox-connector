/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["require", "csui/lib/underscore", "csui/lib/jquery",
  "i18n!csui/utils/commands/nls/localized.strings",
  "csui/utils/commandhelper", "csui/models/command", 'csui/models/nodes'
], function (require, _, $, lang, CommandHelper, CommandModel, NodeCollection) {
  'use strict';

  var ViewReleasesCommand = CommandModel.extend({

    defaults: {
      signature: "ViewReleases",
      command_key: ['releases', 'ViewReleases'],
      name: lang.CommandNameViewReleases,
      scope: "multiple",
      selfBlockOnly: true,
      commands: 'csui/utils/commands'
    },

    execute: function (status, options) {
      var context = status.context || options && options.context;
      if (status.originatingView && context && context.viewStateModel &&
        context.viewStateModel.get('history') &&
        context.viewStateModel.get('enabled') &&
        !status.showPermissionView) {
        var deferred = $.Deferred();
        require(['csui/utils/contexts/factories/metadata.factory',
          'csui/widgets/metadata/header.dropdown.menu.items', this.get('commands')
        ], function (MetadataFactory, metadataDropdownMenuItems, commands) {
          var metadataModel = context.getModel(MetadataFactory),
            node = CommandHelper.getJustOneNode(status) || (status.nodes && status.nodes.at(0)),
            container = status.container,
            selected = status.nodes,
            originatingView = status.originatingView,
            navigationView = true,
            nodes;

          if (selected && selected.first() === container || !!status.noMetadataNavigation) {
            navigationView = false;
          } else {
            nodes = this._getAtLeastOneNode(status);
          }

          if (originatingView && originatingView.options.refetchNodeActions && nodes) {
            var commandSignatures = commands.getSignatures(metadataDropdownMenuItems);
            nodes.each(function (node) {
              if (!!node.refetchNodeActions) {
                node.nonPromotedActionCommands = commandSignatures;
                node.set({ csuiLazyActionsRetrieved: false }, { silent: true });
              }
            });
          }
          metadataModel.set('metadata_info', {
            id: node.get('id'),
            model: node,
            navigator: navigationView,
            collection: nodes,
            selectedTab: 'releases', // releases of the compound document have to be displayed on navigation
          });

          deferred.resolve();
        }.bind(this), function (error) {
          deferred.reject(error);
        });
        return deferred.promise();
      }
    },

    _getAtLeastOneNode: function (status) {
      var nodes = new NodeCollection();
      if (!status.nodes) {
        return nodes;
      }
      if (status.nodes.length === 1 && status.collection) {
        if (!status.collection.findWhere({ id: status.nodes.models[0].get('id') })) {
          nodes.add(status.nodes.models[0]);
          nodes.add(status.collection.models);
          return nodes;
        } else {
          return status.collection;
        }
      } else {
        return status.nodes;
      }
    }
  });
  return ViewReleasesCommand;
});