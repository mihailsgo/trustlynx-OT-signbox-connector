/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore',
  'csui/lib/marionette', 'csui/lib/radio',
  'csui/integration/folderbrowser2/folderbrowser2.widget',
  'csui/utils/contexts/factories/connector',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'xecmpf/utils/commands/folderbrowse/open.full.page.workspace',
  'csui-ext!xecmpf/widgets/workspaces/pages/display.workspace/display.workspace.view',
  'csui/dialogs/modal.alert/modal.alert',
  'i18n!xecmpf/widgets/workspaces/pages/display.workspace/impl/nls/lang',
  'hbs!xecmpf/widgets/workspaces/pages/display.workspace/impl/display.workspace',
  'css!xecmpf/widgets/workspaces/pages/display.workspace/impl/display.workspace'
], function ($, _, Marionette, Radio, FolderBrowser2Widget,
  ConnectorFactory, TabablesBehavior, OpenFullPageWorkspaceView, ExtensionItems, ModalAlert, lang, template) {

  var channel = Radio.channel('xecmpf-workspace');
  var DisplayWorkspaceView = Marionette.LayoutView.extend({
    template: template,
    tagName: "div",
    id: "xecmpf-display_wksp",
    className: "xecmpf-page",
    regions: {
      content: "#display_wksp_content",
    },
    constructor: function DisplayWorkspaceView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.apply(this, arguments); // sets this.options
    },
    behaviors: {
      TabablesBehavior: {
         behaviorClass: TabablesBehavior
      }
    },
    authenticateXecm: function (cgiUrl, deferred) {
      var that = this;
      deferred = deferred || $.Deferred();
      if (!!this.connector.connection.session && !!this.connector.connection.session.ticket) {
        var xhr = new XMLHttpRequest();
        var openFullView = new OpenFullPageWorkspaceView();
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              deferred.resolve();
            } else {
              deferred.reject(lang.failedAuthentication + new Error(xhr.statusText));
            }
          }
        };
        openFullView.authenticate(xhr, cgiUrl, this.connector);

      } else {
        this.options.context.once("sync", function () {
          that.authenticateXecm(cgiUrl, deferred);
        });
      }
      return deferred.promise();
    },

    onShow: function () {
      this.connector = this.options.context.getObject(ConnectorFactory);
      var options = this.options || {},
        status = options.status || {};
      var require = window.csui && window.csui.require || window.require,
        commands = options.data && options.data.folderBrowserWidget &&
        options.data.folderBrowserWidget.commands || {},
        goToNodeHistory = commands['back.to.last.fragment'] || {},
        goToNodeHistoryEnabled = !_.isUndefined(goToNodeHistory.enabled) ?
        goToNodeHistory.enabled : true,

        openFullPageWorkspace = commands['open.full.page.workspace'] || {},
        openFullPageWorkspaceEnabled = !_.isUndefined(openFullPageWorkspace.enabled) ?
        openFullPageWorkspace.enabled : true,
        fullPageOverlayEnabled = !_.isUndefined(openFullPageWorkspace.fullPageOverlay) ?
        openFullPageWorkspace.fullPageOverlay : true,
        viewMode = options.data.viewMode ? options.data.viewMode.mode :
        'folderBrowse',
        searchContainer = commands['search.container'] || {},
        searchContainerEnabled = !_.isUndefined(searchContainer.enabled) ?
        searchContainer.enabled : true;

      if (viewMode === 'fullPage') {

        this.cgiUrl = this.connector && this.connector.connection && this.connector.connection.url ?
          this.connector.connection.url.replace('/api/v1', '') : '';
        var that = this;
        this.authenticateXecm(this.cgiUrl)
          .done(function () {
            require(['xecmpf/widgets/integration/folderbrowse/full.page.workspace.view',
                'csui/utils/url'
              ],
              function (FullPageWorkspaceView, Url) {
                var fullPageNoIFrameOptions = _.extend(that.options, {
                  nodeID: that.options.status.workspaceNode.get('id'),
                  connector: that.connector
                });
                var fullPageWorkspace = new FullPageWorkspaceView(fullPageNoIFrameOptions);
                that.content.show(fullPageWorkspace);
              });
          })
          .fail(function (error) {
            ModalAlert.showError(error.toString());
            console.error(error);
          });
      } else {
        if (ExtensionItems !== undefined && ExtensionItems.length > 0) {
          var extensionItem = new ExtensionItems[0](options);
          if (!this.connector.connection.session) {
            var self = this;
            this.options.context.once("sync", function () {
              self.content.show(extensionItem);
            });
          } else {
            this.content.show(extensionItem);
          }
        } else {
          require.config({
            config: {
              'csui/utils/commands/back.to.last.fragment': {
                enabled: goToNodeHistoryEnabled
              },
              'xecmpf/utils/commands/folderbrowse/search.container': {
                enabled: searchContainerEnabled
              },
              'xecmpf/utils/commands/folderbrowse/open.full.page.workspace': {
                enabled: openFullPageWorkspaceEnabled,
                fullPageOverlay: fullPageOverlayEnabled
              }
            }
          });

          this.$el.addClass("binf-widgets xecm-page-widget");

          this.browser = new FolderBrowser2Widget({
            breadcrumb: !goToNodeHistoryEnabled,
            connection: this.connector.connection,
            start: {
              id: status.workspaceNode.attributes.id
            }
          });
          _.extend(this.browser.options.context.options, {
            suppressReferencePanel: true,
            viewMode: this.options.data.viewMode || this.options.status.viewMode,
            initialWkspId: this.options.status.workspaceNode.get('id'),
            navigateMode: this.options.data.navigateMode,
            enableWorkspaceNavigation: false
          });
          self = this;
          this.listenTo(channel, 'xecm:delete:workspace', function () {
            channel.trigger('xecm:close:fullpage:overlay'); // closes the full page overlay if open
            _.defaults(self.options.data, {
              deletecallback: true
            });
            self.options.status.wksp_controller.selectWorkspace(self.options);
          });
          this.$el.find("#display_wksp_content").addClass('csui-folderbrowser');
          this.browser.show({
            placeholder: "#display_wksp_content"
          });
        }
      }
    },

    onDestroy: function () {
      if (this.browser) {
        this.browser.destroy();
      }
    }
  });
  return DisplayWorkspaceView;
});