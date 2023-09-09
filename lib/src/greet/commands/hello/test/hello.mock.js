/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax', 'csui/lib/jquery.parse.param',
  'json!./hello.data.json'
], function (mockjax, parseParam, mockData) {
  'use strict';

  var mocks = [];

  return {

    enable: function () {

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/([^/?]+)(?:\\?(.*))?$'),
        urlParams: ['nodeId', 'query'],
        type: 'GET',
        response: function (settings) {
          var nodeId = +settings.urlParams.nodeId,
              node = mockData.nodes[nodeId];

          this.responseText = {
            data: node
          };
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
