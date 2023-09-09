/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/jquery.parse.param',
  'csui/lib/jquery.mockjax', 'json!./workspace.navigation.tree.plugin.data.json'
], function (require, _, $, parseParam, mockjax, mockjson) {
    'use strict';

  var mocks          = [];
  return {

    enable: function () {
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/members/favorites(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_favorites
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/30592/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_outside
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98022/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_workspace
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98026/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_intermediate
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98028/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_parent
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98024/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_subfolder
      }));
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/98022(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/actions',
        type: 'post',
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace_actions
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    },

  };

});
