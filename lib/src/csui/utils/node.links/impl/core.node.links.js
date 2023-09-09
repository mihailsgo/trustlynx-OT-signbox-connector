/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/url',
  'csui/models/version'
], function (Url, VersionModel) {
  'use strict';

  return [
    {
      equals: {
        type: 140
      },
      getUrl: function (node) {
        return node.get('url');
      }
    },
    {
      equals: {
        type: 258
      },
      getUrl: function (node) {
        return Url.combine('search/query_id/', node.get('id'));
      }
    },
    {
      sequence: 1000,
      getUrl: function (node) {
        return Url.combine('nodes/', node.get('id'));
      }
    },
    {
      equals: {
        type: 144
      },
      getUrl: function (node) {
        var url = Url.combine('nodes/', node.get('id'));
        if(node instanceof VersionModel) {
          var versionNumber = node.get('version_number');
          url = Url.combine(url, 'versions/' + versionNumber);
        }
        return url;
      }
    },
    {
      equals: {
        type: 292
      },
      getUrl: function (node) {
        return Url.combine('searchtemplates/', node.get('id'));
      }
    },
  ];
});
