/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery.mockjax', 'json!./show.wksp.in.form.data.json'
], function (
  mockjax, mockjson) {
    'use strict';

  var mocks          = [];
  var mock = {

    enable: function () {
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/431473?*',
        responseText: mockjson.response_workspace_431473
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/413777?*',
        responseText: mockjson.response_workspace_413777
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/413556?*',
        responseText: mockjson.response_workspace_413556
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/search',
        data: function(data) {
          var callback = mock.onSearchRequest;
          delete mock.onSearchRequest;
          var result = callback(data);
          return result===undefined ? true : result;
        },
        responseText: mockjson.response_search_prox
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }

  };

  return mock;

});
