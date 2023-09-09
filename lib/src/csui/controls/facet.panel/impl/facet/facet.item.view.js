/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery", "csui/utils/base", "csui/lib/underscore", "csui/lib/marionette",
  "csui/controls/checkbox/checkbox.view",
  "hbs!csui/controls/facet.panel/impl/facet/facet.item",
  'i18n!csui/controls/facet.panel/impl/nls/lang',
  "css!csui/controls/facet.panel/impl/facet/facet.item"
], function ($, base, _, Marionette, CheckboxView, template, lang) {

  var FacetItemView = Marionette.ItemView.extend({

    template: template,
    className: 'csui-facet-item',

    constructor: function FacetItemView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.showInputOnHover =  !base.isTouchBrowser();
    },

    triggers: {
      'click .csui-filter-name': 'single:filter:select'
    },

    ui: {
      name: '.csui-name'
    },

    events: {
      'click .csui-checkbox': 'onToggleCheckbox',
      'change .csui-checkbox': 'onChangeValue',
      'focus .csui-facet-item-checkbox': 'onFocus',
      'blur .csui-facet-item-checkbox': 'onBlur',
      'keydown .csui-facet-item-checkbox': 'onToggleCheckbox',
      'keydown .csui-filter-name': 'onToggleCheckbox'
    },

    templateHelpers: function () {
      var showOnHover = this.showInputOnHover ? '' : 'csui-showAlways',
          count       = this.options.model.get('count') ? this.options.model.get('count') :
                        this.options.model.get('total'),
      filterTitleAria, filterCheckboxAria,filterTitle,
          showDisplayCount         = true,
          context                  = this.options.context,
          userHasSystemAdminRights = context && context._user && context._user.get(
              'privilege_system_admin_rights');
      if (!userHasSystemAdminRights) {
        switch (this.options.displayCount) {
        case "Never": {
          showDisplayCount = false;
          break;
        }
        case "Always": {
          showDisplayCount = true;
          break;
        }
        default: {
          var displayCount =
                  this.options.displayCount &&
                  this.options.displayCount.split(">")[1];
          showDisplayCount = !!displayCount && (count > parseInt(displayCount));
        }
        }
      }
      this.showDisplayCount = showDisplayCount;
      filterTitleAria = showDisplayCount ? _.str.sformat(lang.filterTitleAria, this.options.model.get('name'), count) :
        _.str.sformat(lang.filterTitleAriaNoDisplayCount, this.options.model.get('name'));
      filterCheckboxAria = showDisplayCount ? _.str.sformat(lang.filterCheckboxAria, this.options.model.get('name'), count) :
        _.str.sformat(lang.filterCheckboxAriaNoDisplayCount, this.options.model.get('name'));
      filterTitle = showDisplayCount ? _.str.sformat(lang.filterTitle, this.options.model.get('name'), count) : this.options.model.get('name');
      return {
        showOnHover: showOnHover,
        count: count,
        enableCheckBox: this.options.enableCheckBoxes,
        displayCount: showDisplayCount,
        filterTitleAria: filterTitleAria,
        filterCheckboxAria: filterCheckboxAria,
        filterTitle: filterTitle
      };
    },

    onToggleCheckbox: function(event){
      var keyCode = event.keyCode,
          target = $(event.target);

      event.preventDefault();

      switch (keyCode) {
        case 32:
        case 13:
          if (this.checkboxView) {
            var isChecked = this.checkboxView.model.get('checked');
            if (isChecked === 'true') {
              this.checkboxView.setChecked(false);
            } else {
              this.checkboxView.setChecked(true);
            }
          } else {
            this.triggerMethod('single:filter:select');
          }
          break;
        case 39:
        case 37:
          break;
        case 38:
        case 40:
          this.trigger('keyupdown', keyCode === 38, target);
          break;
        default:
          return true;
      }

      return false;
    },

    onChangeValue: function(event) {
      if (this.checkboxView) {
        var checkbox = event.target;
        this.checkboxView.setDisabled(checkbox.disabled);
      }
    },

    onDomRefresh: function() {
      if (this.options.enableCheckBoxes) {
        var checkboxDiv = this.$el.find(".csui-facet-item-checkbox");
        var count = this.model.get('count') ? this.options.model.get('count') : this.options.model.get('total');
        var checkboxTitle = this.showDisplayCount ? _.str.sformat(lang.filterTitleAria, this.model.get('name'), count) :
          _.str.sformat(lang.filterTitleAriaNoDisplayCount, this.model.get('name'));
        var checkboxAriaLabel = this.showDisplayCount ? _.str.sformat(lang.filterCheckboxAria, this.model.get('name'), count) :
          _.str.sformat(lang.filterCheckboxAriaNoDisplayCount, this.model.get('name'));
        if (!this.checkboxView) {
          this.checkboxView = new CheckboxView({
            checked: false,
            disabled: false,
            ariaLabel: checkboxAriaLabel,
            title: checkboxTitle
          });
          this.listenTo(this.checkboxView.model, 'change:checked', function() {
            this.triggerMethod('multi:filter:select');
          });

          var checkboxRegion = new Marionette.Region({el: checkboxDiv});
          checkboxRegion.show(this.checkboxView);
        }
      }
    },

    onFocus: function (event) {
      var facet = $(event.target).closest('.csui-facet');
      if (facet.length > 0) {
        facet.addClass('csui-focus');
      }
    },

    onBlur: function (event) {
      var facet = $(event.target).closest('.csui-facet');
        if (facet.length > 0) {
          facet.removeClass('csui-focus');
        }
    },

    getIndex: function(){
      return this._index;
    }

  });

  return FacetItemView;

});
