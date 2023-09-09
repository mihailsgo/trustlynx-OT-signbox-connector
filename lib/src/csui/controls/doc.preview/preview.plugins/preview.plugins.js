/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/commands/open.plugins/impl/brava.plugin'
], function (BravaPlugin) {
  'use strict';

  return [
    {
      sequence: 200,
      plugin: BravaPlugin,
      decides: BravaPlugin.isSupported
    }
  ];
});
