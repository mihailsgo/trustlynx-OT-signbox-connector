/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'xecmpf/utils/commands/xecm.open.plugins/impl/al.web.viewer.plugin',
  'xecmpf/utils/commands/xecm.open.plugins/impl/web.viewer.plugin'
], function (ArchiveLinkWebViewerPlugin, WebViewerPlugin) {
  'use strict';

  return [{
    sequence: 50,
    plugin: ArchiveLinkWebViewerPlugin,
    decides: ArchiveLinkWebViewerPlugin.isSupported
  },
  {
    sequence: 500,
    plugin: WebViewerPlugin,
    decides: WebViewerPlugin.isSupported
  }];
});