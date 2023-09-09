csui.define(['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/jquery.parse.param',
    'csui/lib/jquery.mockjax',
    'conws/utils/test/testutil',
    'json!./relwkspexpview.data.json'
  ], function (require, _, $, parseParam, mockjax,
    TestUtil,
    mockjson) {
      'use strict';

    var mocks          = [];
    return {

      enable: function () {
        mocks.push(mockjax({
          //url: "http://ecmlink20dev.eng-muc.opentext.net/OTCS/cs.exe/api/v2/businessworkspaces/2513449?metadata&fields=categories&include_icon=true&expand=properties%7Bcreate_user_id%2Cmodify_user_id%2Cowner_group_id%2Cowner_user_id%2Creserved_user_id%7D",
          //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449?metadata&fields=categories&include_icon=true&expand=properties%7Bcreate_user_id%2Cmodify_user_id%2Cowner_group_id%2Cowner_user_id%2Creserved_user_id%7D",
          url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449\\?.*'),
          responseText: mockjson.wksp1response
        }));
        mocks.push(mockjax({
          //url: "http://ecmlink20dev.eng-muc.opentext.net/OTCS/cs.exe/api/v2/businessworkspaces/2513449/relateditems?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&where_workspace_type_id=101&where_relationtype=child&expand_users=true&limit=30&page=1&sort=asc_name&global_metadata",
          //url: "//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditems?fields=properties%7Bwnf_att_yw39_7%2Cwnf_att_yw39_6%2Cwnf_att_yw39_5%2Cwnf_att_yw39_3%2Cwnf_att_yw39_b%2Cwnf_att_yw39_8%2Cwnf_att_yw39_2%2Cwnf_att_yw39_9%2Cwnf_att_yw39_d%2Ctype%2Cname%2Csize%2Cmodify_date%2Cdescription%2Cfavorite%2Cid%2Ccontainer%7D&action=properties-properties&where_workspace_type_id=101&where_relationtype=child&expand_users=true&limit=30&page=1&sort=asc_name&global_metadata",
          url: new RegExp('^//server/otcs/cs/api/v2/businessworkspaces/2513449/relateditems\\?.*&limit=30&page=1&sort=asc_name&.*'),
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
          //url: "//server/otcs/cs/api/v2/members/favorites?fields=properties&fields=favorites%7Bname%2Ctab_id%7D&fields=versions%7Bmime_type%2Cowner_id%7D.element(0)&expand=properties%7Boriginal_id%2Cparent_id%2Creserved_user_id%2Ccustom_view_search%7D&state=&actions=delete&actions=deleterelateditem&actions=add-relitem&actions=editpermissions&actions=addcategory&actions=addversion&actions=default&actions=open&actions=browse&actions=copy&actions=download&actions=ZipAndDownload&actions=edit&actions=editactivex&actions=editofficeonline&actions=editwebdav&actions=favorite&actions=nonfavorite&actions=rename&actions=move&actions=permissions&actions=properties&actions=favorite_rename&actions=reserve&actions=unreserve&actions=description&actions=thumbnail&actions=savefilter&actions=collectionCanCollect&actions=removefromcollection&sort=order",
          url: new RegExp('^//server/otcs/cs/api/v2/members/favorites\\?.*'),
          responseText: mockjson.favorites2response
        }));
      },
  
      disable: function () {
        var mock;
        while ((mock = mocks.pop()) != null) {
          mockjax.clear(mock);
        }
      },
  
      collectionOptions1: mockjson.collectionOptions1,
      expandedViewOptionsData1: mockjson.expandedViewOptionsData1,
      addItem1Attributes: mockjson.addItem1Attributes
  
    };
  
  });
  