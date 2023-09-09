//'json!./search.data.json'
csui.define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/jquery.parse.param',
  'csui/lib/jquery.mockjax', 'json!./navigateup.data.json'
], function (require, _, $, parseParam, mockjax, mockjson) {
    'use strict';

  var mocks          = [];
  return {

    enable: function () {
      // Satisfy the favorite star button, which fetches favorite groups in the background.
      mocks.push(mockjax({
        url: new RegExp('^//server/otcs/cs/api/v2/members/favorites(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_favorites
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/30592/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_outside
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98022/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_workspace
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98026/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_intermediate
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98028/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_parent
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v1/nodes/98024/ancestors',
        responseTime: 0,
        responseText: mockjson.response_ancestors_subfolder
      }));
      mocks.push(mockjax({
        //url: '//server/otcs/cs/api/v2/nodes/98022?actions=move&actions=delete&actions=deleterelateditem&actions=add-relitem&actions=editpermissions&actions=addcategory&actions=addversion&actions=default&actions=open&actions=browse&actions=copy&actions=download&actions=ZipAndDownload&actions=edit&actions=editactivex&actions=editofficeonline&actions=editwebdav&actions=favorite&actions=nonfavorite&actions=rename&actions=permissions&actions=properties&actions=favorite_rename&actions=reserve&actions=unreserve&actions=description&actions=docpreview&actions=thumbnail&actions=savefilter&actions=collectionCanCollect&actions=removefromcollection&actions=versionscontrol&fields=properties&fields=versions%7Bowner_id%7D.element(0)&expand=properties%7Boriginal_id%7D&state='
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/98022(\\?.*)?'),
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace
      }));
      mocks.push(mockjax({
        url: '//server/otcs/cs/api/v2/nodes/actions',
        type: 'post',
        responseTime: 0,
        responseText: mockjson.response_nodes_workspace_actions
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    },

  };

});
