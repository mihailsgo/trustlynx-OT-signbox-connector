/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/base',
  'json!csui/utils/commands/open.types.json', 'csui/utils/content.helper'
], function (_, $, base, openMimeTypes,
    contentHelper) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
                   .config['csui/utils/commands/open'] || {},
      mimeTypesFromPlugins = _.chain(navigator.plugins || [])
                              .map(function (plugin) {
                                return _.chain(plugin)
                                        .map(function (mimeType) {
                                          return mimeType.type;
                                        })
                                        .value();
                              })
                              .flatten()
                              .compact()
                              .invoke('toLowerCase')
                              .value();

  config = _.extend({
    mimeTypesForOpen: openMimeTypes.mimeTypesForOpen,
    officeMimeTypes: openMimeTypes.officeMimeTypes,
    forceDownloadForMimeTypes: [],
    forceDownloadForAll: false

  }, config);

  config.mimeTypesForOpen = _.invoke(config.mimeTypesForOpen, 'toLowerCase');
  config.officeMimeTypes = _.invoke(config.officeMimeTypes, 'toLowerCase');
  config.forceDownloadForMimeTypes = _.invoke(
      config.forceDownloadForMimeTypes, 'toLowerCase');
  config.mimeTypesForOpen = _.chain(config.mimeTypesForOpen)
                             .concat(mimeTypesFromPlugins)
                             .unique()
                             .invoke('toLowerCase')
                             .value();

  function BrowserPlugin() {
  }

  BrowserPlugin.prototype.getUrl = function (node) {
    return getPageUrl(node);
  };

  BrowserPlugin.isSupported = function (node) {
    var mimeType = node.get('mime_type');
    if (mimeType) {
      mimeType = mimeType.toLowerCase();
      return base.isAppleMobile() ||
             config.mimeTypesForOpen.indexOf(mimeType) >= 0 &&
             config.forceDownloadForMimeTypes.indexOf(mimeType) < 0 &&
             !config.forceDownloadForAll;
    }
  };

  BrowserPlugin.prototype.needsAuthentication = function (node) {
    return true;
  };

  function getPageUrl(node) {
    var download;
    var mimeType = (node.get('mime_type') || '').toLowerCase();
    if (!base.isAppleMobile() 
        && config.officeMimeTypes.indexOf(mimeType) >= 0) {
        download = true;
    }
    var contentUrl = contentHelper.getContentPageUrl(node, { download: !!download });
    return $.Deferred().resolve(contentUrl).promise();
  }

    return BrowserPlugin;
});
