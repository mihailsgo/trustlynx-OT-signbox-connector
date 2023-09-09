/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/models/command', 'i18n!greet/commands/add.hello/impl/nls/lang'
], function (require, _, $, CommandModel, lang) {
  'use strict';
  var NodeModel;

  var AddHelloCommand = CommandModel.extend({

    defaults: {
      signature: 'greet-add-hello',
      name: lang.toolbarButtonTitle
    },

    enabled: function (status, options) {
      return status.container && status.container.get('container');
    },

    execute: function (status, options) {
      var deferred = $.Deferred();
      require(['csui/models/node/node.model'
      ], function () {
        NodeModel = arguments[0];
        var node = new NodeModel({
          parent_id: status.container.get('id'),
          type: options.addableType,
          name: '',
          type_name: options.addableTypeName
        }, {
          connector: status.container.connector
        });
        
        deferred.resolve(node);
        
      }, function (error) {
        deferred.reject(error);
      });
      status.forwardToTable = true;
      return deferred.promise();
    }

  });

  return AddHelloCommand;

});
