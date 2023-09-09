csui.define([
  'csui/lib/jquery.mockjax', 'json!./show.wksp.in.form.data.json'
], function (
  mockjax, mockjson) {
    'use strict';

  var mocks          = [];
  var mock = {

    enable: function () {
      //http://vmstg-dev3/OTCS/llisapi.dll/api/v2/nodes/431473?actions=docpreview&actions=default&actions=open&actions=download&actions=initiateworkflow&actions=openform&actions=browse&fields=properties
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/431473?*',
        responseText: mockjson.response_workspace_431473
      }));
      //http://vmstg-dev3/OTCS/llisapi.dll/api/v2/nodes/413777?actions=docpreview&actions=default&actions=open&actions=download&actions=initiateworkflow&actions=openform&actions=browse&fields=properties
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/413777?*',
        responseText: mockjson.response_workspace_413777
      }));
      //http://vmstg-dev3/OTCS/llisapi.dll/api/v2/nodes/413556?actions=docpreview&actions=default&actions=open&actions=download&actions=initiateworkflow&actions=openform&actions=browse&fields=properties
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/413556?*',
        responseText: mockjson.response_workspace_413556
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/search',
        data: function(data) {
          // test cases must set onSearchRequest method before each search
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
