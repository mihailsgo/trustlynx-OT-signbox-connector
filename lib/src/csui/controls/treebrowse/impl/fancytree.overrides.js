/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define([
  'csui/lib/jquery',
  'i18n!csui/controls/treebrowse/impl/nls/lang',
  'csui/lib/fancytree/jquery.fancytree'
], function ($, lang) {
  'use strict';

  $.ui.fancytree.registerExtension({
    name: 'csui-overrides',
    version: '1.0.0',
    options: {
      rootIndent: 0,
      levelIndent: 12
    },

    nodeRenderStatus: function (ctx) {
      var res,
        node = ctx.node,
        spanEl = $(node.span),
        level = node.getLevel(),
        expanded = node.isExpanded(),
        extOpts = ctx.options['csui-overrides'],
        $statusEl = $(node[ctx.tree.statusClassPropName]),
        $ariaEl = $(node.tr || node.li),
        $expander = spanEl.find('.fancytree-expander');
      res = this._super(ctx);

      $expander.attr('title', (expanded ? lang.tooltipTreeNodeCollapse : lang.tooltipTreeNodeExpand));

      if (node.data.disabled === true) {
        $statusEl.addClass('fancytree-disabled');
        if (ctx.options.aria) {
          $ariaEl.attr('aria-disabled', true);
        }
      } else if (ctx.options.aria) {
        $ariaEl.attr('aria-disabled', false);
      }

      $ariaEl.addClass('fancytree-level-' + level);
      if (ctx.tree.options.rtl) {
        spanEl.css({
          paddingRight: ((level - 1) * extOpts.levelIndent) + extOpts.rootIndent
        });
      } else {
        spanEl.css({
          paddingLeft: ((level - 1) * extOpts.levelIndent) + extOpts.rootIndent
        });
      }
      if (node.isPagingNode()) {
        spanEl.find('.fancytree-title:not(:has(.fancytree-paging-icon))').append(
          '<span class="fancytree-paging-icon ' + (node.data.showMore ? 'show-more' : 'show-less') + '">');
      }
      if (node._isLoading === true) {
        spanEl.find('.fancytree-expander').append('<div class="fancytree-loader"></div>');
      } else {
        spanEl.find('.fancytree-expander').empty();
      }
      if (node.data.isErrorNode === true) {
        spanEl.addClass('fancytree-node-error');
      } else if (node.hasError === true) {
        spanEl.addClass('fancytree-error');
      }

      return res;
    },

    nodeSetActive: function (ctx, flag, callOpts) {
      if (ctx.node.data.disabled === true) {
        return $.Deferred(function () {
          this.resolveWith(ctx);
        }).promise();
      }

      this._super(ctx, flag, callOpts);
    },

    treeSetFocus: function (ctx, flag, callOpts) {
      if (flag === false && this.focusNode) {
        this._lastFocusNode = this.focusNode;
      }
      var res = this._super(ctx, flag, callOpts);
      if (flag && (!callOpts || !callOpts.calledByNode) && !this.focusNode && this._lastFocusNode) {
        this._lastFocusNode.setFocus();
      }
      return res;
    }

  });

  return $.ui.fancytree;
});
