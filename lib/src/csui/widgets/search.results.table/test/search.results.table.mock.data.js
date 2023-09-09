/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/jquery.mockjax',  'json!./search.results.table.mock.json'], function (mockjax, mockData) {

    var mocks = [];
  
    return {
  
      enable: function () {
        mocks.push(mockjax({
          url: '//server/otcs/cs/api/v2/search',
          responseTime: 0,
          responseText: mockData.searchData
        }));
  
        mocks.push(mockjax({
          url: new RegExp('^//server/otcs/cs/api/v2/nodes/actions(?:\\?(.*))?$'),
          urlParams: ['query'],
          responseText: {}
        }));

        mocks.push(mockjax({
          url: '//server/otcs/cs/api/v2/search/template/*',
          type: 'GET',
          responseText: mockData.search_template
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
  