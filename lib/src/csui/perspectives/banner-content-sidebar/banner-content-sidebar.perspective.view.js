/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/lib/marionette',
"csui/lib/radio",
  'csui/perspectives/mixins/perspective.edit.mixin',
  'csui/utils/perspective/perspective.util',
  'csui/behaviors/drag.drop/dnd.container.behaviour',
  'csui/perspectives/flow/flow.perspective.view',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'i18n!csui/perspectives/impl/nls/lang',
  'css!csui/perspectives/banner-content-sidebar/impl/banner-content-sidebar'
], function (module, _, Backbone, $, Marionette, Radio, PerspectiveEditMixin, PerspectiveUtil,
  DnDContainerBehaviour, FlowPerspectiveView, LayoutViewEventsPropagationMixin,
  PerfectScrollingBehavior, lang, commonLang) {
  var FlowPerspective = FlowPerspectiveView.extend({
    getSupportedWidgetSizes: function (manifest, widget) {
      var supportedKinds = [];
        if (this.$el.hasClass('cs-bcs-perspective-content')) {
          supportedKinds = _.filter(manifest.supportedKinds, function (supportedItem) {
            return supportedItem !== 'fullpage';
          });
          return _.map(supportedKinds, function (suppKind) {
            return {
              kind: suppKind,
              label: lang[suppKind + 'Label'],
              selected: widget.model.get('widget').kind === suppKind
            };
          });
        } else if (this.$el.hasClass('cs-bcs-perspective-banner') || this.$el.hasClass('cs-bcs-perspective-sidebar')) {
          return supportedKinds;
        } else {
          supportedKinds = _.filter(manifest.supportedKinds, function (supportedItem) {
            return supportedItem !== 'heroTile';
          });
          return _.map(supportedKinds, function (suppKind) {
            return {
              kind: suppKind,
              label: lang[suppKind + 'Label'],
              selected: widget.model.get('widget').kind === suppKind
            };
          });
        }
      }
  });

  var BannerContentSidebarView = Marionette.LayoutView.extend({

    className: 'banner-content-sidebar-perspective cs-perspective binf-container-fluid',
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: function () {
          return this.options.scrollableParent;
        },
        suppressScrollX: true
      }
    },

    regions: {
      bannerRegion: '#banner-region',
      contentRegion: '#content-region',
      sidebarRegion: '#sidebar-region'
    },

    constructor: function BannerContentSidebarView(options) {
      options || (options = {});
      options = $.extend(true, {}, options);
      this.context = options.context;
      if (options.banner && options.banner.length || options.perspectiveMode == "edit") {
        this.headerView = new FlowPerspective({
          widgets: options.banner && options.banner.length > 0 ? options.banner : undefined,
          context: options.context,
          type: options.type,
          perspectiveMode: options.perspectiveMode,
          className: 'cs-bcs-perspective-banner',
          widgetSizes : {
            tile: {
              widths: {
                xs: 12,
                sm: 12,
                md: 12,
                xl: 12
              }
            }
          },
          model: this.model
        });
        this.headerView.allowHTMLTilesOnly =  true;
        if (this.headerView.options.rowBehaviours) {
          this.addRowBehaviours(this.headerView);
        }
        this.headerView.listenTo(this.headerView, 'delete:widget', function (widgetView) {
          var self = this;
          var cells = self.collection.at(0).columns;
          var model = widgetView.model;
          cells.remove(model);
          self.$el.find('.csui-draggable-item-disable').removeClass('binf-hidden');
        });
      }

      this.contentView = new FlowPerspective({
        widgets: options.content,
        context: options.context,
        type: options.type,
        perspectiveMode: options.perspectiveMode,
        className: "cs-bcs-perspective cs-bcs-perspective-content grid-rows",
        widgetSizes: {
          tile: {
            widths: {
              xs: 12,
              sm: 12,
              md: 6,
              xl: 4
            }
          },
          header: {
            widths: {
              xs: 12,
              sm: 12,
              md: 6,
              xl: 8
            }
          },
          heroTile: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            }
          }
        },
        model: this.model
      });
       this.sidebarView = new FlowPerspective({
        widgets: options.sidebar,
        context: options.context,
        type: options.type,
        perspectiveMode: options.perspectiveMode,
        className: "cs-bcs-perspective cs-bcs-perspective-sidebar grid-rows",
        widgetSizes: {
          heroTile: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            }
          },
          header: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            }
          },
          half: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            }
          },
          quarter: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            },
            heights: {
              xs: 'quarter',
              sm: 'quarter',
              md: 'quarter',
              xl: 'quarter'
            }
          },
          tile: {
            widths: {
              xs: 12,
              sm: 12,
              md: 12,
              xl: 12
            }
          }
        },
        model: this.model
      });

      var waitFor = [this.contentView.widgetsResolved,
      this.sidebarView.widgetsResolved];
      if (this.headerView) {
        waitFor.push(this.headerView.widgetsResolved);
      }
      var deferred = $.Deferred();
      this.widgetsResolved = deferred.promise();
      $.whenAll.apply($, waitFor)
        .done(function () {
          deferred.resolve(_.flatten(arguments));
        }).fail(deferred.fail);

      Radio.channel("quicklink:Tiles").on("transparent:background",
        _.bind(function () {
          $(this.contentView.$el[0]).find('.quicklinkTiles').parents('.csui-widget').addClass('csui-transparent-background');
          $(this.sidebarView.$el[0]).find('.actionButton').parents('.csui-widget').addClass('csui-action-button');
        }, this));
      Radio.channel("newlayout:widget:size").on("update:widget:size",
        _.bind(function (widgetInfo) {
          if (widgetInfo.widgetView.$el.hasClass('csui-heroTile')) {
            widgetInfo.widgetView.$el.removeClass('csui-heroTile').addClass('csui-' + widgetInfo.kind);
          }
          Radio.channel("quicklink:Tiles").trigger("transparent:background");
        }, this));
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.propagateEventsToRegions();
    },
    
    addRowBehaviours: function (self) {
      function addCell(widgetConfig, index) {
        var newCell = self._prepareGridCell(widgetConfig, index);
        var cells = self.collection.at(0).columns;
        cells.add(newCell, { at: index });
        self.options.context.trigger('update:widget:panel', {
          'action': 'add',
          'widgetModel': newCell.widget
        });
      }
      self.options.rowBehaviours = {
        DnDContainerBehaviour: {
          behaviorClass: DnDContainerBehaviour,
          placeholder: self._getDnDPlaceholder.bind(self),
          handle: '.csui-pman-widget-masking', // Limit re-ordering to mask (avoids callout popover),
          helper: 'clone', // Use clone of the original element as drag image to preserve styles of original element as it is.
          start: function (event, ui) {
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length >= 1) {
              return;
            }
            var popoverTarget = self.$el.find(".binf-popover");
            if (popoverTarget.length) {
              popoverTarget.removeClass("pman-ms-popover");
              popoverTarget.hide();
              popoverTarget.binf_popover('destroy');
            }
          },
          over: _.bind(function (event, ui) {
            ui.placeholder.addClass('binf-hidden');
            $(ui.helper).css('cursor', 'no-drop');
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length === 0 && (ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') == 'csui/widgets/html.editor' ||
              ui.placeholder.data("pman.widget") && ui.placeholder.data("pman.widget").get('id') == 'csui/widgets/html.editor')) {
              ui.helper.css('cursor', 'grabbing');
            }
            if (banner.length >= 1 || ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') != 'csui/widgets/html.editor' ||
              ui.placeholder.data("pman.widget") && ui.placeholder.data("pman.widget").get('id') != 'csui/widgets/html.editor') {
              return;
            }
            var placeholderWidget = self._getDnDPlaceholder(ui.helper);
            var placeholder = self.$el.find('.csui-pman-placeholder-container');
            placeholder.attr('class', placeholderWidget.attr('class'));
            placeholder.html(placeholderWidget.html());
            placeholder.css('visibility', 'visible');
            placeholder.data('pman.widget', ui.helper.data('pman.widget'));
            placeholder.removeData('isBeyondLayout');
            if (!!ui.helper.data('pman.widget')) { // "pman.widget" is not available when reorder within flow
              self._resolveWidget({
                type: ui.helper.data('pman.widget').id
              }).done(
                function (resolvedWidget) {
                  placeholder.data('pman.widget.view', resolvedWidget);
                });
            }
          }, self),
          out: function (event, ui) {
            $(ui.helper).css('cursor', 'grabbing');
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length >= 1 || !ui.placeholder.data("pman.widget.view") ||
              ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') != 'csui/widgets/html.editor') {
              return;
            }
            ui.placeholder.hide();
            ui.placeholder.data('isBeyondLayout', true);
          },
          receive: _.bind(function (event, ui) {
            var banner = self.$el.find('.csui-draggable-item');
            if (banner.length >= 1 || !ui.placeholder.data("pman.widget.view") ||
              ui.placeholder.data("pman.widget.view") && ui.placeholder.data("pman.widget.view").get('id') != 'csui/widgets/html.editor') {
              self.$el.find('.csui-widget-item').remove();
              ui.sender.sortable("cancel");
              return;
            }
            if (ui.position.top > 0) {
              var newWidget = ui.placeholder.data('pman.widget'),
                index = ui.item.index(), // this.$el.find('.binf-row >div').index(ui.item);
                manifest = newWidget.get('manifest');

              var widget,
                preloadedWidgetView = ui.placeholder.data("pman.widget.view");
              if (PerspectiveUtil.isEligibleForLiveWidget(manifest)) {
                widget = {
                  type: newWidget.id,
                  kind: 'fullpage',
                  view: preloadedWidgetView.get('view')
                };
              } else {
                widget = {
                  type: 'csui/perspective.manage/widgets/perspective.widget',
                  kind: 'fullpage',
                  options: {
                    options: {}, // To be used and filled by callout form
                    widget: newWidget
                  },
                  view: (preloadedWidgetView = self.pespectiveWidgetView)
                };
              }
              widget.options = _.extend({ ___pman_isdropped: true }, widget.options);

              if (!preloadedWidgetView) {
                self._resolveWidget(widget).done(function (resolvedWidget) {
                  addCell(widget, index);
                });
              } else {
                addCell(widget, index);
              }
            }
            self._ensurePlaceholder();
            self.$el.find('.csui-draggable-item-disable').addClass('binf-hidden');
            ui.sender.sortable("cancel");
          }, self),
          stop: _.bind(function () {
            self._ensurePlaceholder();
          }, self)
        }
      };
    },

    onRender: function () {
      var self = this,
        clasName = 'csui-' + this.perspectiveType + '-layout';
      self.$el.addClass(clasName);
      if (self.options.banner && !!self.options.banner.length && this.options.banner[0].hidden !== true ||
        self.options.perspectiveMode == "edit" || (this.options.perspectiveMode === 'personalize' && !!self.options.banner.length)) {
        self.bannerRegion.show(self.headerView);
        if (self.headerView.options.widgets.length > 1) {
          self.headerView.$el.find('.csui-draggable-item-disable').addClass('binf-hidden');
        }
      }
      var contentViewWidgetsList = self.contentView.collection.models[0].columns.models;
      _.each(contentViewWidgetsList, function (widget) {
        widget.set('className', 'csui-' + widget.get('widget').kind + ' csui-widget');
      });
      var sidebarViewwWidgetsList = self.sidebarView.collection.models[0].columns.models;
      _.each(sidebarViewwWidgetsList, function (widget) {
        widget.set('className', 'csui-' + widget.get('widget').kind + ' csui-widget');
      });
      self.contentRegion.show(self.contentView);
      self.sidebarRegion.show(self.sidebarView);

    },

    serializePerspective: function (perspectiveModel) {
      this.setZoneName();
      var self         = this,
      deferred     = $.Deferred(),
      cells        = new Backbone.Collection();
      cells.push(this.contentView.collection.at(0).columns.models);
      cells.push(this.sidebarView.collection.at(0).columns.models);
      if (this.headerView) {
        cells.push(this.headerView.collection.at(0).columns.models);
      }
      var widgetModels = cells.filter(function (cell) {
        return !this.isEmptyPlaceholder(cell.get('widget'));
      }, this);
      widgetModels.sort(function (a, b) {
        return parseInt(a.cid.replace(/\D/g,'')) - parseInt(b.cid.replace(/\D/g,''));
      });
      var widgetPromises = widgetModels.map(function (widget, index) {
        return self.serializeWidget(widget, '/options/widgets/' + index);
      });
      $.whenAll.apply($, widgetPromises).done(function (results) {
        self.executeCallbacks(results, perspectiveModel, self.options.context).done(function () {
          results = results.sort(function (a, b) {
            return a.widget.options.index - b.widget.options.index;
          });
          var widgets           = _.pluck(results, 'widget'),
              constant_data     = _.flatten(_.pluck(results, 'constantsData')),
              bannerModels = widgets.filter(function (cell) {
                if (!cell.options) {
                  return;
                }
                return cell.options.zone == 'banner';
              }, this),
              contentModels = widgets.filter(function (cell) {
                if (!cell.options) {
                  return;
                }
                return cell.options.zone == 'content';
              }, this),
              sidebarModels = widgets.filter(function (cell) {
                if (!cell.options) {
                  return;
                }
                return cell.options.zone == 'sidebar';
              }, this);
              self.unsetZoneName(widgets);
              var perspectiveResult = {
                perspective: {
                  type: self.perspectiveType,
                  options: {
                    banner: bannerModels,
                    content: contentModels,
                    sidebar: sidebarModels}
                  },
                constant_data: constant_data,
                constant_extraction_mode: 1
              };
          var isAllWidgetsValid = self.validateAndGenerateWidgetId(widgets);
          if (!isAllWidgetsValid) {
            deferred.reject(commonLang.widgetValidationFailed);
          } else {
            deferred.resolve(perspectiveResult);
          }
        }).fail(function (results) {
          results = _.filter(results, function (result) {return !!result.error});
          deferred.reject(results[0].error);
        });
      }, this).fail(function (results) {
        results = _.filter(results, function (result) {return !!result.error});
        deferred.reject(results[0].error);
      });
      return deferred.promise();
    },

    swapLayout: function(perspectiveModel){
      this.perspectiveType = perspectiveModel.attributes.perspective.type;
      var className = 'csui-' + this.perspectiveType + '-layout';
      this.$el.removeClass('csui-sidepanel-right-layout').removeClass('csui-sidepanel-left-layout')
        .addClass(className);
    },

    setZoneName: function () {
      if (this.headerView) {
        _.each(this.headerView.collection.at(0).columns.models, function (widget) {
          if (widget.get('widget').type == "csui/perspective.manage/widgets/perspective.widget") {
            widget.get('widget').options.options.zone = 'banner';
          } else {
            widget.get('widget').options.zone = 'banner';
          }
        });
      }
      _.each(this.contentView.collection.at(0).columns.models, function (widget, index) {
        if (widget.get('widget').type == "csui/perspective.manage/widgets/perspective.widget") {
          widget.get('widget').options.options.index = index;
          widget.get('widget').options.options.zone = 'content';
        } else {
          widget.get('widget').options.index = index;
          widget.get('widget').options.zone = 'content';
        }
      });

      _.each(this.sidebarView.collection.at(0).columns.models, function (widget, index) {
        if (widget.get('widget').type == "csui/perspective.manage/widgets/perspective.widget") {
          widget.get('widget').options.options.index = index;
          widget.get('widget').options.options.zone = 'sidebar';
        } else {
          widget.get('widget').options.index = index;
          widget.get('widget').options.zone = 'sidebar';
        }
      });
    },

    unsetZoneName: function (widgetModels) {
      _.each(widgetModels, function (model) {
         delete model.options.zone;
      });
    },

    enumerateWidgets: function (callback) {
      if (this.options.banner && this.options.banner.length) {
        _.each(this.options.banner, function (widget) {
          widget && callback(widget);
        });
      }

      _.each(this.options.content, function (widget) {
        widget && callback(widget);
      });

      _.each(this.options.sidebar || [], function (widget) {
        widget && callback(widget);
      });
    },

    getPreviousWidgets: function (perspectiveModel) {
      var perspective     = perspectiveModel.getPerspective(),
          previousWidgets = perspective &&
                            perspective.options ?
                            perspective.options.banner : {};
      _.each(this.options.sidebar, function (widget) {
        previousWidgets.push(widget);
      });
      _.each(this.options.content, function (widget) {
        previousWidgets.push(widget);
      });
      previousWidgets = _.map(previousWidgets, function (widget) {
        return {widget: widget};
      });
      return previousWidgets;
    }
  });
  _.extend(BannerContentSidebarView.prototype, LayoutViewEventsPropagationMixin);

  PerspectiveEditMixin.mixin(BannerContentSidebarView.prototype);
  return BannerContentSidebarView;

});