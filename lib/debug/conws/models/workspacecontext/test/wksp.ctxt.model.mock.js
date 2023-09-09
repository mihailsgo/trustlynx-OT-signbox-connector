//'json!./search.data.json'
csui.define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/jquery.parse.param',
  'csui/lib/jquery.mockjax', 'json!./wksp.ctxt.model.data.json'
], function (require, _, $, parseParam, mockjax, mockjson) {
    'use strict';

  var mocks          = [];
  return {

    enable: function () {
      mocks.push(mockjax({
        //url: '//server/otcs/cs/api/v2/nodes/98015?actions=default&actions=open&actions=initiateworkflow&actions=openform&actions=browse&fields=properties&fields=versions%7Bowner_id%7D.element(0)&fields=columns&fields=bwsinfo&fields=external_source&fields=followups&expand=properties%7Breserved_user_id%2Creserved_user_id%7D&expand=external_source&state=&metadata=&perspective='
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/98015(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace_1
      }));
      mocks.push(mockjax({
        //url: '//server/otcs/cs/api/v2/nodes/98022?actions=move&actions=delete&actions=deleterelateditem&actions=add-relitem&actions=editpermissions&actions=addcategory&actions=addversion&actions=default&actions=open&actions=browse&actions=copy&actions=download&actions=ZipAndDownload&actions=edit&actions=editactivex&actions=editofficeonline&actions=editwebdav&actions=favorite&actions=nonfavorite&actions=rename&actions=permissions&actions=properties&actions=favorite_rename&actions=reserve&actions=unreserve&actions=description&actions=docpreview&actions=thumbnail&actions=savefilter&actions=collectionCanCollect&actions=removefromcollection&actions=versionscontrol&fields=bwsinfo&fields=properties&fields=versions%7Bowner_id%7D.element(0)&expand=properties%7Boriginal_id%7D&state='
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/98022(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace_2
      }));
      $.mockjax(function( requestSettings ) {
        if ( requestSettings.method==='POST' && requestSettings.url === '//server/otcs/cs/api/v2/nodes/actions' ) {
          if (requestSettings.data && requestSettings.data.body) {
            if (requestSettings.data.body.indexOf('{"reference_id":98015,"ids":[98015],"actions":')===0) {
              // We have a match in method, url and request body, so we return a response callback.
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
              // We have a match in method, url and request body, so we return a response callback.
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
