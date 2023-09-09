/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery.mockjax'
], function (mockjax) {
    'use strict';

  var mocks          = [];
  return {

    enable: function () {
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/members/preferences?metadata=true&config_name=SmartUI',
        responseText: {
          "links": {
              "data:": {
                "self": {
                    "body": "",
                    "content_type": "",
                    "href": "/api/v2/members/preferences?config_name=SmartUI&metadata",
                    "method": "GET",
                    "name": ""
                }
            }
          },
          "results":[{
              "data": {
                  "config_name": "SmartUI",
                  "preferences":{
                    "accessibleMode": "false",
                    "conwsNavigationTreeView": "false",
                    "conws_navigationTreeView": "true",
                    "navigationMode": "false"
                  }
                },
                "metadata":{}
            }
          ]
        }
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/members/preferences',
        type:'PUT',
        responseText: {
          "links": {
              "data:": {
                "self": {
                    "body": "",
                    "content_type": "",
                    "href": "/api/v2/members/preferences",
                    "method": "PUT",
                    "name": ""
                }
            }
          },
          "results":[{}]
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
