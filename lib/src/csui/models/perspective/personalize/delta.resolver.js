/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/underscore', 'csui/lib/backbone',
      'csui/utils/perspective/perspective.util'],
    function (module, _, Backbone, PerspectiveUtil) {

      var DeltaResolver = function (options) {
        this.delta = options.delta;
        this.perspective = options.perspective;
        if (this.perspective instanceof Backbone.Model) {
          this.perspective = this.perspective.toJSON();
        }
      };

      _.extend(DeltaResolver.prototype, {

        resolveContent: function (perspectiveWidgets, zone) {
            zone = this.delta[zone];
            var personalWidgets = this.delta.personalWidgets || zone && zone.personalWidgets,
            widgetOrder = this.delta.order || zone && zone.order,
            hiddenWidgetIds = this.delta.hidden || zone && zone.hidden,
            personalWidgetsById, perspectiveWidgetsById, newPerspectiveWidgets,
            allActiveWidgets, hiddenWidgets;
          personalWidgets = this.delta.personalWidgets || zone && zone.personalWidgets,
            personalWidgetsById = _.indexBy(personalWidgets, PerspectiveUtil.KEY_WIDGET_ID);
          perspectiveWidgetsById = _.indexBy(perspectiveWidgets, PerspectiveUtil.KEY_WIDGET_ID);
          widgetOrder = _.filter(widgetOrder, function (widgetId) {
            return _.has(perspectiveWidgetsById, widgetId) || _.has(personalWidgetsById, widgetId);
          });

          hiddenWidgetIds = _.filter(hiddenWidgetIds, function (widgetId) {
            return _.has(perspectiveWidgetsById, widgetId);
          });

          newPerspectiveWidgets = _.filter(perspectiveWidgets, function (widget) {
            var widgetId = widget[PerspectiveUtil.KEY_WIDGET_ID];
            return !_.contains(widgetOrder, widgetId) && !_.contains(hiddenWidgetIds, widgetId);
          });

          allActiveWidgets = _.map(widgetOrder, function (widgetId) {
            if (PerspectiveUtil.isPersonalWidgetId(widgetId)) {
              return personalWidgetsById[widgetId];
            } else {
              return perspectiveWidgetsById[widgetId];
            }
          });
          hiddenWidgets = _.map(hiddenWidgetIds, function (widgetId) {
            var widget = _.clone(perspectiveWidgetsById[widgetId]);
            PerspectiveUtil.setWidgetHidden(widget, true);
            return widget;
          });
          return _.union(allActiveWidgets, newPerspectiveWidgets, hiddenWidgets);
        },

        canMergeDelta: function () {
          return (this.perspective.perspectiveId === this.delta.perspectiveId &&
                 this.perspective.type === this.delta.type) ||
                 ((this.delta.type === 'sidepanel-right' && this.perspective.type ==='sidepanel-left')
                 || (this.delta.type === 'sidepanel-left' && this.perspective.type ==='sidepanel-right'));
        },

        getPersonalization: function () {
          if (!this.canMergeDelta()) {
            return this.perspective;
          }
          var result = _.clone(this.perspective);
          switch (this.delta.type) {
            case 'flow':
              _.extend(result, {
                options: { widgets: this.resolveContent(this.perspective.options.widgets) },
                personalizations: this.delta
              });
              return result;
            case 'sidepanel-right': // Right side panel layout
            case 'sidepanel-left': // Left side panel layout
              _.extend(result, {
                options: {
                  content: this.resolveContent(this.perspective.options.content, 'content'),
                  sidebar: this.resolveContent(this.perspective.options.sidebar, 'sidebar'),
                  banner: this.resolveContent(this.perspective.options.banner, 'banner')
                },
                personalizations: this.delta,
              });
              return result;
            default:
              return result;
          }
        }
      });

      return DeltaResolver;

    });