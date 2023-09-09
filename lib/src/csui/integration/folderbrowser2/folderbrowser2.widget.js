/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/pages/start/multi.perspective.routing',
  'csui/utils/base',
  'csui/controls/iconpreload/icon.preload.view',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/models/navigation.history',
  'csui/controls/globalmessage/globalmessage'
], function (_, Backbone, Marionette, MultiPerspectiveRouting,
        base, IconPreloadView, PerspectiveContext, PerspectivePanelView, NavigationHistory, GlobalMessage) {

  'use strict';

  function FolderBrowserWidget2(options) {
    
    this.options = options || (options = {});

    var connection = options.connection,
        connector  = options.connector;

    if (!this.options.context) {
      this.destoryContextOnExit = true;
    }

    this.options.context = this.options.context || new PerspectiveContext({
      factories: {
        connector: connector ||
                   connection && {connection: connection} ||
                   undefined
      }
    });

    NavigationHistory.urlCanChange = false;

    csui.require.config({
      config: {
        'csui/integration/folderbrowser2/container.enforcer': {
          enabled: true
        }
      }
    });

    if (base.isAppleMobile()) {
      document.body.classList.add('csui-on-ipad');
    }
    
    if (base.isIOSBrowser()) {
      document.body.classList.add('csui-on-macintosh');
    }

    IconPreloadView.ensureOnThePage();

    var routing;
    if (options.context && options.context.viewStateModel) {
      routing = options.context.viewStateModel.get("PerspectiveRouting");
    }

    if (!routing) {
      routing = new MultiPerspectiveRouting({context: options.context});
      routing.ensureStart({silent: true, pushState: false});
    }

    var viewStateModel = this.options.context.viewStateModel;
    if (viewStateModel) {
      viewStateModel.clearHistory();
      viewStateModel.set(viewStateModel.CONSTANTS.CURRENT_ROUTER, undefined);
    }

  }

  _.extend(FolderBrowserWidget2.prototype, Backbone.Events, {

    constructor: FolderBrowserWidget2,
    show: display,
    destroy: destroy,

    setStartId: function (nodeId) {

      if (this.options.start.id !== nodeId) {
        var nextNode,
            viewStateModel = this.options.context.viewStateModel;

        this.options.start.id = nodeId;
        nextNode = this.options.context.getModel('nextNode');

        if (nextNode.get('id') === nodeId) {
          nextNode.unset('id', {silent:true});
        }

        nextNode.set('id', nodeId);
        viewStateModel.set(viewStateModel.CONSTANTS.START_ID, this.options.start.id);

        viewStateModel.clearHistory();
        viewStateModel.clearCurrentHistoryEntry();

        return this;
      }

    }
  });

  function display(options) {

    this.view = new PerspectivePanelView({ context: this.options.context });
    GlobalMessage.setMessageRegionView(this.view, {classes: 'csui-globalMessenger'});

    this.listenTo(this.view, "create:perspective", function() {
      this.view.disabled = true;
    }.bind(this));

    this.region = new Marionette.Region({ el: options.placeholder });
    this.region.show(this.view);
    this.region.el.classList.add('binf-widgets');
    var nextNode = this.options.context.getModel('nextNode');
    var viewStateModel = this.options.context.viewStateModel;
    if (this.options.start && this.options.start.id) {
      if (this.options.breadcrumb !== undefined) {
        viewStateModel.set(viewStateModel.CONSTANTS.BREADCRUMB, this.options.breadcrumb);
      }
      nextNode.unset('id', {silent:true});
      nextNode.set('id', this.options.start.id);
      viewStateModel.set(viewStateModel.CONSTANTS.START_ID, this.options.start.id);
    }

    viewStateModel.clearHistory();

    return this;
  }

  function destroy() {
    if (this.region) {
      this.view.destroy();
      this.region.destroy();
      this.region = null;
    }
    if (this.destoryContextOnExit) {
      this.options.context.destroy();
    }
    return this;
  }

  return FolderBrowserWidget2;

});


