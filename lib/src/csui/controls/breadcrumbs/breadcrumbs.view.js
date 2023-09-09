/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'smart/controls/breadcrumbs/breadcrumbs.view',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/node.links/node.links',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior'
], function (_,
    $,
    Backbone,
    Marionette,
    SmartBreadcrumbsView,
    NextNodeModelFactory,
    nodeLinks,
    TabableRegionBehavior) {

  var BreadCrumbCollectionView = SmartBreadcrumbsView.extend({

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function BreadcrumbCollectionView(options) {
      SmartBreadcrumbsView.prototype.constructor.call(this, options);
      this.listenTo(this, 'before:synchronized', _.bind(this.updateCollection, this));
      this.listenTo(this, 'childview:click:ancestor', _.bind(this.onClickAncestor, this));
    },
    onClickAncestor: function (model, node) {
      var context = this.context = this.options.context;
      this._nextNode = this.options.node || context.getModel(NextNodeModelFactory);

      var args = {node: node};
      this.trigger('before:defaultAction', args);
      if (!args.cancel) {
        var nodeId = node.get('id');
        if (this._nextNode.get('id') === nodeId) {
          this._nextNode.unset('id', {silent: true});
        }

        var viewStateModel = this.context && this.context.viewStateModel;
        var viewState = viewStateModel && viewStateModel.get('state');
        if (viewState) {
          this.context.viewStateModel.set('state', _.omit(viewState, 'filter'), {silent: true});
        }

        this._nextNode.trigger('before:change:id', node, this);
        this._nextNode.set('id', nodeId);
      }

      this.$el.trigger('setCurrentTabFocus');
    },
    updateCollection: function () {
      this.completeCollection.forEach(function (model) {
        var connector = model.connector || model.collection.connector, hrefSrc = '';
        hrefSrc = model.get('id') > 0 && (connector) &&
                  nodeLinks.getUrl(model, {connector: connector}) || '#';
        model.set('hrefSrc', hrefSrc, {silent: true});
      });
    }

  });

  return BreadCrumbCollectionView;

});
