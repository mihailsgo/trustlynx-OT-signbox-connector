/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette3',
  'csui/utils/base',
  'csui/utils/contexts/factories/next.node',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/commands',
  'csui/utils/commandhelper',
  'csui/controls/breadcrumbs/breadcrumbs.view',
], function (_, $, Backbone, Marionette, base, NextNodeModelFactory,
    TabableRegionBehavior, commands, CommandHelper, CsuiBreadcrumbsView) {

  var SearchResultsBreadCrumbView = CsuiBreadcrumbsView.extend({

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function SearchResultsBreadCrumbView(options) {
      options || (options = {});
      CsuiBreadcrumbsView.prototype.constructor.call(this, options);
      this.listenTo(this, 'childview:click:ancestor', _.bind(this.onClickAncestor, this));
    },

    onClickAncestor: function (modal, node) {
      var context = this.context = this.options.context;
      this._nextNode = this.options.node || context.getModel(NextNodeModelFactory);
      var nodeId = node.get("id");
      var args = { node: node };
      this.trigger('before:defaultAction', args);

      if (!args.cancel) {

        if (this.accLastBreadcrumbElementFocused) {
          var command = commands.get('goToLocation');
          if (!command) {
            throw new Error('Invalid command: goToLocation');
          }

          this._nextNode.set('id', nodeId, { silent: true });
          this._nextNode.parent = undefined;

          var status = {
            nodes: new Backbone.Collection([this._nextNode]),
            context: this.options.context,
            model: this._nextNode,
            originatingView: this
          },
            options = {
              context: this.options.context,
              originatingView: this
            };

          CommandHelper.handleExecutionResults(command.execute(status, options));
        }
        else {
          if (this._nextNode.get('id') === nodeId) {
            this._nextNode.unset('id', { silent: true });
          }

          var viewStateModel = this.context && this.context.viewStateModel;
          var viewState = viewStateModel && viewStateModel.get('state');
          if (viewState) {
            this.context.viewStateModel.set('state', _.omit(viewState, 'filter'), { silent: true });
          }

          this._nextNode.trigger('before:change:id', node, this);
          this._nextNode.set('id', nodeId);
        }
      }

      this.$el.trigger('setCurrentTabFocus');
    }

  });

  return SearchResultsBreadCrumbView;

});