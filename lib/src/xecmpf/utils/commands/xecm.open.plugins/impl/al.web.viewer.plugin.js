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

  function ALWebViewerPlugin() {}

  ALWebViewerPlugin.prototype.getUrl = function (node) {
    var url, error;
    var query = '';
    var apiBase = node.connector.getConnectionUrl().getApiBase('v2');
    var version = node.get('version_number');
    if (version) {
      query = Url.combineQueryString({
        version: version,
        ignoreEditorRanking: true
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

  ALWebViewerPlugin.prototype.needsAuthentication = function (node) {
    return true;
  };

  ALWebViewerPlugin.isSupported = function (node) {
    var isSupported = false;
    var externalSource = false;
    var mimeType = node.get('mime_type');

    isSupported = mimeType && config.isWebViewerConfigured &&
      config.supportedWebViewerMimeTypes.indexOf(mimeType.toLowerCase()) >= 0;

    if (isSupported) {
      if (node.attributes && node.attributes.data && node.attributes.data["external_source"]) {
        externalSource = node.attributes.data["external_source"];
      }

      if (externalSource && (externalSource === 'sap_al') ){
        isSupported = true;
      } else {
        isSupported = false;
      }
    }

    if (isSupported) {
      isSupported = false;
      var query = '';
      var apiBase = node.connector.getConnectionUrl().getApiBase('v2');
      var version = node.get('version_number');
      if (version) {
        query = Url.combineQueryString({
          version: version,
          ignoreEditorRanking: true,
          ignoreAncestor: true
        });
      } else {
        query = Url.combineQueryString({
          ignoreEditorRanking: true,
          ignoreAncestor: true
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

  return ALWebViewerPlugin;
});