/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url'
], function (module, _, $, Url) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
    .config['csui/utils/commands/open'] || {};

  config = _.extend({
    isWebViewerConfigured: false,
    supportedWebViewerMimeTypes: [],
  }, config);

  config = _.extend(config, module.config());

  config.supportedWebViewerMimeTypes = _.invoke(
    config.supportedWebViewerMimeTypes, 'toLowerCase');

  function WebViewerPlugin() {}

  WebViewerPlugin.prototype.getUrl = function (node) {
    var url, error;
    var query = '';
    var apiBase = node.connector.getConnectionUrl().getApiBase('v2');
    var version = node.get('version_number');
    if (version) {
      query = Url.combineQueryString({
        version: version
      });
    }
    var restUrl = Url.appendQuery(Url.combine(apiBase, 'externalviewer/webviewer/' +
      node.get('id') + '/viewerconfig'), query);
    node.connector.makeAjaxCall({
      url: restUrl,
      type: 'GET',
      async: false
    }).done(function (data, textStatus, jqXHR) {
      url = data.url + 'xml=' + data.xml;
    }).fail(function (jqXHR, textStatus, errorThrown) {
      error = errorThrown;
    });
    if (url) {
      return $.Deferred().resolve(url).promise();
    } else {
      return $.Deferred().reject(error).promise();
    }
  };

  WebViewerPlugin.prototype.needsAuthentication = function (node) {
    return true;
  };

  WebViewerPlugin.isSupported = function (node) {
    var isSupported = false;
    var mimeType = node.get('mime_type');

    isSupported = mimeType && config.isWebViewerConfigured &&
      config.supportedWebViewerMimeTypes.indexOf(mimeType.toLowerCase()) >= 0;

    if (isSupported) {
      isSupported = false;
      var query = '';
      var apiBase = node.connector.getConnectionUrl().getApiBase('v2');
      var version = node.get('version_number');
      if (version) {
        query = Url.combineQueryString({
          version: version
        });
      }
      var url = Url.appendQuery(Url.combine(apiBase, 'externalviewer/webviewer/' +
        node.get("id") + '/enabledstatus'), query);
      node.connector.makeAjaxCall({
        url: url,
        type: 'GET',
        async: false
      }).done(function (response, statusText, jqxhr) {
        if (response && response.enabledStatus) {
          isSupported = true;
        } else {
          isSupported = false;
        }
      });
    }
    return isSupported;
  };

  return WebViewerPlugin;
});