/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/lib/radio',
  'csui/controls/globalmessage/globalmessage',
  'csui/pages/start/multi.perspective.routing',
  'csui/models/navigation.history',
  'css!xecmpf/widgets/integration/folderbrowse/impl/folderbrowse'
], function (_, $, Marionette, NodeModelFactory, PerspectiveContext,
  PerspectivePanelView, Radio, GlobalMessage,
  MultiPerspectiveRouting, NavigationHistory) {
  "use strict";

  var perspectiveContext;
  var channel = Radio.channel('xecmpf-workspace');
  var FullPageWorkpsaceView = Marionette.ItemView.extend({

    className: 'xecm-full-page-workspace',

    constructor: function FullPageWorkpsaceView(options) {
      options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      NavigationHistory.urlCanChange = false;
      require.config({
        config: {
          'csui/utils/commands/back.to.last.fragment': {
            enabled: false
          },
          'xecmpf/widgets/header/header.view': {
            hideMetadata: true,
            pageWidget: true,
            toolbarBlacklist: ['SearchFromHere']
          },
          'xecmpf/utils/commands/folderbrowse/search.container': {
            pageWidget: true,
            enabled: true
          }
        }
      });
    },

    template: false,

    onRender: function () {
      require.config({
        config: {
          'csui/integration/folderbrowser2/container.enforcer': {
            enabled: false
          }
        }
      });

      var factories = {
        connector: this.options.connector
      };
      perspectiveContext = new PerspectiveContext({
        factories: factories
      });
      var routing = new MultiPerspectiveRouting({
        context: perspectiveContext
      });
      routing.ensureStart({
        pushState: false,
        silent: true
      });
      var viewStateModel = perspectiveContext.viewStateModel;
      if (viewStateModel) {
        viewStateModel.clearHistory();
        viewStateModel.set(viewStateModel.CONSTANTS.CURRENT_ROUTER, undefined);
      }
      var that = this;
      var perspectiveView = new PerspectivePanelView({
        context: perspectiveContext
      });
      var nextNode = perspectiveContext.hasModel('nextNode') ?
        perspectiveContext.getModel('nextNode') : undefined;
      if (nextNode) {
        if(nextNode.get('id') === this.options.nodeID) {
          nextNode.unset('id', {silent:true});
        }
        nextNode.set('id', this.options.nodeID);
        _.extend(perspectiveContext.options, {
          initialWkspId: that.options.nodeID,
          viewMode: that.options.data.viewMode,
          navigateMode: that.options.data.navigateMode,
          enableWorkspaceNavigation: true,
          hideBreadcrumbsPanel: true,
          headerViewOptions: {
            hideWorkspaceType: true,
            hideDescription: true,
            hideActivityFeed: true,
            hideToolbarExtension: true,
            enableCollapse: !_.isUndefined(that.options.enableCollapse) ? that.options.enableCollapse : false
          }
        });
        if (that.options.renderType === undefined || that.options.renderType !== 'dialog') {
          that.listenTo(channel, 'xecm:delete:workspace', function () {
            _.defaults(that.options.data, {
              deletecallback: true
            });
            that.options.status.wksp_controller.selectWorkspace(that.options);
          });

          that.listenTo(that.options.status.wksp_controller, 'xecm:change:fullPage', function (data) {
            if (data && data.action === 'enterContainer') {
              that.enterContainer(data, perspectiveContext);
            }
          });
          perspectiveView.on("swap:perspective", function () {
            that.removeMaximizedWidget.apply(perspectiveView);
          });

        } else if (that.options.renderType === 'dialog') {
          perspectiveView.on("show:perspective swap:perspective", function () {
            that.removeMaximizedWidget.apply(perspectiveView);
            if (that.$el.find(".conws-header-wrapper").length === 0) {
              that.trigger('show:dialog:header');
            } else {
              that.trigger('hide:dialog:header');
            }
          });

          that.listenTo(perspectiveContext.perspective, 'close:workspace:dialog', function () {
            channel.trigger('xecm:close:fullpage:overlay');
          });
        }

        perspectiveContext.options.suppressReferencePanel = true;
        that.listenTo(perspectiveContext, 'clear', function () {
          var nodeModelFactory = perspectiveContext.getModel(NodeModelFactory);
          if (!nodeModelFactory.get('id')) {
            nodeModelFactory.set(nextNode.toJSON());
          }
        });

        that.listenTo(perspectiveContext, "maximize:widget", _.bind(that.addMaximizedWidget, perspectiveView));
        that.listenTo(perspectiveContext, "restore:widget:size", _.bind(that.removeMaximizedWidget, perspectiveView));

        GlobalMessage.setMessageRegionView(
          new Marionette.View({
            el: $.fn.binf_modal.getDefaultContainer()
          }), {
          classes: "xecm-global-message",
          useClass: true,
          sizeToParentContainer: true
        });

        var contentRegion = new Marionette.Region({
          el: that.el
        });
        that.$el.addClass("binf-widgets xecm-page-widget xecm-no-iframe-wrap");
        contentRegion.show(perspectiveView);
        perspectiveContext.applyPerspective(nextNode);
      }
    },

    onBeforeDestroy: function () {
      require.config({
        config: {
          'xecmpf/utils/commands/folderbrowse/search.container': {
            pageWidget: false,
            enabled: true
          }
        }
      });
    },

    onDestroy: function () {
      if (perspectiveContext) {
        perspectiveContext.destroy();
      }
    },
    addMaximizedWidget: function () {
      if ($(".xecm-no-iframe-wrap").length && !($("body").hasClass("binf-widgets"))) {
        if (!$(".xecm-no-iframe-wrap").hasClass("csui-maximized-widget-mode")) {
          $(".xecm-no-iframe-wrap").addClass("csui-maximized-widget-mode");
          if (this.currentPerspectiveView && this.currentPerspectiveView.perspectiveView &&
            this.currentPerspectiveView.perspectiveView.tabPanel) {
            this.currentPerspectiveView.perspectiveView.tabPanel.trigger("dom:refresh");
          }
        }
      }
    },

    removeMaximizedWidget: function () {
      if ($(".xecm-no-iframe-wrap").length && !($("body").hasClass("binf-widgets"))) {
        if ($(".xecm-no-iframe-wrap").hasClass("csui-maximized-widget-mode")) {
          $(".xecm-no-iframe-wrap").removeClass("csui-maximized-widget-mode");
          if (this.currentPerspectiveView && this.currentPerspectiveView.perspectiveView &&
            this.currentPerspectiveView.perspectiveView.tabPanel) {
            this.currentPerspectiveView.perspectiveView.tabPanel.trigger("dom:refresh");
          }
        }
      }
    },

    enterContainer: function (data, perspectiveContext) {
      if (perspectiveContext) {
        var nextNode = perspectiveContext.getModel('nextNode');
        if (nextNode) {
          nextNode.set('id', data.id);
        }
      }
    }
  });

  return FullPageWorkpsaceView;
});