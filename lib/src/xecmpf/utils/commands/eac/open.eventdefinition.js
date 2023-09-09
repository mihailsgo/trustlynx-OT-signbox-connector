/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module','require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'csui/utils/commandhelper'
], function (module, require, _, $, CommandModel, CommandHelper) {
  'use strict';

  var config = _.extend({
    enabled: true
  }, module.config());

  var OpenEventDefinition = CommandModel.extend({

    defaults: {
      signature: 'OpenEventDefinition',
      command_key: ['default', 'browse'],
      scope: 'single'
    },

    enabled: function (status) {
      return true;
    },
    
    execute: function (status, options) {
      var deferred = $.Deferred()
      require(
        ['csui/utils/contexts/factories/next.node'],
        function (NextNodeModelFactory) {
          var context = status.context || options && options.context,
            node = CommandHelper.getJustOneNode(status),
            nextNode = context.getModel(NextNodeModelFactory);
          _.extend(context, {
            model: node
          });
          nextNode.set('id', node.get('id'));
          deferred.resolve();
        }, deferred.reject);
      return deferred.promise();
    }

  });

  return OpenEventDefinition;

});
