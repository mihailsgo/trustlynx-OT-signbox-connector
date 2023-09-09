/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'conws/utils/test/testutil',
  'csui/utils/testutils/async.test.utils',
  "xecmpf/widgets/workspaces/workspaces.widget",
  "xecmpf/widgets/integration/folderbrowse/test/fullpage/full.page.workspace.mock",
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/factories/node'
], function ($, TestUtil, AsyncUtils, WorkspacesWidget,
  Mock, PerspectiveContext) {
  'use strict';

  describe('Full page workspace view', function () {
    var context, workspacesWidget;

    beforeAll(function () {
      window.csui.require.config({
        config: {
          'csui/widgets/nodestable/nodestable.view': {
            useAppContainer: true,
            useV2RestApi: true
          }
        }
      });
      Mock.enable();
      $('head').append('<link rel="stylesheet" href="/base/csui/themes/carbonfiber/theme.css">');
      $('body').addClass("binf-widgets");

      $('body').css({
        "margin": 0,
        "height": "100%",
        "overflow-y": "hidden",
        "overflow-x": "hidden",
        "padding-right": "0px !important"
      });

      $('body').append('<div id="widgetWMainWindow" style="height:100vh"></div>');

      context = new PerspectiveContext({
        factories: {
          connector: {
            connection: {
              url: '//server/otcs/cs/api/v1',
              supportPath: '/support',
              session: {
                ticket: 'dummy'
              }
            }
          }
        }
      });
    });

    describe('Rendering the full page workspace', function () {
      it('starts and shows widget', function (done) {
        workspacesWidget = new WorkspacesWidget({
          context: context,
          data: {
            workspaceNodeId: 12066,
            busObjectId: '1001',
            busObjectType: 'Account',
            extSystemId: 'C4C',
            viewMode: {
              mode: 'fullPage'
            },
            navigateMode: 'navigateUp' //navigateUp or treeView
          }
        });

        jasmine.Ajax.withMock(function () { // For faking XMLHttpRequest
          workspacesWidget.show({
            placeholder: '#widgetWMainWindow'
          });
          var request = jasmine.Ajax.requests.mostRecent();
          request.respondWith({
            "status": 200,
            "readyState": 4
          });
          expect(workspacesWidget.region.$el).not.toBeNull();
          AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-perspective-view').done(function () {
            expect(workspacesWidget.region.$el.find('.csui-perspective-view')).not.toBeNull();
            expect(workspacesWidget.region.$el.find('.csui-perspective-view').length).toEqual(1);
            done();
          });
        });
      });

      it('Overview and Documents tab are available', function (done) {
        AsyncUtils.asyncElement(workspacesWidget.region.$el, '.cs-content .tab-links .tab-links-bar > ul').done(function () {
          var tabsLinkBar = workspacesWidget.region.$el.find('.cs-content .tab-links .tab-links-bar > ul');
          var tabs = tabsLinkBar.find('li');
          expect(tabsLinkBar).not.toBeNull();
          expect(tabsLinkBar.length).toBe(1);
          expect(tabs.length).toBe(2);
          expect(tabs.find('a[title=Overview]')).not.toBeNull();
          expect(tabs.find('a[title=Documents]')).not.toBeNull();
          done();
        });
      });
    });

    describe('Navigation available in nodes table', function () {
      it('Nodes table is available with items', function (done) {
        workspacesWidget.region.$el.find('.cs-content .tab-links .tab-links-bar > ul li a[title=Documents]').trigger('click');
        var nodesTable;
        setTimeout(function () {
          AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
            nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
            expect(nodesTable).not.toBeNull();
            expect(nodesTable.find('tbody tr').length).toBe(3);
            done();
          });
        }, 3000);
      });

      it('Navigate inside RelBWS', function (done) {
        workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table tbody tr td.csui-table-cell-name a[title= "Rel BWS"]').trigger('click');
        var nodesTable;
        setTimeout(function () {
          AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
            nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
            expect(nodesTable).not.toBeNull();
            expect(nodesTable.find('tbody tr').length).toBe(1);
            done();
          });
        }, 500);
      });

      it('Navigate Up click', function (done) {

        AsyncUtils.asyncElement(workspacesWidget.region.$el, 'li[data-csui-command="conwsnavigateup"] > a > .csui-icon-v2__conws_action_navigate_up').done(function () {

          var clickel = workspacesWidget.region.$el.find('li[data-csui-command="conwsnavigateup"] > a > .csui-icon-v2__conws_action_navigate_up');
          TestUtil.fireEvents(clickel[0],TestUtil.PointerEvent,['pointerdown']);
          TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mousedown']);
          TestUtil.fireEvents(clickel[0],TestUtil.PointerEvent,['pointerup']);
          TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mouseup','click']);
          var nodesTable;
          setTimeout(function () {
            AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
              nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
              expect(nodesTable).not.toBeNull();
              expect(nodesTable.find('tbody tr').length).toBe(3);
              done();
            })
          }, 500);
        });

      });

      it('Navigate Up long press', function (done) {
        workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table tbody tr td.csui-table-cell-name a[title= "Rel BWS"]').trigger('click');
        AsyncUtils.asyncElement(workspacesWidget.region.$el, 'li[data-csui-command="conwsnavigateup"] > a > .csui-icon-v2__conws_action_navigate_up').done(function () {
          var clickel = workspacesWidget.region.$el.find('li[data-csui-command="conwsnavigateup"] > a > .csui-icon-v2__conws_action_navigate_up');
          TestUtil.fireEvents(clickel[0],TestUtil.PointerEvent,['pointerdown']);
          setTimeout(function(){
            TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mousedown']);
          },5000);
          TestUtil.fireEvents(clickel[0],TestUtil.MouseEvent,['mouseup','click']);
          AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-fixed-submenu').done(function(){
            var popup = workspacesWidget.region.$el.find('.csui-fixed-submenu');
            expect(popup).not.toBeNull();
            var popupItems = popup.find('li');
            expect(popupItems).not.toBeNull();
            expect(popupItems.length).toBe(1);
            expect(popupItems[0].innerText).toEqual('Account 1001');
            popupItems.find('a[role="menuitem"]').trigger('click');
            var nodesTable;
            setTimeout(function () {
              AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
                nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
                expect(nodesTable).not.toBeNull();
                expect(nodesTable.find('tbody tr').length).toBe(3);
                done();
              })
            }, 500);
          });
        });
      });

    });

    describe('Rendering the full page workspace for treeView', function () {
      it('starts and shows widget', function (done) {
        workspacesWidget.region.currentView.destroy();
        workspacesWidget = new WorkspacesWidget({
          context: context,
          data: {
            workspaceNodeId: 12066,
            busObjectId: '1001',
            busObjectType: 'Account',
            extSystemId: 'C4C',
            viewMode: {
              mode: 'fullPage'
            },
            navigateMode: 'treeView' //navigateUp or treeView
          }
        });

        jasmine.Ajax.withMock(function () { // For faking XMLHttpRequest
          workspacesWidget.show({
            placeholder: '#widgetWMainWindow'
          });
          var request = jasmine.Ajax.requests.mostRecent();
          request.respondWith({
            "status": 200,
            "readyState": 4
          });
          expect(workspacesWidget.region.$el).not.toBeNull();
          AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-perspective-view').done(function () {
            expect(workspacesWidget.region.$el.find('.csui-perspective-view')).not.toBeNull();
            expect(workspacesWidget.region.$el.find('.csui-perspective-view').length).toEqual(1);
            done();
          });
        });
      });

      it('Overview and Documents tab are available', function (done) {
        AsyncUtils.asyncElement(workspacesWidget.region.$el, '.cs-content .tab-links .tab-links-bar > ul').done(function () {
          var tabsLinkBar = workspacesWidget.region.$el.find('.cs-content .tab-links .tab-links-bar > ul');
          var tabs = tabsLinkBar.find('li');
          expect(tabsLinkBar).not.toBeNull();
          expect(tabsLinkBar.length).toBe(1);
          expect(tabs.length).toBe(2);
          expect(tabs.find('a[title=Overview]')).not.toBeNull();
          expect(tabs.find('a[title=Documents]')).not.toBeNull();
          done();
        });
      });

      it('verify tree icon', function(done){
        
          workspacesWidget.region.$el.find('.cs-content .tab-links .tab-links-bar > ul li a[title=Documents]').trigger('click');
          var treeIcon;
          AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-navigationToolbar ul > li a[title="Show navigation tree"]').done(function(){
            treeIcon = workspacesWidget.region.$el.find('.csui-navigationToolbar ul > li a[title="Show navigation tree"]');
            expect(treeIcon).not.toBeNull();
            done();
          });
      });

      it('Navigate inside RelBWS', function (done) {
        AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr td.csui-table-cell-name a[title= "Rel BWS"]').done(function(){
          workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table tbody tr td.csui-table-cell-name a[title= "Rel BWS"]').trigger('click');
          var nodesTable;
          setTimeout(function () {
            AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
              nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
              expect(nodesTable).not.toBeNull();
              expect(nodesTable.find('tbody tr').length).toBe(1);
              done();
            });
          }, 500);
        })
      });

      it('open Account Object', function(done) {
         AsyncUtils.asyncElement(workspacesWidget.region.$el, 'table tbody tr td.csui-table-cell-name a[title= "Account 10330"]').done(function () {
            workspacesWidget.region.$el.find('table tbody tr td.csui-table-cell-name a[title= "Account 10330"]').trigger('click');
            var backIcon
            AsyncUtils.asyncElement(workspacesWidget.region.$el, 'a[title= "Account 1001"]').done(function () {
              backIcon = workspacesWidget.region.$el.find('a[title= "Account 1001"]');
              expect(backIcon.length).toBe(1);
              done();
            });
          });
      });

      it('click back button', function(done) {
        AsyncUtils.asyncElement(workspacesWidget.region.$el, 'a[title= "Account 1001"]').done(function () {
          workspacesWidget.region.$el.find('a[title= "Account 1001"]').trigger('click');
          var nodesTable
          AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
              nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
              expect(nodesTable).not.toBeNull();
              expect(nodesTable.find('tbody tr').length).toBe(1);
              done();
          });
        });
      });

    });

    afterAll(function () {
      Mock.disable();
      $('#widgetWMainWindow').remove();
      $("link[href='/base/csui/themes/carbonfiber/theme.css']").remove();
      $('body').empty();
    });
  });
});