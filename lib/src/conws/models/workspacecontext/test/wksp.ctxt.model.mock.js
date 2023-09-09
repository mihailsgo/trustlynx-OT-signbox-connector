/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/jquery.parse.param',
  'csui/lib/jquery.mockjax', 'json!./wksp.ctxt.model.data.json'
], function (require, _, $, parseParam, mockjax, mockjson) {
    'use strict';

  var mocks          = [];
  return {

    enable: function () {
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/98015(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace_1
      }));
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/98022(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace_2
      }));
      $.mockjax(function( requestSettings ) {
        if ( requestSettings.method==='POST' && requestSettings.url === '//server/otcs/cs/api/v2/nodes/actions' ) {
          if (requestSettings.data && requestSettings.data.body) {
            if (requestSettings.data.body.indexOf('{"reference_id":98015,"ids":[98015],"actions":')===0) {
              return {
                response: function( origSettings ) {
                  this.responseText = mockjson.response_nodes_workspace_actions_1;
                }
              };
            }
          }
        }
        return;
      });
      $.mockjax(function( requestSettings ) {
        if ( requestSettings.method==='POST' && requestSettings.url === '//server/otcs/cs/api/v2/nodes/actions' ) {
          if (requestSettings.data && requestSettings.data.body) {
            if (requestSettings.data.body.indexOf('{"reference_id":98022,"ids":[98022],"actions":')===0) {
              return {
                response: function( origSettings ) {
                  this.responseText = mockjson.response_nodes_workspace_actions_2;
                }
              };
            }
          }
        }
        return;
      });
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    },

  };

});
