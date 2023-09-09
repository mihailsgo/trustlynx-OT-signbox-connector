/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'module', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/underscore', 'csui/lib/marionette',
  "csui/controls/progressblocker/blocker",
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/perspective.manage/impl/widget.list.view',
  'csui/perspective.manage/impl/perspectivelayouts',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman.panel',
  'hbs!csui/perspective.manage/impl/list.item',
  'hbs!csui/perspective.manage/impl/list',
  'hbs!csui/perspective.manage/impl/widget.drag.template',
  'css!csui/perspective.manage/impl/pman.panel'

], function (require, module, $, Backbone, _, Marionette, BlockerView, PerfectScrollingBehavior,
    WidgetListView, perspectiveLayouts, Lang, template, ListItemTemplate, ListTemplate,
    WidgetDragTemplate) {
  'use strict';

  var PManPanelView = Marionette.ItemView.extend({
    tagName: 'div',

    template: template,

    events: {
      'click @ui.layoutTab': "onTabClicked",
      'keydown @ui.layoutTab': "onKeyDown"
    },

    ui: {
      tabPannel: ".csui-tab-pannel",
      listPannel: ".csui-list-pannel",
      layoutTab: ".csui-layout-tab",
      widgetTab: ".csui-widget-tab",
      template: ".csui-widget-template"
    },

    className: 'csui-pman-panel',

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.csui-tab-pannel, .csui-list-pannel',
        suppressScrollX: true,
        scrollYMarginOffset: 8
      }
    },

    templateHelpers: function () {
      return {
        layoutTabTitle: Lang.layoutTabTitle,
        widgetTabTitle: Lang.widgetTabTitle,
        templateMessage: Lang.templateMessage
      }
    },

    onPanelOpen: function () {
      this.accordionView.triggerMethod("init:widgets");
      this.trigger('ensure:scrollbar');
    },

    onRender: function () {
      this.ui.widgetTab.hide();
      this.ui.layoutTab.hide();
      this.accordionRegion = new Marionette.Region({
        el: this.ui.widgetTab
      });
      this.accordionView = new WidgetListView(this.options);
      this.accordionRegion.show(this.accordionView);
      this.blockActions();
      this.listenTo(this.accordionView, "items:fetched", function () {
        this.unblockActions();
        this.ui.layoutTab.show();
        this.ui.widgetTab.show();
      });
      this.listenTo(this.accordionView, "dom:refresh", function () {
        this.trigger('dom:refresh');
      });
    },

    constructor: function PManPanelView(options) {
      this.options = options || {};
      this.options.existsWidgetTypes = this._getExistsWidgetTypes() || [];
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      BlockerView.imbue(this);
      this.listenTo(this, 'reset:items', function () {
        this.listView && this.listView.destroy();
      });
    },

    _getExistsWidgetTypes: function () {
      var perspective       = this.options.pmanView.perspective.get('perspective'),
          type              = perspective.type,
          perpeCollection   = {},
          existsWidgetTypes = [];
      if (type == 'flow') {
        perpeCollection = perspective.options;
        perpeCollection.widgets.forEach(
            _.bind(function (widget) {
              if (!!widget.type) {
                existsWidgetTypes.push(widget.type);
              }
            }, this));
      } else if (type == 'left-center-right') {
        perpeCollection = perspective.options;
        perpeCollection.center && existsWidgetTypes.push(perpeCollection.center.type);
        perpeCollection.right && existsWidgetTypes.push(perpeCollection.right.type);
        perpeCollection.left && existsWidgetTypes.push(perpeCollection.left.type);
      }
      return existsWidgetTypes;
    },

    onTabClicked: function (options) {
      var args = options.data ? options : {
        data: {
          items: perspectiveLayouts
        }
      };
      args.draggable = !!args.data.draggable;
      args.itemClassName = "csui-layout-item";
      args.pmanView = this.options.pmanView;

      this.ui.tabPannel.addClass("binf-hidden");
      this.listregion = new Marionette.Region({
        el: this.ui.listPannel
      });
      this.listView = new ListView(args);
      this.listregion.show(this.listView);
      this.$el.find('.cs-go-back').attr('tabindex', 0);
      var ele = this.$el.find('.csui-layout-item.binf-active');
      $(ele[0]).attr('tabindex', 0);
      ele.focus();
      this.listenTo(this.listView, "before:destroy", function () {
        this.ui.tabPannel.removeClass("binf-hidden");
      }).listenTo(this.listView, "click:back", function () {
        this.listView.destroy();
      });
    },

    onKeyDown: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onTabClicked(event);
      }
    }
  });

  var ListItemView = Marionette.ItemView.extend({
    constructor: function ListItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    tagName: 'div',
    template: ListItemTemplate,

    templateHelpers: function () {
      return {
        draggable: !!this.options.draggable,
        className: this.options.itemClassName,
        iconClass: this.model.get('icon')
      }
    },

    events: {
      'click .csui-layout-item:not(.binf-active)': _.debounce(function () {
        this.trigger('change:layout');
      }, 200, true),
      'keydown .csui-layout-item': _.debounce(function (event) {
        if (event.keyCode === 13 || event.keyCode === 32) {
          this.trigger('change:layout');
        } else if (event.keyCode === 9 || event.keyCode === 16) {
          this.$el.find('.csui-layout-item').attr('tabindex', -1);
          if (event.keyCode === 9 && event.shiftKey) {
            event.preventDefault();
            this.options.pmanView.$el.find('.cs-go-back').focus();
          } else if (event.keyCode === 9) {
            event.preventDefault();
            $(this.options.pmanView.$el.find('.binf-btn.icon-save')).focus();
            $(this.options.pmanView.$el.find('.csui-layout-item.binf-active')[0]).attr('tabindex', 0);
          } else if (!event.shiftKey) {
            $(this.options.pmanView.$el.find('.csui-layout-item.binf-active')[0]).attr('tabindex', 0);
          }
        } else {
          this.handleKeydown(event);
        }
      }, 200, true),
    },

    handleKeydown: function (event) {
        if (event.keyCode === 38 || event.keyCode === 40) {
          this.$el.find('.csui-layout-item').attr('tabindex', -1);
          event.preventDefault();
          event.stopPropagation();
          if (event.keyCode === 38) { // up arrow key
            var previousEle = this.$el.prev().find('.csui-layout-item');
            if (previousEle.length > 0) {
              previousEle.trigger('focus');
            }
          } else if (event.keyCode === 40) { // down arrow key
            var nextEle = this.$el.next().find('.csui-layout-item');
            if (nextEle.length > 0) {
              nextEle.trigger('focus');
            }
          }
        }
    },

    onRender: function () {
      if (this.model.get('type') === this.options.pmanView.perspective.get('perspective').type) {
        this.trigger('set:active');
      }
    }

  });

  var ListView = Marionette.CompositeView.extend({

    constructor: function ListView(options) {
      options || (options = {});
      options.data || (options.data = {});
      if (!(this.behaviors && _.any(this.behaviors, function (behavior, key) {
        return behavior.behaviorClass === PerfectScrollingBehavior;
      }))) {
        this.behaviors = _.extend({
          PerfectScrolling: {
            behaviorClass: PerfectScrollingBehavior,
            contentParent: '.csui-pman-list',
            suppressScrollX: true,
            scrollYMarginOffset: 15
          }
        }, this.behaviors);
      }

      Marionette.CompositeView.call(this, options);
      if (this.options.data && this.options.data.items) {
        if (!this.collection) {
          var ViewCollection = Backbone.Collection.extend({
            model: Backbone.Model.extend({
              idAttribute: null
            })
          });
          this.collection = new ViewCollection();
        }
        this.collection.add(this.options.data.items);
      }
    },

    ui: {
      back: '.cs-go-back'
    },
    className: 'csui-pman-list',

    events: {
      'click @ui.back': 'onClickBack',
      'keydown @ui.back': 'onKeyInView'
    },

    childEvents: {
      'change:layout': 'onChangeLayout',
      'set:active': 'setActive'
    },

    template: ListTemplate,

    templateHelpers: function () {
      return {
        goBackTooltip: Lang.goBackTooltip
      };
    },

    childViewContainer: '.cs-list-group',

    childView: ListItemView,

    childViewOptions: function () {
      return this.options;
    },

    onClickBack: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger('click:back');
    },

    onKeyInView: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.onClickBack(event);
        this.options.pmanView.$el.find('.csui-layout-tab').focus();
      } else if (event.keyCode === 9) {
        if (!event.shiftKey) {
          event.preventDefault();
          this.$el.find('.csui-layout-item.binf-active').focus();
        }
      }
    },

    setActive: function (childView) {
      this.$el.find('.csui-layout-item').removeClass('binf-active');
      childView.$el.find('.csui-layout-item').addClass('binf-active');
    },

    onChangeLayout: function (childView) {
      var self = this,
        newLayout = childView.model.get('type'),
        currentLayout = this.options.pmanView.perspective.get('perspective').type;
      if ((currentLayout === 'sidepanel-right' || currentLayout === 'sidepanel-left')
        && (newLayout === 'sidepanel-right' || newLayout === 'sidepanel-left')) {
        self.setActive(childView);
        self.options.pmanView.trigger("swap:layout", newLayout);
      }
      else {
        require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlertView) {
          ModalAlertView.confirmWarning(Lang.changePageLayoutConfirmatonText, Lang.layoutTabTitle,
            {
              buttons: {
                showYes: true,
                labelYes: Lang.proceedButton,
                showNo: true,
                labelNo: Lang.changeLayoutCancelButton
              }
            })
            .done(function (labelYes) {
              if (labelYes) {
                self.setActive(childView);
                self.options.pmanView.trigger("change:layout", childView.model.get('type'));
                self.options.pmanView.context.trigger("reset:widget:panel");
              }
            });
        });
      }
    }

  });

  return PManPanelView;
});

