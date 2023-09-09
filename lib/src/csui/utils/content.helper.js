/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/utils/url', 'csui/models/version'
], function (_, Url, VersionModel) {
  'use strict';

  function getContentPageUrl (node, options) {
    options || (options = {});
    var cgiUrl = new Url(node.connector.connection.url).getCgiScript();
    var urlQuery = {
      func: 'doc.fetchcsui',
      nodeid: node.get('id')
    };
    if (options.download) {
      urlQuery = _.extend(urlQuery, { action: 'download' });
    }
    if (node instanceof VersionModel || node.get('version_number')) {
      urlQuery.vernum = node.get('version_number');
    }
    return Url.appendQuery(cgiUrl, Url.combineQueryString(urlQuery));
  }

  return {
    getContentPageUrl: getContentPageUrl
  };
});
