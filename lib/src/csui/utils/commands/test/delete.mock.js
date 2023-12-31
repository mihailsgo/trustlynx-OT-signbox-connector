/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax'], function (mockjax) {
  'use strict';

  var mocks = [];

  return {

    enable: function () {
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/auth?perspective=true',
        responseText: {
          "data": {
            "id": 1000,
            "name": "Admin"
          }
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/nodes/2000(\\?.*)?$'),
        responseText: {
          id: 2000,
          name: 'Test'
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/4000(\\?.*)?$'),
        responseText: {
          id: 4000,
          name: 'Parent Node'
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/5000(\\?.*)?$'),
        responseText: {
          id: 5000,
          name: 'History Node'
        }
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
