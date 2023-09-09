/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/utils/base', 'csui/utils/log',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/toolbar/toolitem.model',
  'greet/commands/add.hello/add.hello.command',
  'greet/commands/add.hello/impl/hello.templates',
  'i18n!greet/commands/add.hello/impl/nls/lang'
], function (base, log, GlobalMessage, ToolItemModel,
  AddHelloCommand, HelloTemplateCollection, lang) {
  'use strict';
  return function (tableToolbarView) {
    tableToolbarView.on('before:updateAddToolbar', function (args) {
      if (args.container) {
        populateHelloItems(args);
        populateHelloTemplates(args);
      }
    });

  };
  function populateHelloItems(args) {
    var addHelloCommand = new AddHelloCommand();
    if (addHelloCommand.enabled({container: args.container})) {
      args.toolbarItems.push(new ToolItemModel({
        signature: "greet-add-hello",
        name: lang.toolbarButtonTitle,
        group: 'greet',
        type: 12345
      }));
    }
  }
  function populateHelloTemplates(args) {
    var templates = new HelloTemplateCollection(undefined, {
                      node: args.container
                    }),
        done = args.async();
    templates
        .fetch()
        .done(function () {
          var toolItems = templates.map(function (template) {
            return new ToolItemModel({
              signature: "greet-add-hello-template",
              name: template.get('name'),
              group: 'greet',
              type: 12345,
              commandData: {
                template_id: template.get('id')
              }
            });
          });
          args.toolbarItems.push.apply(args.toolbarItems, toolItems);
        })
        .fail(function (request) {
          var error = new base.Error(request);
          log.error('Getting Hello Templates failed. {0}', error) &&
          console.error(log.last);
          GlobalMessage.showMessage('error',
            'Getting Hello Templates failed.', error.message);
        })
        .always(done);
  }

});
