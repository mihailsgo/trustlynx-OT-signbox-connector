csui.define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/icons.v2',
  'csui/utils/high.contrast/detector!',
  'hbs!conws/widgets/header/impl/collapse/collapse',
  'i18n!conws/widgets/header/impl/nls/header.lang',
  'css!conws/widgets/header/impl/collapse/collapse'
], function ($, _, Marionette, iconRegistry, highContrast, template, lang) {
  'use strict';

  var CollapseView = Marionette.ItemView.extend({

    className: 'conws-collapse',

    template: template,

    events: {
      'keydown': 'onKeyInView',
      'click': '_executeCollapse'
    },

    constructor: function CollapseView(options) {
      this.options = options || {};
      this.options.title = lang.CollapsePageOverlay;
      this.options.icon = "icon";

      if (highContrast === 2) {
        this._useIconsForDarkBackground = false;
      }
      else {
       this._useIconsForDarkBackground = true;
      }
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

    },
    //The template helpers are used to provide placeholders
    // for the widget
    templateHelpers: function () {
      var obj = {
        title: this.options.title,
        icon: this.options.icon,
        iconTheme: this._useIconsForDarkBackground ? 'dark' : ''
      };
      return obj;
    },

    onKeyInView: function (event) {
      var target = $(event.target);
      if (event.keyCode === 13 || event.keyCode === 32) {  // enter(13) and space(32)
        this._executeCollapse(event);
      }
    },

    _executeCollapse: function (e) {
      if (this.options.perspective) {
        this.options.perspective.trigger('close:workspace:dialog');
      }
    }
  });
  return CollapseView;
});