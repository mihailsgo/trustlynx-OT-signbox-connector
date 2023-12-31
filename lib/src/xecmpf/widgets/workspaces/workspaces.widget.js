/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define(["csui/lib/underscore",
  "csui/lib/marionette",
  "csui/lib/backbone",
  'xecmpf/widgets/workspaces/controllers/dialog.controller',
  'xecmpf/widgets/workspaces/utils/urlhelper',
  'csui/utils/contexts/factories/user',
  'xecmpf/widgets/workspaces/pages/select.workspace/select.workspace.view'
], function (_, Marionette,
  Backbone,
  DialogController,
  UrlHelper,
  UserModelFactory,
  SelectWorkspaceView) {

  var SlideTransitionRegion = Backbone.Marionette.Region.extend({

    show: function (view) {
      this._ensureElement();
      view.render();
      this.close(function () {
        this.currentView = view;
        this.open(view, function () {
          if (view instanceof SelectWorkspaceView) {
            Marionette.triggerMethodOn(view, 'show');
          }
        });
      });

    },
    close: function (cbOpen) {
      var view = this.currentView,
        that = this;

      delete this.currentView;
      if (!view) {
        if (cbOpen) {
          cbOpen.call(this);
        }
        return;
      }
      view.$el.hide('slide', {
        direction: 'left',
        complete: function () {

          if (view.destroy) {
            view.destroy();
          }
          if (cbOpen) {
            cbOpen.call(that);
          }
        }
      }, 250);

    },
    open: function (view, cbDomRefresh) {
      var that = this;
      this.$el.hide();

      this.$el.html(view.$el);

      Marionette.triggerMethodOn(view, 'before:show');
      Marionette.triggerMethodOn(view, 'show');
      Marionette.triggerMethodOn(view, 'dom:refresh');

      this.$el.show('slide', {
        direction: 'right',
        complete: function () {
          if (cbDomRefresh) {
            cbDomRefresh.call(that);
          }
        }

      }, 250);
    }
  });

  function CompleteCreateWorkspaceWidget(options) {
    options || (options = {});
    var params = UrlHelper.getParams(window.location);
    if (_.isEmpty(options.data) && !_.isEmpty(params)) {
      this.options = _.defaults({}, options, {
        data: {
          busObjectId: params.busobjectid,
          busObjectType: params.busobjecttype,
          extSystemId: params.extsystemid
        }
      });
    } else {
      this.options = options;
    }

    this.options.context.user = this.options.context.getModel(UserModelFactory);
  }

  _.extend(CompleteCreateWorkspaceWidget.prototype, {

    refresh: function (options) {

      if (options.data.busObjectId && options.data.busObjectType && options.data.extSystemId) {
        if (this.options.status.workspaceNode) {
          delete this.options.status.workspaceNode;
        }

        if (this.options.data.workspaceNodeId) {
          delete this.options.data.workspaceNodeId;
        }
        this.options.data.busObjectType = options.data.busObjectType;
        this.options.data.extSystemId = options.data.extSystemId;
        this.options.data.busObjectId = options.data.busObjectId;
      }
      if (options.data.viewMode) {
        if (this.options.data.viewMode === undefined) {
          this.options.data.viewMode = {};
        }
        this.options.data.viewMode.mode = options.data.viewMode;
      }

      if (options.data.navigateMode) {
        this.options.data.navigateMode = options.data.navigateMode;
      }

      this.show(this.options);

    },

    show: function (options) {
      this.showView(this, options);
    },

    showView: function (self, options) {
      if (!self.region) {
        self.region = new SlideTransitionRegion({
          el: options.placeholder
        });
      }
      _.defaults(self.options, options, {
        region: self.region
      });
      self.options.status = self.options.status || {};
      _.defaults(self.options.status, {
        wksp_controller: new DialogController(self.options)
      });
      self.options.status.wksp_controller.selectWorkspace(self.options);
    },

    close: function () {
      if (this.region && this.region.currentView) {
        if (this.region.currentView.content) {
          this.region.currentView.content.destroy();
        }
        if (this.region.currentView.browser) {
          this.region.currentView.browser.destroy()
        }
        this.region.currentView.destroy();
        this.region.destroy();
        this.region = null;
      }
      return this;
    }

  });

  CompleteCreateWorkspaceWidget.version = '1.0';
  return CompleteCreateWorkspaceWidget;
});