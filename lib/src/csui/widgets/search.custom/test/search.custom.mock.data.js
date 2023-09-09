/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/jquery.mockjax', 'csui/lib/jquery.parse.param',
  'json!./mockedData.json'], function ($, mockjax, parseParam, mockData) {

  var mocks           = [],
      resultsNotFound = mockData.resultsNotFound;

  function getData(page, limit) {
    var response = {}, sortedRelevanceData = mockData.searchData.byRelavance;
    response.collection = sortedRelevanceData.collection;
    response.links = sortedRelevanceData.links;
    if (limit > 10) {
      response.results = sortedRelevanceData.resultspage1.concat(
          sortedRelevanceData.resultspage2);
    } else {
      if (page == '1') {
        response.results = sortedRelevanceData.resultspage1;
      } else if (page == '2') {
        response.results = sortedRelevanceData.resultspage2;
      }
    }
    return response;
  }

  return {

    enable: function () {
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/9999/customviewsearchforms',
        responseTime: 0,
        responseText: {
          "data": [
            {
              "id": 8888,
              "priority": null
            }
          ],
          "definitions": {
            "id": {
              "persona": "node",
              "type": 2
            },
            "priority": {
              "type": 2
            }
          }
        }
      }));

      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/multipart/settings',
        responseText: {
          "links": {
            "data": {
              "self": {
                "body": "",
                "content_type": "",
                "href": "\/api\/v2\/multipart\/settings",
                "method": "GET",
                "name": ""
              }
            }
          },
          "results": {
            "data": {
              "is_enabled": true,
              "max_size": 3638558720,
              "min_size": 104857600
            }
          }
        }
      }));
        
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/searchqueries/8888',
        responseTime: 0,
        responseText: mockData.searchQueries1
      }));

      mocks.push(mockjax({
        url: "//server/otcs/cs/api/v1/searchqueries/43995",
        responseTime: 0,
        status: 400,
        responseText: {
          error: "Could not find specified item."
        }
      }));

      mocks.push(mockjax({
        url: "//server/otcs/cs/api/v1/searchqueries/43996",
        responseTime: 0,
        responseText: mockData.searchQueries2
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/search/template/settings/display'),
        responseTime: 0,
        responseText: mockData.displaySettings
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/search/template(.*)'),
        urlParams: ['where', 'actions', 'limit', 'page', 'expand', 'options', 'sort', 'cache_id'],
        response: function (headers) {
          var responseText, urlParam = headers.url.match(/Category_43994__value1=(\w*)/),
              parameters             = parseParam(headers.urlParams.where);
          if (urlParam === null) {
            responseText = {};
          } else {
            responseText = urlParam[1] === 'a' ? getData(parameters.page, parameters.limit) :
                           resultsNotFound;
          }
          this.responseText = responseText;
        }
      }));
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/search'),
        type: 'POST',
        response: function (headers) {
          var responseText, urlParam = headers.data.Category_43994__value1,
              parameters             = headers.data;

          if (urlParam === null) {
            responseText = {};
          } else {
            responseText = urlParam === 'a' ? getData(parameters.page, parameters.limit) :
                           resultsNotFound;
          }
          this.responseText = responseText;
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/members/favorites(\\?.*)?'),
        responseText: {
          results: []
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v1/auth'),
        response: function () {
          this.responseText = [];
        }
      }));

      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/actions'),
        responseTime: 10,
        responseText: mockData.actions
      }));

      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/members/objecttypes',
        responseText: {
          "links": {
            "data": {
              "self": {
                "body": "",
                "content_type": "",
                "href": "/api/v2/members/objecttypes",
                "method": "GET",
                "name": ""
              }
            }
          },
          "results": {
            "data": {
              "objects": [
                {
                  "type": 0,
                  "type_name": "Folder"
                },
                {
                  "type": 1,
                  "type_name": "Shortcut"
                },
                {
                  "type": 2,
                  "type_name": "Generation"
                },
                {
                  "type": 751,
                  "type_name": "Email Folder"
                },
                {
                  "type": 899,
                  "type_name": "Virtual Folder"
                },
                {
                  "type": 258,
                  "type_name": "Search Query"
                }
              ]
            }
          }
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
