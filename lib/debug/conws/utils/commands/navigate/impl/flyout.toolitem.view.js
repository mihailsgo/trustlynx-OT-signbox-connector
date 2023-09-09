csui.define([ 'module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/utils/log',
  'csui/lib/hammer',
  'csui/controls/toolbar/flyout.toolitem.view'
],function(module, $, _, Log,
  Hammer,
  FlyoutToolItemView){

    'use strict';

    var log = new Log( module.id );

    var FlyoutToolItemView2 = FlyoutToolItemView.extend({

      constructor: function FlyoutToolItemView2(options) {
        this.options = options = options||{};
        if (this.options.longPress) {
          this.events = {
            'click': '_stopEvent',
            'click @ui.link': 'activeSubmenu',
            'keydown': 'onKeyDown'
          };
          this.listenTo(this,'toolitem:action', this._closeDropDown);
        }
        FlyoutToolItemView.prototype.constructor.call(this,options);
      },

      _stopEvent: function(e) {
        // in case of longpress mode do not propagate click events
        // and also not keydown for enter and space key in order to
        // not open the submenu, but execute the primary command.
        // also stop propagation immediately to prevent dropdown
        // opened by binf.js automatically.
        log.debug("event stopped {0}",e.type) && console.log(log.last);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      },

      activeSubmenu: function(e) {
        if (this.options.longPress) {
          this._stopEvent(e);
        }
        FlyoutToolItemView.prototype.activeSubmenu.call(this,e);
      },

      onRender: function () {
        FlyoutToolItemView.prototype.onRender.apply(this,arguments);
        if (this.options.longPress) {
          this._assignTouchControl();
        }
        this.$el.on('focusout',_.bind(function(e){
          if (!e.relatedTarget || !this.el.contains(e.relatedTarget)) {
            this._closeDropDown();
          }
        },this));
      },

      onKeyDown: function (event) {
        if (this.options.longPress) {
          if (this._isOnPrimaryItem(event)) {
            if (event.keyCode === 13 || event.keyCode === 32) {
              this._handleClick(event);
              this._stopEvent(event);
              return false;
            }
          }
        }
      },

      onKeyInView: function (event) {
        if (this.onKeyDown(event)!==false) {
          FlyoutToolItemView.prototype.onKeyInView.apply(this,arguments);
        } else {
          return false;
        }
      },

      _assignTouchControl: function () {
        if (this.hammer) {
          this.hammer.destroy();
        }

        this.hammer = new Hammer.Manager(this.el);

        var tap = new Hammer.Tap();
        var press = new Hammer.Press({time: 500});
        this.hammer.add([tap,press]);

        this.hammer.on('tap', _.bind(this._onTap, this));
        this.hammer.on('press', _.bind(this._onPress, this));
      },

      _isOnPrimaryItem: function(event) {
        if (this.el===event.target || this.el.contains(event.target)) {
          var menu = this.$(".binf-dropdown-menu")[0];
          if (menu!==event.target && !menu.contains(event.target)) {
            return true;
          }
        }
      },

      _onTap: function (event) {
        log.debug("hammer tap") && console.log(log.last);
        if (this._isOnPrimaryItem(event)) {
          // execute the action as with click
          this._handleClick($.Event('click'));
        }
      },

      _onPress: function (event) {
        log.debug("hammer press") && console.log(log.last);
        // toggle dropdown on long press.
        if (this._isOnPrimaryItem(event)) {
          this._toggleDropDown();
        }
      },

      _closeDropDown: function () {
        var isActive = this.$el.hasClass('binf-open');
        if (isActive) {
          this._toggleDropDown();
        }
      },

      _toggleDropDown: function () {
        // TODO: when moving to cs.core.ui ;-) implement this without
        // directly accessing "data". Better improve implementation of
        // the dropdown submenu plugin: in the implementation change
        // the check where the focus is set if no event is passed and/or
        // introduce a parameter in the interface methods, so an event
        // can be passed there.
        this.$el.data("binf.dropdown.submenu").toggle($.Event("click",{
          which: 1,
          currentTarget: this.el,
          target: this.el
        }));
      }

    });

  return FlyoutToolItemView2;
});