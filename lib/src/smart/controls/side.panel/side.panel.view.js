/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/backbone', 'nuc/lib/marionette',
  'smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'smart/behaviors/keyboard.navigation/smart.tabables.behavior',
  'smart/controls/side.panel/impl/footer.view',
  'smart/controls/side.panel/impl/header.view',
  'hbs!smart/controls/side.panel/impl/side.panel',
  'smart/utils/non-emptying.region/non-emptying.region',
  'nuc/utils/log',
  'nuc/utils/base',
  'smart/utils/smart.base',
  'i18n',
  'css!smart/controls/side.panel/impl/side.panel',
  'smart/lib/binf/js/binf'
], function (module, _, $, Backbone, Marionette, LayoutViewEventsPropagationMixin,
  TabablesBehavior, FooterView, HeaderView, template, NonEmptyingRegion, log, base, smartbase, i18n) {
  log = log(module.id);

  var config = module.config(),
    LAYOUT_DEFAULTS = {
      header: true,
      footer: true,
      mask: true,
      resize: false,
      size: "small"
    },

    SIZECLASSES = {
      small: 'csui-sidepanel-small',
      medium: 'csui-sidepanel-medium',
      large: 'csui-sidepanel-large',
      custom: 'csui-sidepanel-custom'
    },

    DEFAULTS = _.defaults(config, {
      backdrop: 'static',
      keyboard: true,
      focus: true,
      openFrom: 'right',
      layout: _.defaults(config.layout || {}, LAYOUT_DEFAULTS)
    });

  var SidePanelView = Marionette.LayoutView.extend({

    className: function () {
      var classNames = ['csui-sidepanel'];
      if (!!this.options.sidePanelClassName) {
        classNames.push(this.options.sidePanelClassName);
      }
      if (SidePanelView.SUPPORTED_SLIDE_ANIMATIONS.indexOf(this.options.openFrom) !== -1) {
        classNames.push('csui-sidepanel--from-' + this.options.openFrom);
      }
      if (!this.options.layout.mask) {
        classNames.push('csui-sidepanel-with-no-mask');
      }
      if (this.options.layout.resize) {
        classNames.push('csui-sidepanel-with-resize');
      }
      classNames.push(SIZECLASSES[this.options.layout.size]);      
      return _.unique(classNames).join(' ');
    },

    attributes: {
      tabindex: -1
    },

    template: template,

    templateHelpers: function () {
      return {
        backdrop: this.options.backdrop,
        hasHeader: this.options.layout.header,
        hasFooter: this.options.layout.footer,
        enableResize: this.options.layout.resize,
        title: this.options.title
      };
    },
    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },
    ui: {
      body: '.csui-sidepanel-body',
      header: '.csui-sidepanel-header',
      backdrop: '.csui-sidepanel-backdrop',
      container: '.csui-sidepanel-container',
      resizer: '.csui-side-panel-resizer'
    },

    events: {
      'click @ui.backdrop': 'onBackdropClick',
      'keyup': 'onKeyInView',
      'keydown': 'handleKeyDown'
    },

    regions: function () {
      return {
        header: '@ui.header',
        body: '@ui.body',
        footer: '.csui-sidepanel-footer'
      };
    },

    constructor: function SidePanelView(options) {
      var layoutDefaults = _.defaults(options.layout || {}, LAYOUT_DEFAULTS);
      options = _.defaults(options, DEFAULTS);
      options.layout = layoutDefaults;
      options.backdrop = options.layout.mask && options.backdrop;
      var slides = this.extractSlides(options);
      if (!slides || !_.isArray(slides) || !slides.length) {
        throw new Marionette.Error({
          name: 'NoSildesError',
          message: '"slides" must be specified'
        });
      }
      this.slides = slides;

      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      $(window).on('resize', {view: this}, this.onDomRefresh);
      this.$el.on('resize', this.onDomRefresh);
      this.propagateEventsToRegions();
    },

    extractSlides: function (options) {
      if (_.isArray(options.slides) && options.slides.length) {
        return options.slides;
      }
      var slideInfo = _.pick(options, 'title', 'subTitle', 'headerView', 'content', 'footer',
          'buttons', 'leftButtons', 'rightButtons');
      if (_.isEmpty(slideInfo)) {
        return undefined;
      }
      return [slideInfo];
    },

    getWidth: function(el){
      return el && el.width();
    },

    onDomRefresh: function (event) {
      var self = event && event.data && event.data.view;
      self = self || this;
      self.updateFooter();
    },

    updateFooter: function () {
      var self= this;
      var callbackUpdateFooter = function () {
        self && self.options.layout.footer && self.footerView.trigger('update:footer');
      };
      callbackUpdateFooter();
      self && self.options.layout.resize && self.$el.find(".csui-sidepanel-container").on(self._transitionEnd(), callbackUpdateFooter);
    },

    _transitionEnd: _.once(
      function () {
        var transitions = {
          transition: 'transitionend',
          WebkitTransition: 'webkitTransitionEnd',
          MozTransition: 'transitionend',
          OTransition: 'oTransitionEnd otransitionend'
        },
          element = document.createElement('div'),
          transition;
        for (transition in transitions) {
          if (typeof element.style[transition] !== 'undefined') {
            return transitions[transition];
          }
        }
      }),

    setWidth: function (el, flag) {
      setTimeout(_.bind(function () {
        flag = this.options.openFrom === 'left' || smartbase.isRTL() ? !flag : flag;
        var width = this.getWidth(el);
        var widthInPercentage = (width * 100) / (document.body.clientWidth > this.$el.width() ? document.body.clientWidth : this.$el.width());
        var newWidth = flag ? widthInPercentage + 15 : widthInPercentage - 15;
        newWidth = newWidth > 100 ? 100 : newWidth;
        el.width(newWidth + "%");
        el.find(".csui-side-panel-resizer").attr("aria-valuenow",newWidth + "%");
        this.updateFooter();
        return;
      }, this), 300);
    },

    handleKeyDown: function (event){ 
      this.trigger('keydown', event);
      if (event.keyCode === 9) {
        var footerlast = this.options.layout.footer && this.footerView.$el.find('.cs-footer-btn, a.binf-dropdown-toggle').last();
        var headerFirst = this.options.layout.header && this.headerView.$el.find('*[tabindex]').last();
        var tabResizer = !event.shiftKey && (event.target === this.ui.container[0] || (footerlast && footerlast.is(event.target)));
        var shiftTabResizer = event.shiftKey && (headerFirst && headerFirst.is(event.target));

        if (event.target === this.ui.resizer[0] && event.shiftKey) {
          this.options.layout.footer && footerlast.trigger("focus");
          event.preventDefault();
          event.stopPropagation();
        }

        else if (tabResizer || shiftTabResizer || event.target === this.ui.container[0]) {
          if (this.options.layout.resize) {
            this.ui.resizer.trigger("focus");
            this.flag = true;
            event.preventDefault();
            event.stopPropagation();
          }

        } else {
          this.flag = false;
        }
      }
      var isESC = this.options.layout.footer ? !this.footerView.isESC : true;
      if (this.options.keyboard && event.keyCode === 27 && !event.isDefaultPrevented() &&  isESC) {
        this.hide();
      }

      if (this.ui.resizer.length && event && $(event.target)[0] === this.ui.resizer[0]) {
        if (event.keyCode === 37) {
          this.setWidth(this.$el.find('.csui-sidepanel-container'), true);
        }
        if (event.keyCode === 39) {
          this.setWidth(this.$el.find('.csui-sidepanel-container'), false);
        }
      }
    },

    onKeyInView: function (event) {
      var isESC = this.options.layout.footer ? !this.footerView.isESC : true;
      if (this.options.keyboard && event.keyCode === 27 && !event.isDefaultPrevented() &&  isESC) {
        this.hide();
      }
    },

    onBackdropClick: function () {
      if (this.options.backdrop === 'static') {
        this.$el.trigger('focus');
      } else {
        this.hide();
      }
    },

    updateButton: function (id, options) {
      if (this.options.layout.footer) {
        if (!this.footerView.updateButton) {
          throw new Error('Dialog footer does not support button updating.');
        }
        this.footerView.updateButton(id, options);
      }
    },

    show: function (callback) {
      this.trigger("before:show");
      if (!Marionette.isNodeAttached(this.el)) {
        var container = $.fn.binf_modal.getDefaultContainer(),
            region    = new NonEmptyingRegion({
              el: container
            });
        region.show(this);
        setTimeout(_.bind(this._doShow, this, callback));
      } else {
        this._doShow(callback);
      }
      return this;
    },

    _doShow: function (callback) {
      this.$el.addClass("csui-sidepanel-visible");
      $('body').addClass('csui-sidepanel-open');
      this.options.focus && this.ui.container[0].focus();
      this.trigger("after:show");
      _.isFunction(callback) && callback.call(this);
    },

    close: function () {
      log.warn('DEPRECATED: .close() has been deprecated. Use .hide() instead.')
      && console.warn(log.last);
      this.hide();
    },

    hide: function (callback) {
      this.trigger("before:hide");
      this.doDestroy(function () {
        this.trigger("after:hide");
        _.isFunction(callback) && callback.call(this);
      });
    },

    destroy: function () {
      this.hide();
    },

    doDestroy: function (callback) {
      base.onTransitionEnd(this.$el, function () {
        Marionette.LayoutView.prototype.destroy.call(this);
        _.isFunction(callback) && callback.call(this);
      }, this);
      this.$el.removeClass("csui-sidepanel-visible");
    },

    onDestroy: function () {
      this._doCleanup();
    },

    _doCleanup: function () {
      $('body').removeClass('csui-sidepanel-open');
    },

    onRender: function () {

      if (this.options.layout.header) {
        this.headerView = new HeaderView(this.options);
        this.header.show(this.headerView);
      }

      this.contentHolders = [];

      if (this.options.layout.footer) {
        this.options.parentView = this;
        this.footerView = new FooterView(this.options);
        this.footer.show(this.footerView);
        this.listenTo(this, "update:footerview", this.updateFooter);
        this.listenTo(this, "after:show", this.updateFooter);
      }

      this._registerEventHandlers();
      this._showSlide(0, this.onSetFocus);

      if (this.options.layout.resize) {
        require(['smart/controls/side.panel/impl/side.panel.util'], _.bind(function (SidePanelUtil) {
          var panelResizeOptions = {
            handleSelector: ".csui-side-panel-resizer",
            resizeHeight: false
          };
          if (!!this.options.contentView) {
            panelResizeOptions.view = this.options.contentView;
          }
          if (!!this.options.thresholdWidth) {
            panelResizeOptions.thresholdWidth = this.options.thresholdWidth;
          }
          if(this.options.layout.footer){
            panelResizeOptions.sidePanelView = this;
          }
          this.$el.find('.csui-sidepanel-container').panelResizable(panelResizeOptions);
        }, this));
      }
    },

    _registerEventHandlers: function () {
      if (this.options.layout.footer) {
        this.listenTo(this.footerView, "button:click:back", this._onBackClick)
            .listenTo(this.footerView, "button:click:next", this._onNextClick)
            .listenTo(this.footerView, "button:click:cancel", this._onCancelClick)
            .listenTo(this.footerView, "button:click", this._onBtnClick)
            .stopListening(this.footerView, "update:header")
            .listenTo(this.footerView, "update:header", _.bind(function (headerModel) {
              this.headerView.trigger('update:header', headerModel);
              this._updateTitle(headerModel);
            }, this));
      }
      this.listenTo(this, "click:next", this._onNextClick);
      this.listenTo(this, "click:previous", this._onBackClick);

      this.listenTo(this, "refresh:buttons", this.refreshButtons);
      this.listenTo(this, "update:button", this.updateButton);
      if (this.options.layout.header) {
        this.listenTo(this.headerView, "close:click", _.bind(function(){
          this.trigger('close:button:clicked');
          this.hide();
        }, this));
      }
    },

    _updateTitle: function (options) {
      var slide = this.slides[this.currentSlideIndex];
      if (!!slide) {
        slide.title = options.title;
        slide.subTitle = options.subTitle;
      }
    },

    _onBackClick: function () {
      this._showSlide(this.currentSlideIndex - 1);
    },

    _onNextClick: function () {
      this._showSlide(this.currentSlideIndex + 1);
    },

    _onCancelClick: function () {
      this.hide();
    },

    _onBtnClick: function (btn) {
      if (_.isFunction(btn.click)) {
        var clickEvent = $.Event('click');
        btn.click(clickEvent, this.currentSlide);
        if (clickEvent.isDefaultPrevented()) {
          return;
        }
      }
      Marionette.triggerMethodOn(this.currentSlide.content, "button:click", btn);
      if (btn.close) {
        this.hide();
      }
    },
    _showSlide: function (slideIndex, finishCallback) {
      this._cleanUpCurrentSlide();
      var slide = this.slides[slideIndex];
      this.trigger("show:slide", slide, slideIndex);

      this._updateHeader(slide);
      this._updateBody(slide, slideIndex, finishCallback);
      if (this.options.layout.footer) {
        this.footerView.update({
          slide: slide,
          slideIndex: slideIndex,
          totalSlides: this.slides.length
        });
        if (slide.footer && slide.footer.hide) {
          this.$el.addClass('no-footer');
        } else {
          this.$el.removeClass('no-footer');
        }
      }

      this.currentSlide = slide;
      this.currentSlideIndex = slideIndex;
      this.trigger("shown:slide", slide, slideIndex);
      this.listenTo(slide.content, "update:button", this.updateButton);
      this.stopListening(slide.content, "update:header")
          .listenTo(slide.content, "update:header", _.bind(function (headerModel) {
            this.headerView.trigger('update:header', headerModel);
            this._updateTitle(headerModel);
          }, this));
      this._completeSlideShow(slide);
    },

    _completeSlideShow: function (slide) {
      if (!!slide.containerClass) {
        this.ui.container.addClass(slide.containerClass);
      }
    },

    _cleanUpCurrentSlide: function () {
      if (!this.currentSlide) {
        return;
      }
      if (this.currentSlide.containerClass) {
        this.ui.container.removeClass(this.currentSlide.containerClass);
      }
    },

    _updateHeader: function (slide) {
      if (this.options.layout.header) {
        if (!_.isUndefined(this.currentSlideIndex) &&
            this.slides[this.currentSlideIndex] &&
            this.slides[this.currentSlideIndex].headerView) {
          this.slides[this.currentSlideIndex].headerView.$el.addClass('binf-hidden');
        }
        if (!!slide.headerView) {
          var headerRegion = new NonEmptyingRegion({
            el: this.ui.header
          });
          headerRegion.show(slide.headerView);
          slide.headerView.$el.removeClass('binf-hidden');
          this.headerView.$el.addClass('binf-hidden');
        } else {
          this.headerView.$el.removeClass('binf-hidden');
          this.headerView.trigger('update:header', slide);
        }
      }
    },

    onSetFocus: function () {
      this._focusonFirstFocusableElement();
    },

    _focusonFirstFocusableElement: function () {
      var focusableElements = base.findFocusables(this.ui.body);
      if (focusableElements.length) {
        focusableElements.first().trigger("focus");
      }
    },

    _updateBody: function (slide, index, finishCallback) {
      if (!slide.content) {
        throw new Marionette.Error({
          name: 'NoContentError',
          message: '"content" must be specified.'
        });
      }
      if (!_.isUndefined(this.currentSlideIndex)) {
        var currentContent = this.contentHolders[this.currentSlideIndex];
        currentContent.$el.removeClass('csui-slide-visible');
        currentContent.$el.addClass('csui-slide-hidden');
        this.stopListening(currentContent, 'dom:refresh');
      }

      if (index >= this.contentHolders.length) {
        this.contentHolders.push(slide.content);
        var bodyRegion = new NonEmptyingRegion({
          el: this.ui.body
        });
        this.listenToOnce(slide.content, 'show', function () {
          _.isFunction(finishCallback) && finishCallback.call(this);
        });
        bodyRegion.show(slide.content);
        this.listenToOnce(slide.content, 'dom:refresh', function () {
          this.triggerMethod('dom:refresh');
        });
      }
      var content = this.contentHolders[index];
      content.$el.removeClass('csui-slide-hidden');
      content.$el.addClass('csui-slide-visible');
    },

    onShow: function () {
      if (this.options.layout.footer && this.footerView && this.footerView.triggerMethod) {
        this.footerView.triggerMethod('dom:refresh');
        this.footerView.triggerMethod('after:show');
      }
    }

  }, {
    SUPPORTED_SLIDE_ANIMATIONS: ["left", "right"]
  });

  LayoutViewEventsPropagationMixin.mixin(SidePanelView.prototype);

  return SidePanelView;
});
