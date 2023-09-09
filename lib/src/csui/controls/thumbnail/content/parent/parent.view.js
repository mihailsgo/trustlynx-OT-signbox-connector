/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/models/node/node.model',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/utils/node.links/node.links',
  'csui/utils/contexts/factories/next.node',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/controls/thumbnail/content/content.registry',
  'i18n!csui/controls/thumbnail/content/parent/impl/nls/localized.strings',
  'hbs!csui/controls/thumbnail/content/parent/impl/parent',
  'css!csui/controls/thumbnail/content/parent/impl/parent'
], function ($, _, Backbone, Marionette, NodeModel, NodeTypeIconView, nodeLinks, NextNodeModelFactory, DefaultActionBehavior,
  ContentRegistry, lang, template) {
  'use strict';

  var ParentView = Marionette.ItemView.extend({
    template: template,
    className: 'csui-thumbnail-parent-container',

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    templateHelpers: function () {
      var name = this.parentModel.get("name"),
        defaultActionUrl = nodeLinks.getUrl(this.parentModel);
      return {
        label: lang.ColumnTitle,
        name: name,
        defaultActionUrl: defaultActionUrl,
        displayLabel: this.options.displayLabel
      };
    },

    events: {
      "keydown": "onKeyInView",
      "click .csui-thumbnail-parent-default-action": "onClickParentLocation"
    },

    constructor: function ParentView(options) {
      options || (options = {});
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      if (this.options.displayIcon) {
        this.listenTo(this, 'render', this._createNodeTypeIcon)
          .listenTo(this, 'before:render', this._destroyNodeTypeIcon)
          .listenTo(this, 'before:destroy', this._destroyNodeTypeIcon);
      }
      var parent = this.model.get("parent_id_expand");
      this.parentModel = new NodeModel(parent, { connector: this.model.connector });
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this.onClickParentLocation();
      }
    },

    _createNodeTypeIcon: function () {
      var iconView = new NodeTypeIconView({ node: this.parentModel });
      this.typeIconRegion = new Marionette.Region({ el: this.$('.csui-thumbnail-parent-icon') });
      this.typeIconRegion.show(iconView);
    },

    _destroyNodeTypeIcon: function () {
      if (this.typeIconRegion) {
        this.typeIconRegion.empty();
        this.typeIconRegion = null;
      }
    },

    onClickParentLocation: function () {
      this.triggerMethod('execute:defaultAction', this.parentModel);
    }
  });
  ContentRegistry.registerByKey('parent_id', ParentView);
  return ParentView;
});