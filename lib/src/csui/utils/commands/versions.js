/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/models/commands',
  'csui/utils/commands/versions/delete',
  'csui/utils/commands/versions/download',
  'csui/utils/commands/versions/open',
  'csui/utils/commands/versions/properties',
  'csui/utils/commands/versions/promote.version',
  'csui/utils/commands/versions/doc.version.preview',
  'csui/utils/commands/versions/open.version/open.version.delegate',
  'csui/utils/commands/versions/open.version.perspective',
  'csui/utils/commands/copy.link',
  'csui/utils/commands/email.link',
  'csui-ext!csui/utils/commands/versions'
], function (_, CommandCollection,
    VersionDeleteCommand,
    VersionDownloadCommand,
    VersionOpenCommand,
    VersionPropertiesCommand,
    PromoteVersionCommand,
    DocVersionPreviewCommand,
    OpenVersionDelegateCommand,
    OpenVersionPerspectiveCommand,
    CopyLinkCommand,
    EmailLinkCommand,
    extraCommands) {
  'use strict';

  var commands = new CommandCollection([
    new VersionDeleteCommand(),
    new VersionDownloadCommand(),
    new VersionOpenCommand(),
    new VersionPropertiesCommand(),
    new PromoteVersionCommand(),
    new DocVersionPreviewCommand(),
    new OpenVersionDelegateCommand(),
    new OpenVersionPerspectiveCommand(),
    new CopyLinkCommand(),
    new EmailLinkCommand()
  ]);

  if (extraCommands) {
    commands.add(
        _.chain(extraCommands)
            .flatten(true)
            .map(function (Command) {
              return new Command();
            })
            .value()
    );
  }

  return commands;

});
