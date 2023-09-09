/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/jquery', 'csui/lib/underscore',
  'csui/models/command', 'csui/utils/commandhelper',
  'i18n!csui/utils/commands/nls/localized.strings'
], function (require, $, _, CommandModel, CommandHelper, lang) {
  'use strict';

  var OpenNodePerspectiveCommand = CommandModel.extend({

    execute: function (status, options) {
      var deferred = $.Deferred();
      options && options.originatingView && options.originatingView.trigger('destroy:gallery');
      require(['csui/utils/contexts/factories/next.node'
      ], function (NextNodeModelFactory) {
        var context = status.context || options && options.context,
            nextNode = context.getModel(NextNodeModelFactory),
            node = CommandHelper.getJustOneNode(status);
        if (!node || !node.get('id')) {
          deferred.reject({message: lang.MissingNodeId});
          return;
        }

        var viewState = context.viewStateModel.get('state');
        if (viewState) {
          context.viewStateModel.set('state', _.omit(viewState, 'filter'), {silent: true});
        }
        nextNode.trigger('before:change:id', node, options && options.originatingView);
        var id = node.get('id');
        nextNode.unset('id', { silent: true }).set('id', id);
        deferred.resolve();
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }

  });

  return OpenNodePerspectiveCommand;

});
