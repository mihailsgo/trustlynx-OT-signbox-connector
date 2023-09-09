/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'conws/utils/test/testutil',
	'csui/utils/testutils/async.test.utils',
  "xecmpf/widgets/workspaces/workspaces.widget",
  "xecmpf/widgets/integration/folderbrowse/test/folderbrowse/folder.browse.mock",
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/factories/node'
], function ($, TestUtil, AsyncUtils, WorkspacesWidget,
  Mock, PerspectiveContext) {
  'use strict';

  describe('Folder browse workspace view', function () {
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

    describe('Rendering the folder browse workspace', function () {
			it('starts and shows widget', function (done) {
				workspacesWidget = new WorkspacesWidget({
					context: context,
					data: {
						workspaceNodeId: 12066,
						busObjectId: '1001',
						busObjectType: 'Account',
						extSystemId: 'C4C',
						viewMode: {
							mode: 'folderBrowse'
						},
						navigateMode: 'navigateUp' //navigateUp or treeView
					}
				});

				workspacesWidget.show({
					placeholder: '#widgetWMainWindow'
				});
				var nodesTable;
				AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
					nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
					expect(nodesTable).not.toBeNull();
					expect(nodesTable.find('tbody tr').length).toBe(3);
					done();
				});
      });

    });

    describe('Navigation available in nodes table', function () {

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

			it('verify navigateUp or treeView to be null', function (done) {
				AsyncUtils.asyncElement(workspacesWidget.region.$el, '.csui-nodestable .csui-nodetable table tbody tr').done(function () {
					var nodesTable, navigateUpIcon, treeViewIcon, goBack;
					nodesTable = workspacesWidget.region.$el.find('.csui-nodestable .csui-nodetable table');
					navigateUpIcon = workspacesWidget.region.$el.find('.csui-icon-v2__conws_action_navigate_up');
					treeViewIcon = workspacesWidget.region.$el.find('.csui-navigationToolbar ul > li a[title="Show navigation tree"]');
					goBack = 	workspacesWidget.region.$el.find('li[data-csui-command="backtolastfragment"] > a[title= "Go back"]');
					expect(nodesTable).not.toBeNull();
					expect(navigateUpIcon.length).toBe(0);
					expect(treeViewIcon.length).toBe(0);
					expect(goBack).not.toBeNull();
					done();
				});
      });

			it('Go back click', function (done) {
        workspacesWidget.region.$el.find('li[data-csui-command="backtolastfragment"] > a[title= "Go back"]').trigger('click');
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

    afterAll(function () {
      Mock.disable();
      $('#widgetWMainWindow').remove();
      $("link[href='/base/csui/themes/carbonfiber/theme.css']").remove();
      $('body').empty();
    });
  });
});