csui.define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/jquery.parse.param',
  'csui/lib/jquery.mockjax',
  'conws/utils/test/testutil',
  'json!./search.data.json'
], function (require, _, $, parseParam, mockjax,
  TestUtil,
  mockjson) {
    'use strict';

  var mocks          = [];
  return {

    enable: function () {
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/nodes/2513449?fields=properties&fields=versions%7Bowner_id%7D.element(0)&fields=columns&expand=properties%7Breserved_user_id%2Creserved_user_id%7D&state=&metadata=&perspective=&actions=delete&actions=deleterelateditem&actions=add-relitem&actions=editpermissions&actions=addcategory&actions=addversion&actions=default&actions=open&actions=browse&actions=copy&actions=download&actions=ZipAndDownload&actions=edit&actions=editactivex&actions=editofficeonline&actions=editwebdav&actions=favorite&actions=nonfavorite&actions=rename&actions=move&actions=permissions&actions=properties&actions=favorite_rename&actions=reserve&actions=unreserve&actions=description&actions=thumbnail&actions=savefilter&actions=collectionCanCollect&actions=removefromcollection&actions=comment&actions=BOAttachmentsCreate&actions=EACRefresh&actions=EACBack",
        //url: "//server/otcs/cs/api/v2/nodes/2513449?fields=properties&fields=versions%7Bowner_id%7D.element(0)&fields=columns&expand=properties%7Breserved_user_id%7D&state=&metadata=&perspective=&actions=addcategory&actions=addversion&actions=default&actions=open&actions=browse&actions=copy&actions=delete&actions=download&actions=ZipAndDownload&actions=edit&actions=editactivex&actions=editofficeonline&actions=editwebdav&actions=favorite&actions=nonfavorite&actions=rename&actions=move&actions=permissions&actions=properties&actions=favorite_rename&actions=reserve&actions=unreserve&actions=description&actions=thumbnail&actions=savefilter&actions=editpermissions&actions=collectionCanCollect&actions=removefromcollection&actions=add-relitem-test",
        url: new RegExp('^//server/otcs/cs/api/v2/nodes/2513449\\?.*&actions=add-relitem-test'),
        responseText: mockjson.node1response
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=1&sort=asc_name&where_workspace_type_ids=%7B101%7D&where_rel_type=child&global_metadata",
        //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist?action=properties-properties&expand_users=true&fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&limit=10&page=1&sort=asc_name&where_workspace_type_ids=%7B101%7D&where_rel_type=child&global_metadata",
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist\\?.*&limit=10&page=1&sort=asc_name&.*&where_rel_type=child&global_metadata'),
        response: function (options) {
          TestUtil.assertWkspMockConsistency(options.url,mockjson.page1response,'page1response');
          this.status = 200;
          this.responseText = mockjson.page1response;
        }
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/members/favorites/tabs?fields=properties&sort=order",
        url: "//server/otcs/cs/api/v2/members/favorites/tabs?fields=properties&sort=order",
        responseText: mockjson.favorites1response
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/members/favorites?fields=properties&fields=favorites%7Bname%2Ctab_id%7D&fields=versions%7Bmime_type%2Cowner_id%7D.element(0)&expand=properties%7Boriginal_id%2Cparent_id%2Creserved_user_id%2Ccustom_view_search%7D&state=&actions=addcategory&actions=addversion&actions=default&actions=open&actions=browse&actions=copy&actions=delete&actions=download&actions=ZipAndDownload&actions=edit&actions=editactivex&actions=editofficeonline&actions=editwebdav&actions=favorite&actions=nonfavorite&actions=rename&actions=move&actions=permissions&actions=properties&actions=favorite_rename&actions=reserve&actions=unreserve&actions=description&actions=thumbnail&actions=savefilter&actions=editpermissions&actions=collectionCanCollect&actions=removefromcollection&actions=deleterelateditem&actions=add-relitem&actions=BOAttachmentsCreate&actions=EACRefresh&actions=EACBack&actions=comment&sort=order",
        //url: "//server/otcs/cs/api/v2/members/favorites?fields=properties&fields=favorites%7Bname%2Ctab_id%7D&fields=versions%7Bmime_type%2Cowner_id%7D.element(0)&expand=properties%7Boriginal_id%2Cparent_id%2Creserved_user_id%2Ccustom_view_search%7D&state=&actions=addcategory&actions=addversion&actions=default&actions=open&actions=browse&actions=copy&actions=delete&actions=download&actions=ZipAndDownload&actions=edit&actions=editactivex&actions=editofficeonline&actions=editwebdav&actions=favorite&actions=nonfavorite&actions=rename&actions=move&actions=permissions&actions=properties&actions=favorite_rename&actions=reserve&actions=unreserve&actions=description&actions=thumbnail&actions=savefilter&actions=editpermissions&actions=collectionCanCollect&actions=removefromcollection&actions=add-relitem-test&sort=order",
        url: new RegExp('^//server/otcs/cs/api/v2/members/favorites\\?.*'),
        responseText: mockjson.favorites2response
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=5&sort=asc_name&where_workspace_type_ids=%7B101%7D&where_rel_type=child&global_metadata",
        //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist?action=properties-properties&expand_users=true&fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&limit=10&page=5&sort=asc_name&where_workspace_type_ids=%7B101%7D&where_rel_type=child&global_metadata",
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist\\?.*&limit=10&page=5&.*'),
        response: function (options) {
          TestUtil.assertWkspMockConsistency(options.url,mockjson.page5response,'page5response');
          this.status = 200;
          this.responseText = mockjson.page5response;
        },
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=1&sort=asc_name&where_workspace_type_ids=%7B101%7D&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata",
        //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist?action=properties-properties&expand_users=true&fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&limit=10&page=1&sort=asc_name&where_workspace_type_ids=%7B101%7D&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata",
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist\\?.*&limit=10&page=1&sort=asc_name&.*&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata'),
        response: function (options) {
          TestUtil.assertWkspMockConsistency(options.url,mockjson.searchDEresponse,'searchDEresponse');
          this.status = 200;
          this.responseText = mockjson.searchDEresponse;
        }
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=1&sort=asc_wnf_att_yw39_6&where_workspace_type_ids=%7B101%7D&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata",
        //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=1&sort=asc_wnf_att_yw39_6&where_workspace_type_ids=%7B101%7D&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata",
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist\\?.*&limit=10&page=1&sort=asc_wnf_att_yw39_6&.*&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata'),
        response: function (options) {
          TestUtil.assertWkspMockConsistency(options.url,mockjson.searchDEASCresponse,'searchDEASCresponse');
          this.status = 200;
          this.responseText = mockjson.searchDEASCresponse;
        }
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=1&sort=desc_wnf_att_yw39_6&where_workspace_type_ids=%7B101%7D&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata",
        //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=1&sort=desc_wnf_att_yw39_6&where_workspace_type_ids=%7B101%7D&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata",
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist\\?.*&limit=10&page=1&sort=desc_wnf_att_yw39_6&.*&where_rel_type=child&where_wnf_att_yw39_7=contains_DE&global_metadata'),
        response: function (options) {
          TestUtil.assertWkspMockConsistency(options.url,mockjson.searchDEDESCresponse,'searchDEDESCresponse');
          this.status = 200;
          this.responseText = mockjson.searchDEDESCresponse;
        }
      }));
      mocks.push(mockjax({
        //url: "http://ecmlink20dev.eng-muc.opentext.net/otcs/llisapi.dll/api/v2/businessworkspaces/2513449/relateditemspicklist?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&expand_users=true&limit=10&page=1&sort=desc_wnf_att_yw39_6&where_workspace_type_ids=%7B101%7D&where_rel_type=child&global_metadata",
        //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist?action=properties-properties&expand_users=true&fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&limit=10&page=1&sort=desc_wnf_att_yw39_6&where_workspace_type_ids=%7B101%7D&where_rel_type=child&global_metadata",
        url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditemspicklist\\?.*&limit=10&page=1&sort=desc_wnf_att_yw39_6&.*&where_rel_type=child&global_metadata'),
        response: function (options) {
          TestUtil.assertWkspMockConsistency(options.url,mockjson.searchDEDESCresponse,'searchDEDESCresponse');
          this.status = 200;
          this.responseText = mockjson.searchDEDESCresponse;
        }
      }));
    },

    disable: function () {
      var mock;
      while ((mock = mocks.pop()) != null) {
        mockjax.clear(mock);
      }
    },

    columns: mockjson.columns,
    customTableColumns: mockjson.customTableColumns

  };

});
