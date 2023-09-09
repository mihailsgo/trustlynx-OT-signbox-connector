/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/log',
  'nuc/utils/base',
  'csui/behaviors/keyboard.navigation/tabkey.behavior',
  'smart/dialogs/modal.alert/modal.alert'
], function (_, $, log, base, TabKeyBehavior, SmartModelAlert) {
  'use strict';

  log.warn("Use modal alert from smart controls instead of depending on csui modal alert");
  var ModalAlertView = SmartModelAlert.extend({
    behaviors: {
      TabKeyBehavior: {
        behaviorClass: TabKeyBehavior,
        recursiveNavigation: true
      }
    },

    constructor: function ModalAlertView(options) {
      SmartModelAlert.prototype.constructor.call(this, options);
      this.listenTo(this, 'modalalert:after:shown', _.bind(this.afterModalAlertShown, this));
    },
    afterModalAlertShown: function (tabShift) {
      var tabElements = this.$el.find('*[tabindex=0]'),
          lastIndex = tabElements.length - 1,
          i = this._getStartIndex(lastIndex, tabShift, tabElements);
      if (lastIndex > -1) {
        var activeIndex = (this.activeIndex !== undefined) ? this.activeIndex :
                          (tabShift ? 0 : lastIndex);
        do {
          var $tabElem = $(tabElements[i]);
          if (base.isVisibleInWindowViewport($tabElem)) {
            this.activeIndex = i;
            $tabElem.trigger('focus');
            break;
          }
          if (tabShift) {
            i = (i === 0) ? lastIndex : i - 1;
          } else {
            i = (i === lastIndex) ? 0 : i + 1;
          }
        }
        while (i != activeIndex);
      }
      return false;

    },
    _getStartIndex: function (lastIndex, tabShift) {
      var startIndex = 0,
          activeIndex = this.activeIndex;
      if (tabShift) {
        startIndex = lastIndex;
        if (activeIndex !== undefined && activeIndex > 0) {
          startIndex = this.activeIndex - 1;
        }
      } else {
        if (activeIndex !== undefined && activeIndex < lastIndex) {
          startIndex = activeIndex + 1;
        }
      }
      return startIndex;
    },
  }, {
    _show: function (options) {
      var alert = new ModalAlertView(options);
      return alert.show();
    }

  });

  return ModalAlertView;
});
