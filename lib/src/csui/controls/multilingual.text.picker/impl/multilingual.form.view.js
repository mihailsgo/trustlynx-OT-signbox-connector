/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "csui/lib/underscore",
  "csui/lib/jquery",
  "i18n",
  "csui/lib/marionette3",
  "i18n!csui/controls/multilingual.text.picker/impl/nls/lang",
  "csui/utils/base",
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  "hbs!csui/controls/multilingual.text.picker/impl/multilingual.form",
  "css!csui/controls/multilingual.text.picker/impl/multilingual.form",
  "csui/lib/binf/js/binf",
  "csui/lib/handlebars.helpers.xif"
], function (_,
    $,
    i18n,
    Marionette,
    lang,
    base,
    PerfectScrollingBehavior,
    template) {
  var MultiLingualFormView = Marionette.View.extend({
    template: template,
    className: "cs-multilingual-form",

    templateContext: function () {
      return {
        formHeading: lang.formHeading,
        enableheading: this.options.isDialog,
        languages: this.data,
        btnDone: lang.btnDone,
        btnCancel: lang.btnCancel,
        valueRequired: lang.valueRequired,
        isPopover: !this.options.isDialog,
        textFieldRequired: this.options.textField
      };
    },

    ui: {
      errorMsg: ".csui-inlineform-required-error",
      invisibleOverlay: '.csui-multilingual-invisibleOverlay',
      textareaFields: 'textarea'
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.cs-ml-form-container',
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    events: {
      "keyup @ui.textareaFields": 'adjustTextareaHeight',
      'keyup': 'onPopoverKeyUp',
      'keydown input, @ui.textareaFields': 'onKeyDown',
      'focus input, @ui.textareaFields': 'onFieldFocus'
    },
    constructor: function MultiLingualForm(options) {
      Marionette.View.apply(this, arguments);
      this.options = options || (options = {});

      this.initializationData();

      this.listenTo(this, 'ml:show:popover', _.bind(this.showPopover, this));
      this.listenTo(this, 'ml:hide:popover', _.bind(this.closePopover, this));
    },

    initializationData: function () {
      this.prevData = '';
      _.defaults(this.options, {
        valueRequired: false,
        textField: true
      });
      this.targetElement = $($.fn.binf_modal.getDefaultContainer());
      this.data = this.options.data;
      var defaultLangIndex = _.findIndex(this.data, {default: true}),
          userMetadata_Language_code = base.getUserMetadataLanguageInfo(),
          userMetadataLangIndex;

      if (defaultLangIndex !== 0) {
        var defaultLang = this.data.splice(defaultLangIndex, 1);
        this.data.unshift(defaultLang[0]);
      }
      userMetadataLangIndex = _.findIndex(this.data,
          {language_code: userMetadata_Language_code});
      if (userMetadataLangIndex > 0) {
        var userMetadataLanguage = this.data.splice(userMetadataLangIndex, 1);
        this.data.unshift(userMetadataLanguage[0]);
      }
      this.options.popoverTargetElement.parent().addClass("csui-multilingual-input");
      this.globeIcon = this.options.mlGlobeIcon;
      this.globeIcon && this.globeIcon.prop({
        'title': lang.globeIcon,
        'ariaLabel': lang.globeIcon,
        'ariaExpanded': false
      });
    },

    _setFocus: function (event) {
      var setOnFirstElement = !event.shiftKey;
      var allInputs = this.$el.find("input,textarea"),
          targetIndex = setOnFirstElement ? 0 : allInputs.length - 1,
          targetFocusableEle = allInputs.eq(targetIndex);
      targetFocusableEle.trigger('focus');
    },

    _onClickDone: function (e) {
      this.options.changetoReadmodeOnclose && !this.options.valueRequired &&
      (this.options.parentView.isF2KeyPressed = true);
      this.options.popoverTargetElement.prop("disabled", false);
      this.options.popoverTargetElement.removeClass("mlDisabled");
      this.isPopoverOpen = false;
      this._result = this.getData();
      this.ui.errorMsg.hide();
      if (this._result) {
        this.prevData = '';
        this.removeEventBindings();
        this.$popover.binf_popover("destroy");
        this.globeIcon.trigger("focus");
      } else {
        if (this.options.valueRequired) {
          this.ui.errorMsg.show();
          this.$el.find(".binf-row:first input,.binf-row:first textarea").trigger('focus');
        } else {
          this.closePopover();
        }
      }
      e && e.preventDefault();
    },
    closePopover: function () {
      this.options.popoverTargetElement.prop("disabled", false);
      this.options.popoverTargetElement.removeClass("mlDisabled");
      this.$popover && this.$popover.binf_popover("destroy");
      this.removeEventBindings();
    },

    getData: function () {
      var that = this,
          errorMsgFlag = true;
      this.prevData = JSON.parse(JSON.stringify(this.data));
      _.each(this.data, function (lang) {
        lang.value = that.$el.find("#input-" + lang.language_code).val();
        if (lang.value && lang.value.trim()) {
          errorMsgFlag = false;
        }
      });
      return this.options.valueRequired && errorMsgFlag ? null : this.data;
    },

    _placement: function () {
      var popoverTargetElement = this.options.popoverTargetElement,
          offsetTop = popoverTargetElement.offset().top,
          scrollHeight = document.body.getBoundingClientRect().top,
          windowHeight = $(window).height(),
          topPostion = scrollHeight ? scrollHeight + offsetTop : offsetTop,
          elementHeight = popoverTargetElement.is('textarea') ? 26 :
                          popoverTargetElement.innerHeight(), // textarea is having dynamic height so we considering only initial height
          parentTable = popoverTargetElement.closest('.csui-outertablecontainer'),
          parentTab = popoverTargetElement.closest('.binf-tab-content'),
          header = parentTable.find('thead').length > 0 ? parentTable.find('thead').outerHeight() :
                   parentTable.find('.csui-thumbnail-header').outerHeight(),
          pagination = parentTable.find('.csui-table-paginationview'),
          toolbarHeight = parentTable.length && !scrollHeight ? parentTable.offset().top + header :
                          parentTab.length ? parentTab.offset().top + scrollHeight + 18 : 0, // 35 is padding other values sum of popover
          paginationHeight = pagination.length ? pagination.outerHeight() : 20, // 20 is default bottom for pop0ver
          avilableBottom = windowHeight - (topPostion + paginationHeight + elementHeight),
          popoverArrowElHeight = 17, // height of popover arrow + borders
          avilableTop = windowHeight - (avilableBottom + toolbarHeight + elementHeight),
          isSpaceAvailable = (avilableBottom + avilableTop) < windowHeight / 2;
      if (isSpaceAvailable) {
        avilableTop = windowHeight - (avilableBottom + elementHeight);
      }
      if (avilableBottom > avilableTop) {
        this.popOverHeight = avilableBottom - popoverArrowElHeight;
        return "bottom";
      } else {
        this.popOverHeight = avilableTop - popoverArrowElHeight - 1; //here 1 is border height
        !!scrollHeight && (this.popOverHeight -= paginationHeight);
        if ((!scrollHeight && popoverTargetElement.hasClass('title-input')) || isSpaceAvailable) {
          this.popOverHeight -= ($('.binf-navbar-default.csui-navbar').outerHeight() || 0);
        }
        return "top";
      }
    },

    showPopover: function () {
      this.$popover = this.targetElement;
      if (this.prevData) {
        this.data = _.clone(this.prevData);
      }
      var firstLang = this.data[0], element = this.options.popoverTargetElement;
      !!firstLang.value && firstLang.value !== element.val() && !element.hasClass("mlDisabled") &&
      (firstLang.value = element.val());
      !element.hasClass("mlDisabled") && this.options.parentView && this.options.parentView.model &&
      !this.options.parentView.model.get('id') && (firstLang.value = element.val());
      !element.hasClass("mlDisabled") && (firstLang.value = element.val());
      this._popoverDoneRequired = true;
      this.bindUIElements();
      this.render();

      if (this.options.parentView) {
        this.listenTo(this.options.parentView, 'ml:set:focus', this._setFocus);
      }
      this.options.popoverTargetElement.prop("disabled", true);
      this.options.popoverTargetElement.addClass("mlDisabled");
      var placement = this._placement();
      var popoverOptions = {
            html: true,
            content: this.el,
            trigger: "manual",
            placement: placement,
            class: "csui-multiLingual-popover"
          },
          self = this;
      this.$popover.binf_popover(popoverOptions);
      this.$popover.binf_popover("toggle");
      this.isPopoverOpen = true;
      if (i18n.settings && i18n.settings.rtl) {
        this.$el.parents(".binf-popover").addClass('csui-popover-rtl');
      }
      this.$popover &&
      this.$popover.append('<div class="csui-multilingual-invisibleOverlay"></div>');
      this.$el.parents(".binf-popover").addClass("binf-invisible").attr('aria-label',
          lang.dialogTitle).attr('role', 'dialog');
      this._onShowMLPopover(placement);
      this.$el.parents(".binf-popover").removeClass("binf-invisible");
      this.addEventBindings();
      this.$popover
          .off("shown.binf.popover")
          .on("shown.binf.popover", function () {
            self.trigger('ensure:scrollbar');
            self.$el.find(".binf-row:first input,.binf-row:first textarea").trigger("select");
            if (self.options && !self.options.textField) {
              _.each(self.$el.find('textarea'), function (textarea) {
                self.adjustTextareaHeight(undefined, textarea);
              });
            }
          });
      this.$popover
          .off("hide.binf.popover")
          .on("hide.binf.popover", function () {
            self.globeIcon.prop('ariaExpanded', false);
            if (self._popoverDoneRequired) {
                self.trigger('ml:doneWith:popover', self._result);
                self._popoverDoneRequired = false;
            }
          });
      this.$popover
          .off("hidden.binf.popover")
          .on("hidden.binf.popover", function () {
            self.$popover.parent().removeClass("csui-multilingual-input-wrapper");
            self.$popover.binf_popover("destroy");
            self.globeIcon.trigger("focus");
            self.$popover && self.$popover.find('.csui-multilingual-invisibleOverlay').remove();
          });
    },
    addEventBindings: function () {
      $(window).off('resize', _.bind(this.closePopover, this)).on('resize',
          _.bind(this.closePopover, this));
      $(window).off('popstate', _.bind(this.closePopover, this)).on('popstate',
        _.bind(this.closePopover, this));
      $(document).off('scroll', _.bind(this.closePopover, this)).on('scroll',
          _.bind(this.closePopover, this));
      $('.globe-icon-mask,.csui-multilingual-invisibleOverlay').off('click').on('click',
          _.bind(this._onClickDone, this));
    },
    removeEventBindings: function () {
      $(window).off('resize', _.bind(this.closePopover, this));
      $(document).off('scroll', _.bind(this.closePopover, this));
      $('.globe-icon-mask,.csui-multilingual-invisibleOverlay').off('click');
    },
    _onShowMLPopover: function (placement) {
      var rtl = i18n.settings && i18n.settings.rtl,
          flyOutTarget = this.options.popoverTargetElement,
          scrollPostion = document.body.getBoundingClientRect().top,
          verticalScroll = scrollPostion + window.scrollY,
          popoverContainer = this.$el.parents(".binf-popover"),
          popoverArrowEl = popoverContainer.find(".binf-arrow"),
          dialog = this.$popover.closest('.binf-modal-dialog'),
          popoverContainerWidth = popoverContainer.outerWidth(),
          globalWidth = 0,
          flyOutTopPosition,
          flyOutBottomPosition,
          flyOutleftPosition;
      popoverContainer.addClass('csui-multilingual-input-wrapper');
      scrollPostion -= verticalScroll;
      globalWidth = flyOutTarget.innerWidth() - popoverContainer.innerWidth();
      popoverArrowEl.append('<div class="globe-icon-mask" title="' + lang.globeIcon + '"></div>');
      if (dialog.length) {
        if (!base.isIE11()) {
          globalWidth -= dialog.offset().left;
        }
      }
      flyOutTopPosition = flyOutTarget.offset().top +
                          (flyOutTarget.is('textarea') ? 26 : flyOutTarget.innerHeight());
      flyOutBottomPosition = ($(window).innerHeight() - flyOutTarget.offset().top) + 10; // height of popover arrow - borders
      flyOutleftPosition = rtl ? flyOutTarget.offset().left :
                           globalWidth + flyOutTarget.offset().left;
      if (scrollPostion) {
        flyOutTopPosition += scrollPostion;
        flyOutBottomPosition = ($(window).innerHeight() -
                                (flyOutTarget.offset().top + scrollPostion)) + 10;
      }

      popoverArrowEl.removeClass('csui-remove-arrow-mark-styles');
      if (flyOutleftPosition < 0) {
        flyOutleftPosition = this.globeIcon.offset().left - 5; // here 5 is left alignment of arrow in popover
        popoverArrowEl.addClass('csui-remove-arrow-mark-styles');
      }
      if (rtl && $(window).innerWidth() < flyOutleftPosition + popoverContainerWidth) {
        flyOutleftPosition = flyOutleftPosition - popoverContainerWidth + 5; // here 5 is left alignment of arrow in popover;
        popoverArrowEl.addClass('csui-remove-arrow-mark-styles');
      }
      var cssObject = {
        position: "fixed",
        left: flyOutleftPosition,
        top: 'auto',
        bottom: 'auto'
      };
      popoverContainer.find('.cs-ml-form-container').css('maxHeight', this.popOverHeight);
      placement === 'top' ? cssObject ['bottom'] = flyOutBottomPosition :
      cssObject ['top'] = flyOutTopPosition;
      popoverContainer.css(cssObject);
    },

    onPopoverKeyUp: function (event) {
      event.stopPropagation();
      switch (event && event.keyCode) {
      case 27:
        if (this.options && this.options.changetoReadmodeOnclose) {
          this.closePopover();
          this.trigger('ml:close:writeMode');
        } else {
          this._onClickDone(event);
        }
        break;
      case 113:
        if (this.options && this.options.changetoReadmodeOnclose) {
          this._onClickDone(event);
        }
        break;
      default:
        return;
      }
    },

    onKeyDown: function (event) {
      event.stopPropagation();
      if (event.keyCode === 9) {
        var allLangInputs = this.$el.find('input,textarea'),
            length = allLangInputs.length - 1,
            currentIndex = allLangInputs.index(event.target);

        if (length === currentIndex && !event.shiftKey) {
          allLangInputs.eq(0).trigger("focus");
          event.stopPropagation();
          event.preventDefault();
        } else if (currentIndex === 0 && event.shiftKey) {
          allLangInputs.eq(length).trigger("focus");
          event.stopPropagation();
          event.preventDefault();
        }
      } else if (event.keyCode === 27 && base.isIE11()) {
        return false;
      }
    },
    adjustTextareaHeight: function (event, textareaEle) {
      var textarea = event && event.target || textareaEle,
          scrollbarHeight, textareaHeight;
      if (textarea.value === "") {
        textarea.style.height = "";
      } else {
        textarea.style.height = "26px";
        scrollbarHeight = textarea.scrollHeight,
            textareaHeight = textarea.offsetHeight;
        textarea.style.height = textareaHeight > scrollbarHeight ? textareaHeight :
                                scrollbarHeight + "px";
      }
    },
    onFieldFocus: function (event) {
      event.stopPropagation();
    },
  });
  return MultiLingualFormView;
});
