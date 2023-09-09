/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/models/node/node.model',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/treebrowse/impl/tree.node.error.view',
  'csui/lib/fancytree/jquery.fancytree',
  'csui/controls/treebrowse/impl/fancytree.overrides',
  'css!csui/controls/treebrowse/impl/tree'
], function ($, _, Marionette, NodeModel, NodeTypeIconView, TreeNodeErrorView) {
  'use strict';

  return Marionette.ItemView.extend({

    template: false,
    className: 'csui-tree-browse',

    constructor: function TreeView(options) {
      options = options || {};
      var optionsToPick = ['activate', 'beforeActivate', 'click', 'clickPaging', 'collapse', 'dblclick', 'expand',
        'focus', 'init', 'keydown', 'lazyLoad', 'source', 'rtl'];

      this.treeOptions = _.extend(_.pick(options, optionsToPick), {
        extensions: ['csui-overrides'],
        'csui-overrides': {
          rootIndent: 4,
          levelIndent: 24
        },
        escapeTitles: true,
        autoActivate: false,
        icon: function (event, data) {
          var treeNode = data.node;

          if(treeNode.data.isErrorNode === true) {
            var treeNodeErrorView = new TreeNodeErrorView();
            return {html: treeNodeErrorView.render().el.outerHTML};
          }

          if(_.isEmpty(treeNode.data) || treeNode.data.showMore != undefined) {
            return;
          }

          var node = treeNode.data.origNode;
          if (!node) {
            node = new NodeModel({
              id: treeNode.key
            });
          }
          var iconOptions = {
                              node: node,
                              size: 'xsmall',
                              states: 'true',
                              colorTheme: 'tree'
                            },
              iconView = new NodeTypeIconView(iconOptions);
          return {html: iconView.render().el.outerHTML};
        }
      });

      options = _.omit(options, optionsToPick);
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    onBeforeRender: function () {
      this.tree = $.ui.fancytree.getTree(this.$el.fancytree(this.treeOptions));
    },

    onBeforeDestroy: function () {
      if (this.tree && this.tree.widget) {
        this.tree.widget.destroy();
      }
    }

  });

});