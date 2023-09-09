/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax', 'json!./mock.params.json'], function (mockjax, mockParamsJson) {

  var mocks = [];

  return {

    enable: function () {

      mocks.push(mockjax({
        url: '//server/cgi/cs.exe/api/v1/forms/nodes/run?id=22550',
        responseTime: 100,
        dataType: 'json',
        response: function(){
          this.responseText = mockParamsJson;
        }
      }));

      mocks.push(mockjax({
        url: '//server/cgi/cs.exe/api/v1/auth',
        responseText: {
          "data": {
            "id": 1000,
            "name": "Admin"
          }
        }
      }));

    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop())) {
        mockjax.clear(mock);
      }
    }

  };

});
