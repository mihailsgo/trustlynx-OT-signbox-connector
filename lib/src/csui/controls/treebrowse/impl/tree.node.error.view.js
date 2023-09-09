/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'hbs!csui/controls/treebrowse/impl/tree.node.error'
], function ($, _, Marionette, TreeNodeErrorTemplate) {
  'use strict';

  return Marionette.ItemView.extend({

    tagName: 'span',
    className: 'csui-tree-error-node-icon-container',
    template: TreeNodeErrorTemplate,

    constructor: function TreeNodeErrorView(options) {
      options = options || {};
      Marionette.ItemView.prototype.constructor.call(this, options);
    }

  });
});
