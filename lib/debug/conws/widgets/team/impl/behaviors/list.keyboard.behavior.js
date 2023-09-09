csui.define([
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette'
], function (module, _, $, Marionette) {
  'use strict';

  var ListKeyboardBehavior = Marionette.Behavior.extend({

    defaults: {
      'currentlyFocusedElementSelector': 'li:nth-child({0})'
    },

    constructor: function ListKeyboardBehavior(options, view) {
      // apply marionette behavior implementation
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      // extend the views
      _.extend(view, {

        // storage for the selected index
        selectedIndex: 0,

        // support up/down navigation
        onKeyDown: function (e) {
          var $preElem = this.currentlyFocusedElement();

          switch (e.keyCode) {
          case 38: // up
            this._moveTo(e, this._selectPrevious(), $preElem);
            break;
          case 40: // down
            this._moveTo(e, this._selectNext(), $preElem);
            break;
          }
        },

        _moveTo: function (event, $elem, $preElem) {
          event.preventDefault();
          event.stopPropagation();

          setTimeout(_.bind(function () {
            $preElem && $preElem.prop('tabindex', '-1');
            $elem.prop('tabindex', '0');
            $elem.trigger('focus');
          }, this), 50);
        },

        _selectNext: function () {
          var collection = this.model || this.collection;
          if (this.selectedIndex < collection.length - 1) {
            this.selectedIndex++;
          }
          return this.currentlyFocusedElement();
        },

        _selectPrevious: function () {
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
          }
          return this.currentlyFocusedElement();
        },

        currentlyFocusedElementSelector: this.options.currentlyFocusedElementSelector,

        currentlyFocusedElement: function () {
          // reset the focused list index whenever the previous index is larger than the
          // currently rendered elements
          var collection = this.model || this.collection;
          if ((this.selectedIndex !== 0) && (this.selectedIndex >= collection.length)) {
            this.selectedIndex = collection.length - 1;
          }
          // find the element at the current index and return
          var $item = this.$(_.str.sformat(this.currentlyFocusedElementSelector, this.selectedIndex + 1));
          var elementOfFocus = ($item.length !== 0) ? this.$($item[0]) : null;
          return elementOfFocus;
        }
      });
    } // constructor
  });

  return ListKeyboardBehavior;
});
