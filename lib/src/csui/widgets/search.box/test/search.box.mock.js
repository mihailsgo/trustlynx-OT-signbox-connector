/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/jquery.mockjax','json!./mockedData.json'
], function (_, mockjax, mockdata) {

  var mocks = [];

  return {

    enable: function () {
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/search'),
        urlParams: ['members/info?enterprise_slices=true'],
        responseTime: 5,
        contentType: 'application/json',
        dataType: 'json',
        responseText: {
          "links": {
              "data": {
                  "self": {
                      "body": "",
                      "content_type": "",
                      "href": "/api/v2/search/members/info?enterprise_slices=true",
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
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/searchtemplates/33962023',
        type: 'GET',
        responseText: mockdata.testSearchForm
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/searchtemplates/38989362',
        type: 'GET',
        responseText: mockdata.complexSearchForm
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/searchtemplates/*',
        type: 'GET',
        responseText: mockdata.allSearchForms
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
