/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/marionette',
  'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'hbs!smart/controls/side.panel/impl/header',
  'i18n!smart/controls/side.panel/impl/nls/lang',
  'css!smart/controls/side.panel/impl/side.panel'
], function (_, $, Marionette, TabableRegion, template, lang) {

  var SidePanelHeaderView = Marionette.ItemView.extend({

    template: template,

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    isTabable: function () {
     return this.$('*[tabindex]').length > 0;
    },
    
    currentlyFocusedElement: function (event) {
      var parent = this._parent._parent;
      if (parent._parent.options.layout.resize && parent._parent.ui.resizer.is(document.activeElement)) {
        return parent._parent.ui.resizer;
      }
     return this.$('*[tabindex]')[0];
    },
    
    onLastTabElement: function (shiftTab, event) {
     return (shiftTab && event.target === this.$('*[tabindex]')[0]);
    },

    className: 'cs-header-control',

    ui: {
      title: '.csui-sidepanel-title .csui-sidepanel-heading',
      subTitle: '.csui-sidepanel-title .csui-sidepanel-subheading',
      closeBtn: '.csui-sidepanel-close'
    },

    events: {
      'keydown': 'onKeyInView'
    },

    triggers: {
      "click @ui.closeBtn": "close:click"
    },

    onKeyInView: function (event) {
      var keyCode = event.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        $(event.target).trigger('click');
      }
    },

    templateHelpers: function () {
      return {
        closeTooltip: lang.closeBtnTooltip,
        closeAria: lang.closeBtnTooltip // the actual title is not yet known at this point
      };
    },

    constructor: function SidePanelHeaderView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, 'update:header', this.update);
    },

    update: function (slide) {
      this.ui.title.text(slide.title);
      this.ui.title.attr({'title': slide.title});
      this.ui.closeBtn.attr('aria-label', _.str.sformat(lang.closeBtnAria, slide.title));
      if (!!slide.subTitle) {
        this.ui.title.removeClass('csui-no-subheading');
        this.ui.subTitle.removeClass('binf-hidden');
        this.ui.subTitle.text(slide.subTitle);
        this.ui.subTitle.attr({'title': slide.subTitle});
      } else {
        this.ui.subTitle.addClass('binf-hidden');
        this.ui.title.addClass('csui-no-subheading');
      }
    }

  });

  return SidePanelHeaderView;
});