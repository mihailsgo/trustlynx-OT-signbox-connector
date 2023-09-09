/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/models/command', 'csui/utils/commandhelper',
  'i18n!greet/commands/add.hello/impl/nls/lang'
], function (require, _, $, Backbone, CommandModel, CommandHelper, lang) {
  'use strict';
  var NodeModel, NodeCollection, MetadataAddItemController,
      HelloCreateFormCollection, HelloCreateController,
      GlobalMessage;

  var AddHelloTemplateCommand = CommandModel.extend({

    defaults: {
      signature: 'greet-add-hello-template',
      name: lang.toolbarButtonTitle
    },

    enabled: function (status, options) {
      var addableTypes = status.data && status.data.addableTypes;
      return addableTypes && addableTypes.get(12345);
    },

    execute: function (status, options) {
      var deferred = $.Deferred(),
          template = new Backbone.Model({id: status.data.template_id});
      require(['csui/models/node/node.model', 'csui/models/nodes',
        'csui/widgets/metadata/metadata.add.item.controller',
        'csui/controls/globalmessage/globalmessage',
        'greet/commands/add.hello/impl/hello.create.forms',
        'greet/commands/add.hello/impl/hello.create.controller'
      ], function () {
        NodeModel = arguments[0];
        NodeCollection = arguments[1];
        MetadataAddItemController = arguments[2];
        GlobalMessage = arguments[3];
        HelloCreateFormCollection = arguments[4];
        HelloCreateController = arguments[5];
        var node = new NodeModel({
              parent_id: status.container.get('id'),
              type: options.addableType,
              name: '',
              type_name: options.addableTypeName
            }, {
              connector: status.container.connector
            }),
            metadataAddItemController = new MetadataAddItemController();
        status.nodes = new NodeCollection([node]);
        metadataAddItemController
            .displayForm(status, options)
            .then(function () {
              if (status.collection) {
                node.isLocallyCreated = true;
                status.collection.unshift(node);
              }
              return node.fetch();
            })
            .done(deferred.resolve)
            .fail(deferred.reject);
        
      }, function (error) {
        deferred.reject(error);
      });
      status.suppressSuccessMessage = true;
      return deferred.promise();
    }

  });

  return AddHelloTemplateCommand;

});
