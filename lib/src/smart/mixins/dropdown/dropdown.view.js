/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/lib/marionette',
'smart/behaviors/keyboard.navigation/smart.tabable.region.behavior',
  'hbs!smart/mixins/dropdown/dropdown',
  'css!smart/mixins/dropdown/dropdown'
], function (_, $, Backbone, Marionette, TabableRegion, dropdownTemplate) {

  
  var DropDownView = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'smart-dropdown',
    template: dropdownTemplate,
    triggers: {
      'click': 'click'
    },
    ui: {
      dropdown: '.csui-dropdown',
      dropDownMenu: '.csui-dropdown > .binf-dropdown-toggle',
      dropDownList: '.csui-dropdown .csui-dropdown-list',
      dropDownListItem: '.csui-dropdown ul.csui-dropdown-list a'
    },
    events: {

      'click @ui.dropDownMenu': 'onDropdownClick',
      'keydown @ui.dropDownMenu': 'onDropdownClick',
      'click @ui.dropDownListItem': 'onListClick',
      'keydown @ui.dropDownListItem': 'onKeyView',
    },

    templateHelpers: function () {
      return {
        list: this.options.collection.models,
        moreButtonsAria: "jikhi",
        size: this.footerView.size || 'normal'
      };
    },

    constructor: function DropDownView(options, footerView) {
      options || (options = {});
      Marionette.ItemView.apply(this, arguments);
      this.footerView = footerView;
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
      var tabElements = this.$('*[tabindex]:not(.binf-disabled )');
      if (tabElements.length) {
        tabElements.prop('tabindex', 0);
      }
      return (this.footerView.checkResizer && this.footerView.checkResizer(event)) || $(tabElements[0]);
    },

    onKeyView: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.footerView.isESC = false;
      switch (event.keyCode) {
        case 13:
        case 32:
          $(event.target).click();
          break;
        case 27:
          if (this.ui.dropdown.hasClass("binf-open")) {
            this.ui.dropdown.removeClass("binf-open");
            this.ui.dropDownMenu.trigger("focus");
            this.footerView.isESC = true;
          }
          break;
        case 38:
          this.getPrevEle($(event.currentTarget)).trigger("focus");
          break;
        case 40:
          this.getNextEle($(event.currentTarget)).trigger("focus");
          break;
      }
    },

    getNextEle: function (ele) {
      var idx = this.ui.dropDownListItem.index(ele);
      return $(_.find(this.ui.dropDownListItem, function (item, i) {
        return i > idx && !$(item).hasClass("binf-disabled");
      }));
    },

    getPrevEle: function (ele) {
      var idx = this.ui.dropDownListItem.get().reverse().indexOf(ele[0]);
      return $(_.find(this.ui.dropDownListItem.get().reverse(), function (item, i) {
        return i > idx && !$(item).hasClass("binf-disabled");
      }));
    },
    
    getCornerEle: function (elements,last) {
      var items = last? elements.get().reverse() : elements;
      return $(_.find(items, function (item) {
        return !$(item).hasClass("binf-disabled");
      }));
    },
    onDropdownClick: function (event) {
      this.footerView.isESC = false;
      if ((event.type === 'keypress'
        && (event.keyCode === 13 || event.keyCode === 32))
        || (event.type === 'click')) {
        event.preventDefault();
        event.stopPropagation();
        var ele = this.ui.dropdown;
        if (ele.hasClass("binf-open")) {
          ele.removeClass("binf-open");
          this.ui.dropDownMenu.attr("aria-expanded",false);
        } else {
          ele.addClass("binf-open");
          this.ui.dropDownMenu.attr("aria-expanded",true);
          this.getCornerEle(this.ui.dropDownListItem).trigger("focus");
        }
      }
    },

    onListClick: function (event) {
      event.preventDefault();
      event.stopPropagation();
      var i = this.ui.dropDownListItem.index(event.currentTarget);
      var ele = this.options.collection.models[i];
      if (ele.get("disabled")) {
        event.stopImmediatePropagation();
      } else {
        this.footerView.trigger("button:click button:click:" + ele.get("type"), ele.attributes);
      }
    }
  });

  return DropDownView;
});
