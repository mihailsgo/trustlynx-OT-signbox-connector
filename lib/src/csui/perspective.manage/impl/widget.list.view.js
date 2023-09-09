/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/perspective.manage/impl/options.form.view',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'csui/models/widget/widget.collection',
  'hbs!csui/perspective.manage/impl/widget.item',
  'hbs!csui/perspective.manage/impl/widget.drag.template'
], function (module, _, $, Backbone, Marionette, base, PerfectScrollingBehavior,
    WidgetOptionsFormView, Lang,
    WidgetCollection,
    WidgetItemTemplate, WidgetDragTemplate) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    dragImageOffsetTop: 50,
    dragImageOffsetLeft: 50
  });

  var WidgetItemView = Marionette.ItemView.extend({

    constructor: function WidgetItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',

    className: 'csui-module-group',

    template: WidgetItemTemplate,

    templateHelpers: function () {
      var widgetCollection = new Backbone.Collection(this.model.attributes.widgets),
          disableTitle     = Lang.disableTitle,
          idx              = 0;

      widgetCollection.models.forEach(function (model) {
        model.set({
          'draggable': !!model.get('canDragAndDrop'),
          'disableTitle': disableTitle,
          'dataAttr': model.get('id').replace(/\//g, "-"),
          'allowMultiple': !!model.get('allowMultiple'),
          'index': idx++
        }, {'silent': true});
      });
      return {
        widgets: widgetCollection.models
      }
    },

    ui: {
      accordionHeader: '.csui-accordion-header',
      accordionContent: '.csui-accordion-content',
      accordionHeaderIcon: '.csui-accordion-header .cs-icon',
      widget: '.csui-draggable-widget-item'
    },

    events: {
      'click @ui.accordionHeader': "toggle",
      'keydown @ui.accordionHeader': 'toggle',
      'dragstart @ui.widget': 'onDragStart',
      'dragend @ui.widget': 'onDragEnd'
    },

    toggle: function () {
      var isClosed = this.ui.accordionHeader.hasClass('csui-accordion-expand');
      this.ui.accordionHeader.toggleClass("csui-accordion-expand");
      this.options.parentView.$el.find(".csui-module-group").removeClass('csui-accordion-visible')
          .find('.csui-accordion-header').removeClass('csui-accordion-expand');
      if (!isClosed) {
        this.$el.addClass("csui-accordion-visible");
        this.ui.accordionHeader.addClass("csui-accordion-expand");
      }

      base.onTransitionEnd(this.ui.accordionContent, function () {
        this.trigger('widgets:expanded');
      }, this);
    },

    onRender: function () {
      var dndContainer = $('.perspective-editing .csui-dnd-container');
      if (dndContainer.length) {
        this._makeWidgetSortable();
      } else {
        var hasDragDropNative = (typeof document.createElement("span").dragDrop === "function");
        if (!this._hasNativeDragImageSupport() && hasDragDropNative) {
          this.ui.widget.on("mousedown", this._handleDragImageForIE.bind(this));
        }
      }
    },

    _makeWidgetSortable: function () {
      var self              = this,
          draggableChildren = this.$el.find('.csui-widget-item.csui-draggable-widget-item'),
          widgetEls         = draggableChildren.parent();
      widgetEls.data('pman.widget', this.model.get('widgets'));
      widgetEls.sortable({
        connectWith: [".perspective-editing .csui-dnd-container",
          ".perspective-editing .pman-trash-area"],
        containment: ".perspective-editing ",
        helper: function (event, ui) {
          var widgetModel = ui.data('widget-index');
          self.widgetDragTemplate = new widgetDragTemplateView({
            title: self.model.get("widgets")[widgetModel].get('title'),
            newWidget: self.model.get("widgets")[widgetModel]
          });
          self.widgetDragTemplate.render();
          self.widgetDragTemplate.$el.width('220px');
          self.widgetDragTemplate.$el.height('220px');
          self.widgetDragTemplate.$el.css({opacity: 0.75});
          self.widgetDragTemplate.$el.appendTo(
              self.options.parentView.$el.closest('.pman-pannel-wrapper'));
          return self.widgetDragTemplate.$el;
        },
        tolerance: 'pointer',
        cursorAt: {top: config.dragImageOffsetTop, left: config.dragImageOffsetLeft},
        start: function (event, ui) {
          ui.item.css('display', 'block');
          ui.placeholder.css('display', 'block');
          self.dragStart();
        },
        stop: function () {
          self.dragEnd();
        }
      });
    },

    _handleDragImageForIE: function (e) {
      var originalEvent = e.originalEvent,
          idx           = $(event.currentTarget).data('widget-index'),
          $img          = $('.csui-template-wrapper').clone(),
          widget        = this.model.get("widgets")[idx];
      $img.find(".csui-template-header").text(widget.get("title"));
      $img.css({
        "top": Math.max(0, originalEvent.pageY - config.dragImageOffsetTop) + "px",
        "left": Math.max(0, originalEvent.pageX - config.dragImageOffsetLeft) + "px",
        "position": "absolute",
        "pointerEvents": "none"
      }).appendTo(document.body);

      setTimeout(function () {
        $img.remove();
      });
      $img.on('dragstart', _.bind(function (event) {
        var widget       = this.model.get("widgets")[idx],
            dataTransfer = event.originalEvent.dataTransfer;
        dataTransfer.setData("text", JSON.stringify(widget.toJSON()));
        this.dragStart();
      }, this));
      $img.on('dragend', _.bind(function (event) {
        this.dragEnd();
      }, this));
      $img[0].dragDrop();
    },

    onDragStart: function (event) {
      var idx          = $(event.currentTarget).data('widget-index'),
          widget       = this.model.get("widgets")[idx],
          dataTransfer = event.originalEvent.dataTransfer;
      var template = $('.csui-template-wrapper');
      template.find(".csui-template-header").text(widget.get("title"));
      if (this._hasNativeDragImageSupport()) {
        dataTransfer.setData("text", JSON.stringify(widget.toJSON()));
        dataTransfer.setDragImage(template[0], config.dragImageOffsetLeft,
            config.dragImageOffsetTop);
      }
      this.dragStart();
    },

    _hasNativeDragImageSupport: function () {
      var dataTransfer = window.DataTransfer || window.Clipboard;
      return ("setDragImage" in dataTransfer.prototype);
    },

    onDragEnd: function (event) {
      this.dragEnd();
    },

    dragStart: function () {
      this.$el.closest(".csui-pman-panel").addClass("csui-pman-drag-start");
      $(document.body).addClass('csui-pman-dnd-active');
    },

    dragEnd: function () {
      this.$el.closest(".csui-pman-panel").removeClass("csui-pman-drag-start");
      $(document.body).removeClass('csui-pman-dnd-active');
    }

  });

  var widgetDragTemplateView = Marionette.ItemView.extend({
    constructor: function WidgetItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',

    className: 'csui-template-wrapper',

    template: WidgetDragTemplate,

    templateHelpers: function () {
      return {
        header: this.options && this.options.title,
        body: Lang.templateMessage

      }
    },
    onRender: function () {
      this.$el.data('pman.widget', this.options.newWidget);
    }
  });

  var WidgetListView = Marionette.ItemView.extend({
    tagName: 'div',

    template: WidgetItemTemplate,

    constructor: function WidgetListView(options) {
      options || (options = {});
      options.data || (options.data = {});

      options.existsWidgetTypes || (options.existsWidgetTypes = []);
      Marionette.ItemView.call(this, options);
      this.context = this.options.pmanView.context;
      var self = this;
      self.widegtsUpdated = false;
      this.allWidgets = new WidgetCollection();
      this.allWidgets.fetch().done(function () {
        self.collection = self._groupWidgetsByModule();
        self.render();
        self.trigger("items:fetched");
      });
      this.listenTo(this.context, 'update:widget:panel', _.bind(function (opts) {
        this.widegtsUpdated = true;
        var newEleToBeProcess = opts.widgetModel && opts.widgetModel.type ? opts.widgetModel.type :
                                undefined,
            oldEleToBeProcess = opts.oldWidgetModel && opts.oldWidgetModel.type ?
                                opts.oldWidgetModel.type : undefined;

        if (!!newEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, newEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          }
          else {
            this.options.existsWidgetTypes.push(newEleToBeProcess);
          }
          newEleToBeProcess = newEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + newEleToBeProcess +
                                             '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass('binf-hidden') : '';
        }
        if (!!oldEleToBeProcess) {
          var nodeIndex = _.indexOf(this.options.existsWidgetTypes, oldEleToBeProcess);
          if (nodeIndex >= 0) {
            this.options.existsWidgetTypes.splice(nodeIndex, 1);
          }
          oldEleToBeProcess = oldEleToBeProcess.replace(/\//g, "-");
          var toggleElements = this.$el.find('div[data-widget-type="' + oldEleToBeProcess +
                                             '"][data-widget-allow-multiple="false"]');
          toggleElements.length ? toggleElements.toggleClass('binf-hidden') : '';
        }
      }, this));

      this.listenTo(this.context, 'reset:widget:panel', _.bind(function (opts) {
        this.options.existsWidgetTypes = [];
        this.widegtsUpdated = true;
      }, this));
    },

    initialize: function () {
      _.bindAll(this, "renderItem");
    },

    className: 'cs-module-list',

    render: function () {
      this.collection && this.collection.each(this.renderItem);
    },

    renderItem: function (model) {
      var parentView = this;
      var itemView = new WidgetItemView({
        model: model,
        parentView: parentView,
        context: this.context
      });
      itemView.render();
      this.listenTo(itemView, 'widgets:expanded', _.bind(this.trigger, this, 'dom:refresh', this));
      $(this.el).append(itemView.el);
    },

    _groupWidgetsByModule: function () {
      var moduleCollection = new Backbone.Collection();
      var widgets = this.allWidgets.filter(function (widget) {
        var manifest = widget.get('manifest');
        if (!manifest || !_.has(manifest, 'title') || !_.has(manifest, 'description') ||
            manifest.deprecated) {
          return false;
        }
        var schema        = JSON.parse(JSON.stringify(manifest.schema || {})),
            options       = JSON.parse(JSON.stringify(manifest.options || {})),
            isValidSchema = WidgetOptionsFormView._normalizeOptions(
                schema.properties, options.fields || {}, {});
        if (!isValidSchema) {
          return false;
        }
        return true;
      });

      _.each(widgets, _.bind(function (widget) {
        var manifest       = _.defaults(widget.get('manifest'), {
              'allowMultiple': true,
              'title': Lang.noTitle
            }),
            canDragAndDrop = manifest.allowMultiple;

        if (!canDragAndDrop) {
          canDragAndDrop = $.inArray(widget.get('id'), this.options.existsWidgetTypes) === -1;
        }

        widget.set({
          'allowMultiple': manifest.allowMultiple,
          'canDragAndDrop': canDragAndDrop,
          'title': manifest.title
        });
      }, this));

      _.each(_.groupBy(widgets, function (widget) {
        return widget.serverModule.id;
      }), function (val, key) {
        var title = _.first(val).serverModule.get('title');
        title = title ? title.replace(/OpenText /, '') :
                _.first(val).serverModule.get('id').toUpperCase();
        moduleCollection.add({
          id: key,
          title: title,
          widgets: val
        })
      });
      return moduleCollection;
    },

    _sanitiseWidgetLibrary: function () {
    },

    onInitWidgets: function () {
      this.$el.empty(); // FIXME Make this ItemView as CollectionView
       if(this.widegtsUpdated){
        this.collection = this._groupWidgetsByModule();
        this.widegtsUpdated = false;
      }
      this.render();
    },

  });

  return WidgetListView;

});
