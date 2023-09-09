/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/handlebars',
  'csui/lib/marionette',
  'csui/lib/jquery',
  'csui/utils/base',
  'csui/controls/tile/tile.view',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/controls/tile/behaviors/blocking.behavior',
  'csui/controls/progressblocker/blocker',
  'csui/widgets/search.custom/impl/search.object.view',
  'i18n!csui/widgets/search.custom/impl/nls/lang'
], function (_, Handlebars, Marionette, $, base, TileView, DefaultActionBehavior,BlockingBehavior, BlockingView,
    SearchCustomObjectView, lang) {

  var CustomSearchWidgetView = TileView.extend({
    constructor: function CustomSearchWidgetView(options) {
      options || (options = {});
      options.title = options.title || lang.title;
      options.icon = options.titleBarIcon || 'csui-icon-query-form-search';
      this.context = options.context;

      TileView.prototype.constructor.call(this, options);

      options = options.data ? _.extend(options, options.data) : options;
      this.options = options;
      this.options.parentView = this;
      this.options.blockingParentView = this;
      this.contentViewOptions = this.options;
      this.loadingText=lang.loadingText;
      BlockingView.imbue(this);
      this.blockActions();
    },
    contentView: SearchCustomObjectView,
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    onShow: function () {
      var titleId = _.uniqueId('search');
      this.$el.find('.tile-title .csui-heading').html('').attr('id', titleId);
      this.listenTo(this.contentView, "change:title", this.updateTitle);
      this.$el.find('.tile-header').parent().attr('role', 'region').attr('aria-labelledby', titleId);
      this.$el.find('.tile-content').attr('aria-labelledby', titleId);
    },
    updateTitle: function () {
      this.$el.find('.tile-title .csui-heading').html(base.escapeHtml(this.options.title));
      this.$el.find('.tile-title').attr('title', this.options.title);
      this.$el.find('.tile-controls').attr('title', this.options.title);
    }
  });
  return CustomSearchWidgetView;
});
