/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/jquery.mockjax',  'json!./search.results.tile.mock.json'],
function (mockjax, mockData) {

    var mocks = [];

    return {

      enable: function () {
        mocks.push(mockjax({
          url: '//server/otcs/cs/api/v2/search',
          responseTime: 0,
          responseText: mockData.searchData
        }));
        mocks.push(mockjax({
          url: '//server/otcs/cs/api/v2/nodes/actions',
          responseTime: 0,
          responseText: mockData.actions
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
