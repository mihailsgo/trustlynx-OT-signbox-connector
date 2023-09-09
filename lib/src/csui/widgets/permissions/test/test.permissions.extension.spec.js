/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery",
"csui/lib/underscore",
"csui/lib/marionette",
"csui/lib/backbone",
"csui/widgets/permissions/permissions.view",
"csui/widgets/permissions/impl/permissions.list/toolbaritems",
"csui/utils/contexts/page/page.context",
"csui/utils/contexts/factories/node",
"csui/utils/contexts/factories/member",
"./permissions.mock.data.js",
"./test.permissions.dropdown.menu.items.extension.js",
"./test.permissions.list.toolbaritems.extension.js",
"./test.permissions.lang.js",
'csui/models/action',
'csui/models/actions',
"../../../utils/testutils/async.test.utils.js",
"csui/lib/jquery.mousehover"
], function ($, _, Marionette, Backbone, PermissionsView, PermissionsToolbarItemExtension, PageContext, NodeModelFactory,
    MemberModelFactory,
    PermissionsMock, DropDownExtensionTest, ToolItemExtensionTest, PermissionLangTest, ActionModel, ActionCollection,
    TestUtils) {

    describe("Permissions Extension Test", function () {
        var context;

        beforeAll(function () {
            PermissionsMock.enable();
            context = new PageContext({
                factories: {
                connector: {
                    connection: {
                    url: '//server/otcs/cs/api/v2',
                    supportPath: '/support',
                    session: {
                        ticket: 'dummy'
                    }
                    }
                }
                }
            });
        });

        afterAll(function () {
            TestUtils.cancelAllAsync();

            PermissionsMock.disable();
            TestUtils.restoreEnvironment();
        });

        describe('Dropdown menu items extension test ', function () {

          var permissionsView, nodeModel, region1, permissionTableBody, permissionTableRows,
          authUserModel;

          beforeAll(function (done) {
            nodeModel = context.getModel(NodeModelFactory, {attributes: {id: 11111}});
            authUserModel = context.getModel(MemberModelFactory, {attributes: {id: 1100}});
            var actionModel  = new ActionModel({
                  method: "GET",
                  name: "permissions",
                  signature: "permissions"
                });

            nodeModel.actions = new ActionCollection([actionModel]);

            authUserModel.fetch().always(function () {
              permissionsView = new PermissionsView({
                context: context,
                model: nodeModel,
                authUser: authUserModel
              });
              region1 = new Marionette.Region({
                el: $('<div id="permissions-view1"></div>').appendTo(document.body)
              });
              region1.show(permissionsView);
              TestUtils.asyncElement(permissionsView.$el, '.csui-table-list-body:visible').done(
                  function (el) {
                    permissionTableBody = permissionsView.$el.find(".csui-table-list-body");
                    permissionTableRows = permissionTableBody.find(".csui-table-row");
                    done();
                  });
            });
          });

          afterAll(function () {
            nodeModel.destroy();
            authUserModel.destroy();
            permissionsView.destroy();
            TestUtils.restoreEnvironment();
          });
          xit("should display Add Role from dropdown menu", function (done) {
            TestUtils.asyncElement($('body'),
              '.cs-permissions .cs-permissions-content .cs-permissions-content-header .csui-add-permission').done(
              function (el) {
                expect(el.length).toEqual(1);
                el.trigger('click');
                TestUtils.asyncElement($('body'),
                    ".binf-dropdown.binf-open .binf-dropdown-menu").done(
                    function () {
                      var addGrps = $(
                          ".binf-dropdown-menu li[data-csui-command='AddOrEditRole']").text();
                      expect(addGrps).toBe('Add role');
                      done();
                    });
              });
          });
        });

        describe('ToolItems extension test: ', function () {

          xit("all toolitems from test extension are available", function(){
              var inlineToolbarList = PermissionsToolbarItemExtension.inlineToolbar;
              var itemExists = false;
              _.each(inlineToolbarList.collection.models, function(item){
                  if(item.get("signature") === "DeleteRole"){
                    itemExists = true;
                  }
              });
              expect(itemExists).toBeTruthy();

              itemExists = false;
              _.each(inlineToolbarList.collection.models, function(item){
                if(item.get("signature") === "AddOrEditRole"){
                  itemExists = true;
                }
              });
              expect(itemExists).toBeTruthy();

              itemExists = false;
              _.each(inlineToolbarList.collection.models, function(item){
                if(item.get("signature") === "EditRolePermission"){
                  itemExists = true;
                }
              });
              expect(itemExists).toBeTruthy();
          });
        });

    });
});
