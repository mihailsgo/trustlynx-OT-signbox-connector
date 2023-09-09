/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/lib/backbone",
  "csui/widgets/permissions/permissions.view", "csui/utils/contexts/page/page.context",
  "csui/utils/contexts/factories/node", "csui/utils/contexts/factories/member",
  "./roles.workspace.mock.data.js", 'csui/models/action', 'csui/models/actions',
  "csui/utils/testutils/async.test.utils",
  "csui/lib/jquery.mousehover"
], function ($, _, Marionette, Backbone, PermissionsView, PageContext, NodeModelFactory,
  MemberModelFactory,
  RolesMock, ActionModel, ActionCollection,
  TestUtils) {
    describe("RolesView", function () {
      var context;

      beforeAll(function () {
        RolesMock.enable();
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
        RolesMock.disable();
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
            node1 = context.getModel(NodeModelFactory, { attributes: { id: 1112222, "type": 848, "advanced_versioning": null } });
            authUser = context.getModel(MemberModelFactory, { attributes: { id: 1000 } });
            node1.setExpand('permissions', '1112222');
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
              v1.render();
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

          it("can click on '+' icon to show 'Add role' in add permissions dropdown", function (done) {
            TestUtils.asyncElement($('body'),
              '.csui-add-permission').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  el.trigger('click');
                  done();
                });
          });

          it("check for 'Add role' option in add permissions dropdown", function (done) {
            TestUtils.asyncElement(v1.$el,
              '.csui-add-permissions-content.binf-dropdown.binf-open').done(
                function (dropdown_el) {
                  var el = dropdown_el.find('li');
                  expect(el.length > 0).toEqual(true);
                  for (var i = 0; i < el.length; i++) {
                    var property = el[i].getAttribute("data-csui-command");
                    if (property === "AddOrEditRole") {
                      expect(el[i].firstElementChild.text).toEqual("Add role");
                    }
                  }
                  done();
                });
          });

          it("can open roles wizard on clicking 'Add role' in add permissions dropdown", function (done) {
            TestUtils.asyncElement(v1.$el,
              'li[data-csui-command="AddOrEditRole"]:visible').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  expect(el.find('a').text()).toEqual("Add role");
                  el.find('a').trigger('click');
                  done();
                });
          });

          it("Info: by default Save and Next buttons should be disabled", function (done) {
            TestUtils.asyncElement($("body"),
              '.conws-addoreditrole-dialog .binf-modal-dialog .binf-modal-content .binf-modal-footer').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  expect(el.find('.binf-btn-primary').is(":disabled")).toEqual(true);
                  expect(el.find('.button_image_next').is(":disabled")).toEqual(true);
                  done();
                });
          });

          it("Info: save and next should be enabled on entering the role details", function (done) {
            TestUtils.asyncElement($("body"),
              '.binf-modal-dialog .binf-modal-content .binf-modal-body .conws-addoreditrole-roledetails .conws-addoreditrole-roledetails-body .conws-addoreditrole-roledetails-left .cs-form-create .binf-row .cs-form-doublecolumn  .cs-formfield ').done(
                function (el) {
                  expect(el.length).toBeGreaterThan(0);
                  el.find('input').attr('value', 'Role1');
                  el.find('input').trigger('keyup');
                  el.find('textarea').attr('value', 'Role Description');
                  expect($(document.body).find('.binf-modal-footer .binf-btn-primary').is(":disabled")).toEqual(false);
                  expect($(document.body).find('.binf-modal-footer .button_image_next').is(":disabled")).toEqual(false);
                  done();
                });
          });

          it("can navigate throught the wizard", function (done) {
            TestUtils.asyncElement($("body"),
              '.conws-addoreditrole-dialog .binf-modal-dialog .binf-modal-content .binf-modal-footer').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  el.find('.button_image_next').trigger("click");
                  expect($(document.body).find('.binf-modal-dialog .binf-modal-content .binf-modal-body .conws-addoreditrole-rolepermissions-title').length).toEqual(1);
                  done();
                });
          });

          it("can create a new Role", function (done) {
            TestUtils.asyncElement($("body"),
              '.conws-addoreditrole-dialog .binf-modal-dialog .binf-modal-content .binf-modal-footer').done(
                function (el) {
                  el.find('.binf-btn-primary').trigger("click");
                  expect($(document.body).find('.conws-addoreditrole-dialog .binf-modal-dialog').length).toEqual(0);
                  done();
                });
          });

          xit("can close the wizard on cancel", function () {
            TestUtils.asyncElement($('body'),
              '.cs-permissions .csui-table-list-header .csui-table-header-cell .csui-add-permission').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  el.trigger('click');

                  TestUtils.asyncElement(v1.$el,
                    'li[data-csui-command="AddOrEditRole"]:visible').done(
                      function (el) {
                        expect(el.length).toEqual(1);
                        expect(el.find('a').text()).toEqual("Add role");
                      });
                });

            

            TestUtils.asyncElement(v1.$el,
              '.binf-widgets .binf-modal-footer button[title="Cancel"]').done(
                function (el) {
                  expect(el.length).toEqual(1);
                  el.trigger('click');
                  TestUtils.asyncElement($('body'),
                    '.binf-widgets .conws-addoreditrole-roledetails').done(
                      function (el) {
                        expect(el.length).toEqual(0);
                      });
                });
          });

          xit("can view Edit role, Delete role, Edit role permission actions on hovering over the list item", function (done) {
            var tableRows;
            tableRows = v1.$el.find(".csui-table-list-body .csui-table-body .csui-table-row");
            tableRows.eq(2).trigger(
              { type: "pointerenter", originalEvent: { pointerType: "mouse" } });
            TestUtils.asyncElement(v1.$el,
              ".csui-inlinetoolbar:not('binf-hidden') .csui-table-actionbar ul").done(
                function (el) {
                  expect(el.length).toEqual(1);
                  var editRole = el.find("li[data-csui-command='addoreditrole']");
                  expect(editRole.length).toEqual(1);
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
            tableRows.eq(2).trigger(
              { type: "pointerenter", originalEvent: { pointerType: "mouse" } });
            TestUtils.asyncElement(v1.$el,
              ".csui-inlinetoolbar:not('binf-hidden') .csui-table-actionbar ul").done(
                function (el) {
                  expect(el.length).toEqual(1);
                  var deleteRole = el.find("li[data-csui-command='deleterole']");
                  expect(deleteRole.length).toEqual(1);
                  deleteRole.trigger("click");
                  done();
                });
          });

          xit("can view Edit role permission tooltip on clicking Edit role permission icon", function (done) {
            var tableRows;
            tableRows = v1.$el.find(".csui-table-list-body .csui-table-body .csui-table-row");
            tableRows.eq(2).trigger(
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

          xit("can view Edit role wizard on clicking Edit role icon", function (done) {
            var tableRows;
            tableRows = v1.$el.find(".csui-table-list-body .csui-table-body .csui-table-row");
            tableRows.eq(2).trigger(
              { type: "pointerenter", originalEvent: { pointerType: "mouse" } });
            TestUtils.asyncElement(v1.$el,
              ".csui-inlinetoolbar:not('binf-hidden') .csui-table-actionbar ul").done(
                function (el) {
                  expect(el.length).toEqual(1);
                  var editRole = el.find("li[data-csui-command='addoreditrole']");
                  expect(editRole.length).toEqual(1);
                  editRole.trigger("click");
                  expect(document.activeElement !== editRole).toBe(true);
                  done();
                });
          });
        });
      });
    });
  });