/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax'
], function (MockJax) {
  var mocks = [];

  return {
    enable: function () {
      mocks.push(MockJax({
        url: "//server/otcs/cs/api/v2/xecmauthentication/getusertoken",
        responseText: {
            ok: true,
            statusCode: 200,
            token: "dummyToken"
          }
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop())) {
        MockJax.clear(mock);
      }
    }
  };
});