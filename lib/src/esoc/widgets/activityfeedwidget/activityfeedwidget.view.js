/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/handlebars',
  "csui/lib/marionette",
  'esoc/widgets/activityfeedwidget/object/object.view',
  'csui/controls/tile/tile.view',
  'csui/behaviors/limiting/limiting.behavior',
  'csui/controls/tile/behaviors/blocking.behavior',
  'csui/controls/tile/behaviors/expanding.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  "csui/lib/jquery",
  "csui/utils/connector",
  "esoc/widgets/activityfeedwidget/activityfeed.model",
  "esoc/widgets/activityfeedwidget/activityfeed.view",
  "esoc/widgets/activityfeedwidget/activityfeedwithfilter.view",
  "esoc/widgets/activityfeedwidget/activityfeedfactory",
  'i18n!esoc/widgets/activityfeedwidget/impl/nls/lang',
  'esoc/widgets/activityfeedwidget/util',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/browsable/client-side.mixin',
  "css!esoc/widgets/activityfeedwidget/activityfeed.css"
], function (_, Handlebars, Marionette, ObjectView, TileView,
    LimitingBehavior, BlockingBehavior, ExpandingBehavior, DefaultActionBehavior, $, Connector,
    ActivityFeedModel, ActivityFeedView, ActivityFeedWithFilterView, ActivityFeedFactory, lang,
    Util, FetchableMixin, ClientSideBrowsableMixin) {

  var ActivityFeedWidget = TileView.extend({
    constructor: function ActivityFeedWidget(options) {
      options || (options = {}); // /app data.options;
      options.title = options.title || lang.dialogTitle;
      options.icon = options.titleBarIcon || 'title-activityfeed';
      Util.commonUtil.fillDefaultActivityOptions(options);
      TileView.prototype.constructor.apply(this, arguments);
    },
    initialize: function (options) {
      options = options.data ? _.extend(options, options.data) : options;
      delete options["data"];
      this.options = options;

      if (this.options.feedtype !== undefined) {
        ActivityFeedFactory.prototype.propertyPrefix = Util.commonUtil.getActivityWidgetId(
            this.options);
        ActivityFeedFactory.prototype.uniqueid = Util.commonUtil.getActivityWidgetId(this.options);
      }

      if (this.options.wrapperClass !== undefined) {
        this.$el.addClass(this.options.wrapperClass);
      }
      this.collection = options.context.getCollection(ActivityFeedFactory, options);
      this.options.blockingParentView = this;
      this.contentViewOptions = _.extend(this.options, {collection: this.collection});

      ClientSideBrowsableMixin.mixin(ActivityFeedFactory); //TODO: check in /app, if not useful remove.
      FetchableMixin.mixin(ActivityFeedFactory);

      this.loadingText = options.loadingText || lang.loadingText;

      this.listenTo(this.collection, "request", this.blockActions)
          .listenTo(this.collection, "sync", this.unblockActions)
          .listenTo(this.collection, "error", this.unblockActions);

    },
    childEvents: {
      'click:item': 'onClickItem'
    },
    events: {
      "keydown .icon-tileExpand": "onKeydownHeader"
    },
    contentView: ObjectView,
    behaviors: {
      Blocking: {
        behaviorClass: BlockingBehavior
      },
      Expanding: {
        titleBarIcon: function () {
          return this.options.icon || 'title-activityfeed';
        },
        behaviorClass: ExpandingBehavior,
        expandedView: ActivityFeedWithFilterView,
        dialogTitle: function () {
          return this.options.title || lang.dialogTitle;
        },
        dialogTitleIconNameRight: 'csui_action_minimize32',
        dialogClassName: 'activityfeed-expand esoc',
        expandedViewOptions: function () {
          return _.extend(this.options, {collection: this.collection});
        }
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },
    onClickHeader: function (target) {
      this.triggerMethod('expand');
    },

    onKeydownHeader: function (event) {
      var keyCode = event.keyCode || event.which;
      if (keyCode === 32 || keyCode === 13) {
        this.triggerMethod('expand');
      }
    },

    onShow: function () {
      var titleId = _.uniqueId("activityfeedTitle");
      this.$el.find('.tile-title .csui-heading').attr('id', titleId);
      this.$el.find('.tile-header').parent().attr('role', 'region').attr('aria-labelledby', titleId);
      this.$el.find('.tile-content').attr('aria-labelledby', titleId);
    },

    onDomRefresh: function () {
      var ele = this.$el.find(".icon-tileExpand")
      ele.attr("title",lang.expandTitle)
      if (ele && $(ele).length) {
        $(ele[0]).attr("tabindex", 0)
      }
    }
  });
  return ActivityFeedWidget;
});
