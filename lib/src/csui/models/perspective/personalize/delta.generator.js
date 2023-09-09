/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['module', 'csui/lib/underscore', 'csui/lib/backbone',
      'csui/utils/perspective/perspective.util'],
    function (module, _, Backbone, PerspectiveUtil) {

      var DeltaGenerator = function (options) {
        this.personalization = options.personalization;
        this.perspective = options.perspective;
        if (this.perspective instanceof Backbone.Model) {
          this.perspective = this.perspective.toJSON();
        }
      };

      _.extend(DeltaGenerator.prototype, {
        getDeltaOfCurrentPerspective: function (allPerspectiveWidgets,allPersonalWidgets) {
          allPerspectiveWidgets = _.reject(allPerspectiveWidgets, PerspectiveUtil.isPersonalWidget);
           var perspectiveWidgetIds = _.pluck(allPerspectiveWidgets, PerspectiveUtil.KEY_WIDGET_ID),
           personalWidgets = _.filter(allPersonalWidgets, PerspectiveUtil.isPersonalWidget),
           personalParts = _.partition(allPersonalWidgets, PerspectiveUtil.isHiddenWidget),
           personalActiveWidgets = _.pluck(personalParts[1], PerspectiveUtil.KEY_WIDGET_ID),
           personalHiddenWidgets = _.pluck(personalParts[0], PerspectiveUtil.KEY_WIDGET_ID);
          return {
            perspectiveWidgets: perspectiveWidgetIds,
            personalWidgets: personalWidgets,
            order: personalActiveWidgets,
            hidden: personalHiddenWidgets
          };
        },
        getDelta: function () {
          var result = _.pick(this.perspective, 'type', 'perspective_id', 'perspective_version');
          result.perspective_id = result.perspective_id || this.perspective.id;
          if (this.perspective.override) {
            _.extend(result,
                _.pick(this.perspective.override, 'perspective_id', 'perspective_version'));
          } else {
            result.perspective_version = result.perspective_version || 1;
          }
          switch (this.perspective.type) {
            case 'flow': // flow layout
              var delta = this.getDeltaOfCurrentPerspective(this.perspective.options.widgets, this.personalization.options.widgets);
              _.extend(result, delta);
              return result;
            case 'sidepanel-right': // Right side panel layout
            case 'sidepanel-left': // Left side panel layout
              _.extend(result, {
                banner: this.getDeltaOfCurrentPerspective(this.perspective.options.banner, this.personalization.options.banner),
                content: this.getDeltaOfCurrentPerspective(this.perspective.options.content, this.personalization.options.content),
                sidebar: this.getDeltaOfCurrentPerspective(this.perspective.options.sidebar, this.personalization.options.sidebar),
              });
              return result;
            default:
              throw new Error('Personalization not supported.');
          }
        }
      });
      return DeltaGenerator;

    });