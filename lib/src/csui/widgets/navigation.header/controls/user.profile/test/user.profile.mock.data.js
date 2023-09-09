/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/jquery.mockjax'], function ($, mockjax) {

  var DataManager = function DataManager() {
    },
    test1Mocks = [],
    test2Mocks = [],
    test3Mocks = [],
    test4Mocks = [];


  DataManager.test1 = {

    enable: function () {
      test1Mocks.push(mockjax({
        url: new RegExp('^//server/otcs1/cs/api/v1/auth(.*)$'),
        responseText: {
          "data": {
            "id": 1000,
            "name": "userName",
            "first_name": 'fstName',
            "last_name": 'lstName',
            ticket: '1234567890'
          }
        }
      }));
      test1Mocks.push(mockjax({
        url: new RegExp('^//server/otcs1/cs/api/v2/search'),
        urlParams: ['members/info'],
        responseTime: 5,
        contentType: 'application/json',
        dataType: 'json',
        responseText: {
          "links": {
              "data": {
                  "self": {
                      "body": "",
                      "content_type": "",
                      "href": "/api/v2/search/members/info",
                      "method": "GET",
                      "name": ""
                  }
              }
          },
          "results": {
              "personal_search_forms": [],
              "recent_search_forms": [
                  {
                      "accessed": "2020-08-24T00:44:43",
                      "id": 33962023,
                      "name": "TestForm"
                  },
                  {
                      "accessed": "2020-08-24T00:02:28",
                      "id": 38989362,
                      "name": "complex search form"
                  },
                  {
                      "accessed": "2020-08-23T23:55:22",
                      "id": 28949772,
                      "name": "000-LLAE603"
                  },
                  {
                      "accessed": "2020-08-23T23:55:11",
                      "id": 16419169,
                      "name": "CVS2"
                  },
                  {
                      "accessed": "2020-08-23T23:54:51",
                      "id": 16329299,
                      "name": "CVS"
                  }
              ],
              "slices": [
                  {
                      "id": "20485538",
                      "name": "Admin_folders",
                      "selected": false
                  },
                  {
                      "id": "39532053",
                      "name": "Enterprise",
                      "selected": true
                  },
                  {
                      "id": "39532056",
                      "name": "Enterprise [All Versions]",
                      "selected": false
                  },
                  {
                      "id": "5133299",
                      "name": "Only documents",
                      "selected": false
                  },
                  {
                      "id": "33962352",
                      "name": "TestSlice",
                      "selected": false
                  }
              ],
              "system_search_forms": [
                  {
                      "id": 33953110,
                      "name": "Test",
                      "read_only": false
                  },
                  {
                      "id": 33943870,
                      "name": "Vineeth-search-form",
                      "read_only": false
                  },
                  {
                      "id": 38543959,
                      "name": "Address search",
                      "read_only": false
                  },
                  {
                      "id": 33962023,
                      "name": "TestForm",
                      "read_only": false
                  },
                  {
                      "id": 28293163,
                      "name": "Admin - Default",
                      "read_only": false
                  },
                  {
                      "id": 44928846,
                      "name": "testFormAdmin",
                      "read_only": false
                  },
                  {
                      "id": 35086427,
                      "name": "testpnk",
                      "read_only": false
                  },
                  {
                      "id": 38331911,
                      "name": "pippodippo search form",
                      "read_only": false
                  },
                  {
                      "id": 38327841,
                      "name": "pippo Search Form",
                      "read_only": false
                  },
                  {
                      "id": 38989362,
                      "name": "complex search form",
                      "read_only": false
                  },
                  {
                      "id": 38633981,
                      "name": "pippo Search for - advanced",
                      "read_only": false
                  },
                  {
                      "id": 38787771,
                      "name": "TestSearchForm",
                      "read_only": false
                  }
              ]
          }
      },

      }));

    },

    disable: function () {
      var mock;
      while ((mock = test1Mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }

  };

  DataManager.test2 = {

    enable: function () {
      test2Mocks.push(mockjax({
        url: new RegExp('^//server/otcs2/cs/api/v1/auth(.*)$'),
        responseText: {
          "data": {
            "id": 1000,
            "name": "userName",
            "first_name": 'fstName',
            "last_name": '',
            ticket: '1234567890'
          }
        }
      }));
    },

    disable: function () {
      var mock;
      while ((mock = test2Mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }

  };

  DataManager.test3 = {

    enable: function () {
      test3Mocks.push(mockjax({
        url: new RegExp('^//server/otcs3/cs/api/v1/auth(.*)$'),
        responseText: {
          "data": {
            "id": 1000,
            "name": "userName",
            "first_name": '',
            "last_name": 'lstName',
            ticket: '1234567890'
          }
        }
      }));
    },

    disable: function () {
      var mock;
      while ((mock = test3Mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }

  };

  DataManager.test4 = {

    enable: function () {
      test4Mocks.push(mockjax({
        url: new RegExp('^//server/otcs4/cs/api/v1/auth(.*)$'),
        responseText: {
          "data": {
            "id": 1000,
            "name": "userName",
            "first_name": '',
            "last_name": '',
            ticket: '1234567890'
          }
        }
      }));
    },

    disable: function () {
      var mock;
      while ((mock = test4Mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    }

  };

  DataManager.mockData = [
    {
      fstName: 'fstName',
      lstName: 'lstName',
      userName: 'userName',
      status: 'start',
      url: '//server/otcs1/cs/api/v1/auth',
      test: DataManager.test1
    },

    {
      fstName: 'fstName',
      lstName: '',
      userName: 'userName',
      status: 'start',
      url: '//server/otcs2/cs/api/v1/auth',
      test: DataManager.test2
    },
    {
      fstName: '',
      lstName: 'lstName',
      userName: 'userName',
      status: 'start',
      url: '//server/otcs3/cs/api/v1/auth',
      test: DataManager.test3
    },
    {
      fstName: '',
      lstName: '',
      userName: 'userName',
      status: 'start',
      url: '//server/otcs4/cs/api/v1/auth',
      test: DataManager.test4
    }

  ];


  return DataManager;
});
