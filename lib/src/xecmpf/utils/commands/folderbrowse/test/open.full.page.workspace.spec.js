/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/utils/contexts/page/page.context', 'csui/utils/contexts/factories/connector',
  'csui/utils/commands',
  'csui/models/node/node.model',
  'xecmpf/utils/commands/folderbrowse/test/open.full.page.workspace.mock'
], function ($, PageContext, ConnectorFactory, commands, NodeModel,
    Mock) {
  'use strict';

  describe('Open Full Page Workspace in new tab', function () {

    var openFullPageWorkspaceCommand, context, connector, status, originalWindowOpen, openedWindow, xhr;

    beforeAll(function () {
      Mock.enable();
      openFullPageWorkspaceCommand = commands.get('WorkspacePage');
      context = new PageContext({
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
      connector = context.getObject(ConnectorFactory);
      status = {
        context: context,
        originatingView: {context: context},
        container: new NodeModel({id: 2000}, {connector: connector}),
        data: {
          applyTheme: true
        }
      };
      xhr = new XMLHttpRequest();
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '//server/support/xecmsap/widget_themes/belize/bcw/overrides.css';
      document.head.appendChild(link);
      link.setAttribute('data-csui-theme-overrides', true);
      originalWindowOpen = window.open;
      window.open = function (url) {
        openedWindow = {
          location: {
            href: url
          }
        };
        return openedWindow;
      };
    });

    afterAll(function () {
      window.open = originalWindowOpen;
      Mock.disable();
    });

    it('is registered by default', function () {
      expect(openFullPageWorkspaceCommand).toBeDefined();
    });

    it('is not enabled by default', function () {
      expect(openFullPageWorkspaceCommand.enabled(status)).toBeFalsy();
    });

    it('is enabled based on module configuration', function () {
      require.config({
        config: {
          'xecmpf/utils/commands/folderbrowse/open.full.page.workspace': {
            enabled: true
          }
        }
      });
      expect(openFullPageWorkspaceCommand.enabled(status)).toBeTruthy();
    });

    it('has opened the perspective of the container with proper theme parameter', function (done) {
      openFullPageWorkspaceCommand
      .execute(status, {})
      .done(function () {
        expect(openedWindow.location.href).toBe(
          "//server/otcs/cs/xecm/nodes/" + status.container.get("id") + '?xecmToken=dummyToken&theme=sap.belize.bcw');
        done();
      });
    });

    it('no theme parameter is appended when no proper theme data', function (done) {
      $(document).find("head > link[data-csui-theme-overrides]").attr("href", "//server/support/xecmsap/widget_themes/bcw/overrides.css");
      openFullPageWorkspaceCommand
      .execute(status, {})
      .done(function () {
        expect(openedWindow.location.href).toBe(
          "//server/otcs/cs/xecm/nodes/" + status.container.get("id") + '?xecmToken=dummyToken');
        done();
      });
    });
  });

});
