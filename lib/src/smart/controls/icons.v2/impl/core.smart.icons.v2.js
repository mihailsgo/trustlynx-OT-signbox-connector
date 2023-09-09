/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'smart/themes/carbonfiber/smart.mimetype.icons',
  'smart/themes/carbonfiber/smart.mimetype.colorschema.icons',
  'smart/themes/carbonfiber/smart.action.icons'
], function (MimeTypeIcons, MimeTypeColorSchemaIcons, ActionIcons) {
  'use strict';

  var coreSmartIcons = [];

  MimeTypeIcons && coreSmartIcons.push(MimeTypeIcons);
  MimeTypeColorSchemaIcons && coreSmartIcons.push(MimeTypeColorSchemaIcons);
  ActionIcons && coreSmartIcons.push(ActionIcons);

  return coreSmartIcons;
});
