csui.define([
  'csui/lib/jquery.mockjax', 'json!./showinform.data.json'
], function (
  mockjax, mockjson) {
    'use strict';

  var mocks          = [];
  return {

    enable: function () {
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/businessworkspacetypes',
        responseText: mockjson.response_businessworkspacetypes
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }

  };

});
