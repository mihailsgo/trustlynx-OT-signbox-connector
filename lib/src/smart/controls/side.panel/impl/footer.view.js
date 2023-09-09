/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/lib/marionette',
  'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'hbs!smart/controls/side.panel/impl/footer',
  'hbs!smart/controls/side.panel/impl/button',
  'smart/mixins/generic.utilities/footerview.responsiveness.mixin',
  'i18n!smart/controls/side.panel/impl/nls/lang',
  'css!smart/controls/side.panel/impl/side.panel'
], function (_, $, Backbone, Marionette, TabableRegion, template, btnTemplate, FooterViewResponsiveMixin, lang) {

  var ButtonView = Marionette.ItemView.extend({
    tagName: 'button',
    className: 'cs-footer-btn',
    template: btnTemplate,
    triggers: {
      'click': 'click'
    },
    attributes: function () {
      var attributes = this.model.get('attributes') || {};
      return attributes;
    },
    constructor: function ButtonView(options) {
      options || (options = {});
      var model  = options.model || new Backbone.Model(),
          v2Icon = model && model.get('v2Icon');
      if (v2Icon) {
        v2Icon = _.defaults(v2Icon, {
          iconName: '',
          states: false,
          size: 'normal'
        });
        options.model.set('v2Icon', v2Icon, {silent: true});
      }
      Marionette.ItemView.apply(this, arguments);
      this.listenTo(this.model, "change", this.render);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    isTabable: function () {
     return this.$el.is(':not(:disabled)') && this.$el.is(':not(:hidden)');
    },

    currentlyFocusedElement: function (event) {
      var resizerElement= this._parent.setResizer(event);
     if (this.$el.prop('tabindex') === -1) {
       this.$el.prop('tabindex', 0);
     }
     return  resizerElement || this.$el;
    },

    onLastTabElement: function (shiftTab, event) {
     var last = this.$el.parents('.cs-footer-control').find('.cs-footer-btn').last();
     return last.is(this.$el) && !shiftTab && last.is($(event.target));
    },

    onRender: function () {
      var button     = this.$el,
          attributes = this.model.attributes,
          className  = attributes.className;
      button.text(attributes.label);
      button.addClass(className || 'binf-btn binf-btn-default');
      if (attributes.toolTip) {
        button.attr('title', attributes.toolTip);
      }
      if (attributes.separate) {
        button.addClass('cs-separate');
      }
      if (attributes.id) {
        button.attr('id', attributes.id);
      }
      this.updateButton(attributes);
    },

    updateButton: function (attributes) {
      var $button = this.$el;
      attributes || (attributes = {});
      if (attributes.hidden !== undefined) {
        if (attributes.hidden) {
          $button.addClass('binf-hidden');
        } else {
          $button.removeClass('binf-hidden');
        }
      }
      if (attributes.disabled !== undefined) {
        $button.prop('disabled', attributes.disabled);
        attributes.disabled ? $button.addClass('binf-disabled') :
        $button.removeClass('binf-disabled');
      }
    }
  }, {
    BTN_TYPE_BACK: 'back',
    BTN_TYPE_NEXT: 'next',
    BTN_TYPE_CANCEL: 'cancel',
    BTN_TYPE_ACTION: 'action'
  });

  var ButtonsGroup = Marionette.CollectionView.extend({
    childView: ButtonView,
    className: 'cs-sidepanel-btngroup',
    constructor: function ButtonsGroup(options) {
      options || (options = {});
      Marionette.CollectionView.apply(this, arguments);
      this.listenTo(this, "button:click", this.delegateEvent);
    },

    onDomRefresh: function () {
      this.children.each(function (buttonView) {
        buttonView.trigger('dom:refresh');
      });
    },

    delegateEvent: function (ele) {
      this.options.footerView.trigger("button:click button:click:" + ele.type, ele);
    },

    setResizer: function (e) {
      return this.options.footerView.checkResizer(e);
    }
  });

  
  var SidePanelFooterView = Marionette.LayoutView.extend({

    template: template,

    className: 'cs-footer-control',

    regions: {
      leftContainer: '.cs-footer-left',
      rightContainer: '.cs-footer-right'
    },

    templateHelpers: function () {
      return {};
    },

    constructor: function SidePanelFooterView(options) {
      options || (options = {});
      Marionette.LayoutView.apply(this, arguments);
      this.leftCollection = new Backbone.Collection();
      this.rightCollection = new Backbone.Collection();
      this.listenTo(this, "update:footer", this.updateFooter);
    },

    checkResizer: function (e) {
      var parent = this._parent._parent;
      var tabResizer = e.shiftKey && parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement) && parent._parent.flag;
      var shiftTabResizer = !e.shiftKey && !parent._parent.options.layout.header && parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement) && parent._parent.flag;
      if (tabResizer || shiftTabResizer) {
        return parent._parent.ui.resizer;
      }
      return 0;
    },

    onRender: function () {
      var options = {
        sidePanelView: this.options.parentView,
        footerView: this
      };
      this.leftGroup = new ButtonsGroup(_.extend(options, {
        collection: this.leftCollection
      }));
      this.rightGroup = new ButtonsGroup(_.extend(options, {
        collection: this.rightCollection
      }));
      this.rightGroup.completeCollection = new Backbone.Collection();
      this.rightGroup.completeCollection.add(this.rightCollection.toJSON(), { silent: true });
      this.leftContainer.show(this.leftGroup);
      this.rightContainer.show(this.rightGroup);
      this.listenTo(this.rightGroup.completeCollection, "reset", _.bind(function () {
        this.rightGroup.flag= true;
      }, this));
      this.listenTo(this.rightGroup.completeCollection, "change update", _.bind(function () {
        this.rightGroup.flag = true;
        this.expand();
        this.options.parentView.trigger("update:footerview");
      }, this));
      this.listenTo(this.leftGroup, "childview:click", this._onButtonClick);
      this.listenTo(this.rightGroup, "childview:click", this._onButtonClick);
    },

    _onButtonClick: function (btnView) {
      var btn = btnView.model;
      btn && this.trigger("button:click button:click:" + btn.get("type"), btn.attributes);
    },

    update: function (options) {

      var footerOptions = options.slide.footer ||
                          _.pick(options.slide, 'buttons', 'leftButtons', 'rightButtons'),
          leftButtons   = footerOptions.leftButtons || [],
          rightButtons  = footerOptions.rightButtons || [];

      if (footerOptions.hide) {
        this.$el.addClass('binf-hidden');
      } else {
        this.$el.removeClass('binf-hidden');
      }

      if (_.isArray(footerOptions.buttons)) {
        rightButtons = Array.prototype.concat(rightButtons, footerOptions.buttons);
      }

      if (options.slideIndex > 0) {
        this._addButtonIfNotFound(leftButtons, 0, {
          type: ButtonView.BTN_TYPE_BACK,
          toolTip: lang.btnBack,
          className: "cs-go-back arrow_back csui-has-v2icon",
          v2Icon: {
            iconName: 'csui_action_arrow_back',
            states: true,
            handleRTL: true,
            size: 'xsmall'
          },      
        });
      }
      if (options.slideIndex + 1 < options.totalSlides) {
        this._addButtonIfNotFound(rightButtons, rightButtons.length, {
          type: ButtonView.BTN_TYPE_NEXT,
          label: lang.btnNext,
          className: 'binf-btn binf-btn-primary'
        });
      }
      this._addButtonIfNotFound(rightButtons, rightButtons.length, {
        type: ButtonView.BTN_TYPE_CANCEL,
        id: 'csui-side-panel-cancel',
        label: this.options.footerButtonLabel ? this.options.footerButtonLabel : lang.btnCancel
      });

      this.leftCollection.reset(leftButtons);
      this.rightCollection.reset(rightButtons);
      this.rightGroup.completeCollection.reset(this.rightCollection.models);
      this.options.parentView.trigger("update:footerview");
    },

    _addButtonIfNotFound: function (buttons, index, options) {
      var found = _.find(buttons, function (btn) {
        return btn.type === options.type;
      });
      if (!found) {
        buttons.splice(index, 0, options);
      }
    },

    updateButton: function (id, attributes) {
      var button = this.leftCollection.get(id) || this.rightCollection.get(id);
      var activeElement = $(document.activeElement);
      if (button) {
        button.set(attributes);
        activeElement.attr('type') === 'text' && !!activeElement.val() &&
        activeElement.trigger('focus');
      }
    },

    onDomRefresh: function () {
      this.leftGroup.triggerMethod('dom:refresh');
      this.rightGroup.triggerMethod('dom:refresh');
      this.options.parentView.trigger("update:footerview");
    },

    updateFooter: function () {
      var availableWidth = (this.$el.width() - this.leftGroup.$el.width()) - 40;
      if (this.$el.is(":visible") ){
      this.updateFooterView(this.rightGroup, availableWidth);
      }
    }
    
  });

  _.extend(SidePanelFooterView.prototype, FooterViewResponsiveMixin);

  return SidePanelFooterView;
});
