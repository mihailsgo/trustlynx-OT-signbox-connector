/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/controls/tab.panel/impl/tab.link.view', 'csui/utils/base',
  'hbs!csui/controls/tab.panel/impl/tab.link.ext',
  'i18n!csui/controls/tab.panel/impl/nls/lang', 'i18n',
  'csui/lib/binf/js/binf'
], function (_, TabLinkView, base, tabLinkExtTemplate, lang, i18n) {
  "use strict";

  var TabLinkViewExt = TabLinkView.extend({

    template: tabLinkExtTemplate,
    templateHelpers: function () {
      var uniqueTabId = this.model.get('uniqueTabId'),
          title       = this._getTitle();
      return {
        linkId: 'tablink-' + uniqueTabId,
        selected: this._isOptionActiveTab(),
        required_tooltip: lang.requiredTooltip,
        delete_icon: this.options.delete_icon || 'circle_delete',
        delete_tooltip: this.options.delete_tooltip || lang.deleteTooltip,
        deleteTabAria: _.str.sformat(lang.deleteTabAria, title),
        tabTitle: title
      };
    },

    events: {
      'show.binf.tab > a': 'onShowingTab',
      'shown.binf.tab > a': 'onShownTab',
      'focus .cs-delete-icon': 'onFocusDeleteIcon',
      'blur .cs-delete-icon': 'onBlurDeleteIcon',
      'click .cs-tablink-delete': 'onDelete'
    },

    ui: {
      link: '>a',
      deleteIcon: '.cs-delete-icon',
      deleteIconParent: '.cs-tablink-delete'
    },

    constructor: function TabLinkViewExt(options) {
      this.options = options || {};
      TabLinkView.prototype.constructor.apply(this, arguments);

      this.listenTo(this.model, 'action:updated', function () {
        this._setRemoveable();
      });
    },

    onRender: function () {
      this._setRemoveable();
    },

    _getTitle: function () {
      var title = this.model.get('title'),
          tabTitle;
      if (_.isObject(title)) {
        var defaultValue    = '',
            loadableLocales = i18n.settings.loadableLocales;
        for (var i = 0; i < loadableLocales.length; i++) {
          var locale = loadableLocales[i].toLowerCase();
          if (!!title[locale]) {
            defaultValue = title[locale];
            break;
          }
        }
        tabTitle = base.getClosestLocalizedString(title, defaultValue);
      } else {
        tabTitle = title;
      }
      return tabTitle;
    },

    _setRemoveable: function () {
      if (!!this.model.get('removeable')) {
        this.ui.deleteIcon.addClass('removeable');
        this.ui.deleteIcon.attr('data-cstabindex', '0');
        this.ui.deleteIconParent.removeClass('binf-hidden');
      } else {
        this.ui.deleteIcon.removeClass('removeable');
        this.ui.deleteIcon.removeAttr('data-cstabindex');
        this.ui.deleteIconParent.addClass('binf-hidden');
      }
    },

    onFocusDeleteIcon: function () {
      this.ui.deleteIconParent.addClass('focused');
    },

    onBlurDeleteIcon: function () {
      this.ui.deleteIconParent.removeClass('focused');
    },

    onDelete: function (event) {
      event.preventDefault();
      this.deleteCurrentTab();
    },

    deleteCurrentTab: function () {
      if (this.model.get('allow_delete') === true && this.model.get('removeable') === true) {
        this.triggerMethod('delete:tab');
      }
    }

  });

  return TabLinkViewExt;

});
