/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/models/command',
  'csui/utils/commandhelper',
  'i18n!xecmpf/utils/commands/nls/localized.strings'
], function (module, require, _, $, Marionette, CommandModel,CommandHelper, lang) {
    var config = _.extend({
        enabled: true
      }, module.config());
      
  var AddActionPlan = CommandModel.extend({

    defaults: {
      signature: 'addActionPlan',
      name: lang.AddActionPlan,
      scope: 'single'
    },

    execute: function (status, options) {
      
      var deferred = $.Deferred()
      require(
        ['csui/utils/contexts/factories/next.node'],
        function (NextNodeModelFactory) {
          var context = status.context || options && options.context,
            node = CommandHelper.getJustOneNode(status),
            nextNode = context.getModel(NextNodeModelFactory);
            node.set('isAddActionPlan', true);
          _.extend(context, {
            model: node
          });
          nextNode.set('id', node.get('id'));
          deferred.resolve();
        }, deferred.reject);
      return deferred.promise();
    }

  });

  return AddActionPlan;
});