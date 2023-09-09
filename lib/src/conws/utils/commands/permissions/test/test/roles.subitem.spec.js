/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/lib/backbone",
  "csui/widgets/permissions/permissions.view", "csui/utils/contexts/page/page.context",
  "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/member",
  "./roles.subitem.mock.data.js", 'csui/models/action', 'csui/models/actions',
  "csui/utils/testutils/async.test.utils",
  "conws/utils/test/testutil",
  "csui/lib/jquery.mousehover"
], function ($, _, Marionette, Backbone, PermissionsView, PageContext, NodeModelFactory,
  MemberModelFactory,
  SubItemRolesMock, ActionModel, ActionCollection,
  TestUtils, TestUtil) {
    xdescribe("RolesView for subitem - Document", function () {
      var context;

      beforeAll(function () {
        SubItemRolesMock.enable();
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
        SubItemRolesMock.disable();
        TestUtils.restoreEnvironment();
      });

      describe("For user with add/edit role rights", function () {
        var userWithEditPermissionRights;
        beforeAll(function () {
          userWithEditPermissionRights = 1000;
        });

        describe("Following actions can be performed", function () {
          var v1, node1, region1, permissionTableBody, permissionTableRows, ownerRow, userGroup,
            authUser;
          beforeAll(function (done) {
            node1 = context.getModel(NodeModelFactory, { attributes: { id: 1112226, "type": 144 } });
            authUser = context.getModel(MemberModelFactory, { attributes: { id: 1000 } });
            node1.setExpand('permissions', '1112226');
            var actionModel = new ActionModel({
              method: "GET",
              name: "permissions",
              signature: "permissions"
            }),
              actionModel1 = new ActionModel({
                method: "GET",
                name: "editpermissions",
                signature: "editpermissions"
              });
            node1.actions = new ActionCollection([actionModel, actionModel1]);
            authUser.fetch().always(function () {
              v1 = new PermissionsView({
                context: context,
                model: node1,
                authUser: authUser
              });
              region1 = new Marionette.Region({
                el: $('<div id="permissions-view1"></div>').appendTo(document.body)
              });
              region1.show(v1);
              TestUtils.asyncElement(v1.$el, '.csui-table-list-body:visible').done(function () {
                permissionTableBody = v1.$el.find(".csui-table-list-body");
                permissionTableRows = permissionTableBody.find(".csui-table-row");
                done();
              });
            });
          });

          afterAll(function () {
            node1.destroy();
            v1.destroy();
            $('#permissions-view1').remove();
          });

          it("view can be instantiated", function () {
            expect(v1).toBeDefined();
            expect(v1.$el.length > 0).toBeTruthy();
            expect(v1.el.childNodes.length > 0).toBeTruthy();
            expect(v1.$el.attr('class')).toContain('cs-permissions');
          });

          it("can click on '+' icon but cannot view 'Add role' in add permissions dropdown", function (done) {
            TestUtils.asyncElement($('body'),
              '.cs-permissions .csui-table-list-header .csui-table-header-cell .csui-add-permission').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  el.trigger('click');
                  TestUtils.asyncElement(v1.$el,
                    'li').done(
                      function (el) {
                        expect(el.length > 0).toEqual(true);
                        for (var i = 0; i < el.length; i++) {
                          var property = el[i].getAttribute("data-csui-command");
                          expect(property === "AddOrEditRole").toBeFalsy();
                        }
                        var body = $('body').trigger("click");
                        done();
                      });
                });
          });

          xit("cannot view Edit role but can view Remove role, Edit role permission actions on hovering over the list item", function (done) {
            var tableRows;
            tableRows = v1.$el.find(".csui-table-list-body .csui-table-body .csui-table-row");
            tableRows.eq(1).trigger(
              { type: "pointerenter", originalEvent: { pointerType: "mouse" } });
            TestUtils.asyncElement(v1.$el,
              ".csui-inlinetoolbar .csui-table-actionbar ul").done(
                function (el) {
                  expect(el.length).toEqual(1);
                  var editRole = el.find("li[data-csui-command='addoreditrole']");
                  expect(editRole.length).toEqual(0);
                  var deleteRole = el.find("li[data-csui-command='deleterole']");
                  expect(deleteRole.length).toEqual(1);
                  var editRolePermissions = el.find("li[data-csui-command='editrolepermission']");
                  expect(editRolePermissions.length).toEqual(1);
                  done();
                });
          });

          xit("can Delete role on clicking Delete role icon", function (done) {
            var tableRows;
            tableRows = v1.$el.find(".csui-table-list-body .csui-table-body .csui-table-row");
            tableRows.eq(1).trigger(
              { type: "pointerenter", originalEvent: { pointerType: "mouse" } });
            TestUtils.asyncElement(v1.$el,
              ".csui-inlinetoolbar .csui-table-actionbar ul").done(
                function (el) {
                  expect(el.length).toEqual(1);
                  var deleteRole = el.find("li[data-csui-command='deleterole']");
                  expect(deleteRole.length).toEqual(1);
                  deleteRole.trigger("click");
                  expect(deleteRole.length).toEqual(0);
                  done();
                });
          });

          xit("can view Edit role permission tooltip on clicking Edit role permission icon", function (done) {
            var tableRows;
            tableRows = v1.$el.find(".csui-table-list-body .csui-table-body .csui-table-row");
            tableRows.eq(1).trigger(
              { type: "pointerenter", originalEvent: { pointerType: "mouse" } });
            TestUtils.asyncElement(v1.$el,
              ".csui-inlinetoolbar:not('binf-hidden') .csui-table-actionbar ul").done(
                function (el) {
                  expect(el.length).toEqual(1);
                  var editRolePermissions = el.find("li[data-csui-command='editrolepermission']");
                  expect(editRolePermissions.length).toEqual(1);
                  editRolePermissions.trigger("click");
                  expect(document.activeElement !== editRolePermissions).toBe(true);
                  done();
                });
          });
        });
      });
    });
  });