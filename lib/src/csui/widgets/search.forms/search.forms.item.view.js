/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'hbs!csui/widgets/search.forms/impl/search.forms',
  'i18n!csui/widgets/search.forms/impl/nls/lang',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (_, $, Marionette, SearchFormsTemplate, lang) {
  'use strict';
  var SearchFormsItemView = Marionette.View.extend({
    className: 'csui-search-form-item',
    template: SearchFormsTemplate,

    templateContext: function () {
      var searchFormName = this.model && this.model.has('name') && this.model.get('name'),
          searchFormId = this.model && this.model.has('id') && this.model.get('id');
      searchFormName = searchFormName && searchFormName.toLowerCase();
      searchFormName = searchFormName && searchFormName.charAt(0).toUpperCase() +
                       searchFormName.slice(1);
      return {
        quickLink: this.model.get('type') === 'quick',
        searchFormName: searchFormName,
        searchFormId: searchFormId,
        searchFormTooltip : _.str.sformat(lang.searchFormTooltip, searchFormName)
      };
    },

    events: {
      'click .csui-searchforms-popover-row': 'openFormView',
      'keydown .csui-searchforms-popover-row': 'openFormView'
    },

    constructor: function SearchFormsItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.call(this, options);
    },

    openFormView: function (event) {
      event.preventDefault();
      event.stopPropagation();

      var model = this.model,
          params = model.get('params') || {};
      if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
        if (model.get('type') === 'quick') {
          params.location_id1 = "";
          var originatingView = this.options.originatingView;
          if (originatingView.options && originatingView.options.data) {
            if (originatingView.options.data.searchFromHere) {
              if (originatingView.searchOptions) {
                if (originatingView.searchOptions.nodeId) {
                  params.location_id1 = originatingView.searchOptions.nodeId;
                }
              }
            }
          }
          params.where = params.where || '*';
          this.options.originatingView.trigger('refine:search', event, params);
          return;
        } else if (this.model.get('type') === 'direct' && !!this.options.parentView &&
                   !!this.options.parentView.options && !!this.options.parentView.options.options &&
                   !!this.options.parentView.options.options.fromSearchBox) {
          _.extend(params, {
            forcePerspectiveChange: true,
            enableSearchForm: true
          });
          this.options.originatingView.trigger('refine:search', event, params);
          return;
        }
        if (this.$el.find('.csui-searchforms-popover-row').hasClass('binf-disabled')) {
          return;
        }
        this.$el.find('.csui-searchforms-popover-row').addClass('binf-disabled');
        var id = this.model.get('params') && this.model.get('params').query_id ?
                 this.model.get('params').query_id : this.model.get('id');

        if (!!this.options.originatingView.isModelFetched) {
          this.options.originatingView.isModelFetched(id);
        } else {
          this.options.originatingView.hideSearchOptionsDropDown(event);
          this.options.originatingView.searchForms.isModelFetched(id);
        }
        this.options.originatingView.searchFormsContainerView.$el.addClass('binf-hidden');
      } else if (event.type === 'keydown') {
        this._handleKeyEvents(event);
      }
    },

    _handleKeyEvents: function (event) {
      event.preventDefault();
      switch (event.keyCode) {
        case 9: //tab
          var searchFormContainerView = this.options.parentView.options.parentView,
              parentView = this.options.parentView;
          if (!event.shiftKey) {
            if (this.options.originatingView.$el.find('.csui-searchforms-show-more').length) {
              this.options.originatingView.$el.find('.csui-searchforms-show-more').focus();
            } else if (!!searchFormContainerView.personalSearchForms &&
              parentView.options.listName !== 'system_search_forms' &&
              (parentView.options.listName !== 'personal_search_forms')) {
              searchFormContainerView.personalSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.systemSearchForms && (parentView.options.listName !== 'system_search_forms')) {
              searchFormContainerView.systemSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else {
              var cancel = searchFormContainerView.options.originatingView.sidePanel.$el.find('[id = "csui-side-panel-cancel"]');
              cancel.addClass('active');
              setTimeout(function () {
                cancel.trigger('focus');
              },0);
            }
          } else if (event.shiftKey) {
            if (!!searchFormContainerView.personalSearchForms && (parentView.options.listName !== 'personal_search_forms')) {
              searchFormContainerView.personalSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.recentSearchForms && (parentView.options.listName !== 'recent_search_forms')) {
              searchFormContainerView.recentSearchForms.$el.find('.csui-searchforms-popover-row')[0].focus();
            } else if (!!searchFormContainerView.recentSearchForms && (parentView.options.listName === 'recent_search_forms') ||
              !!searchFormContainerView.personalSearchForms && (parentView.options.listName === 'personal_search_forms') ||
              !!searchFormContainerView.systemSearchForms && (parentView.options.listName === 'system_search_forms')) {
              if (this.options.originatingView.sidePanel) {
                this.options.originatingView.sidePanel.$el.find('.csui-sidepanel-close').trigger('focus');
              } else {
                if (this.options.originatingView.$el.find('.csui-slices-more').length>0 && !this.options.originatingView.$el.find('.csui-slices-more').hasClass('binf-hidden')) {
                  this.options.originatingView.$el.find('.csui-slices-more')[0].focus();
                } else {
                  $(this.options.originatingView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
                  $(this.options.originatingView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
                }
              }
            } else if (this.options.originatingView.$el.find('.csui-selected-checkbox').length) {
                this.options.originatingView.$el.find('.csui-selected-checkbox').addClass('active');
                this.options.originatingView.$el.find('.csui-selected-checkbox input[type="checkbox"]').trigger('focus');
            } else {
              $(this.options.originatingView.$el.find('.csui-search-popover-row-body')[0]).addClass('active');
              $(this.options.originatingView.$el.find('.csui-search-popover-row-body input[type="radio"]')[0])[0].focus();
            }
          }
          break;
        case 38: //up arrow
          if (this.$el.prev().length) {
            this.$el.removeClass('active');
            (this.$el.prev().addClass('active')).find('.csui-searchforms-popover-row')[0].focus();
          } else {
             var el = this.options.parentView.$el.find('.csui-searchforms-popover-row');
             el[el.length -1].focus();
          }
          break;
        case 40: //down arrow
          if (this.$el.next().length) {
            this.$el.removeClass('active');
            (this.$el.next().addClass('active')).find('.csui-searchforms-popover-row')[0].focus();
          } else {
            this.options.parentView.$el.find('.csui-searchforms-popover-row')[0].focus();
          }
          break;
        case 27: //escape
          var originatingViewOptions = this.options.originatingView &&
                                       this.options.originatingView.options,
              originatingView = originatingViewOptions && originatingViewOptions.originatingView;
          this.$el.removeClass('active');
          originatingView &&
          originatingViewOptions.options &&
          originatingViewOptions.options.data &&
          originatingViewOptions.options.data.showOptionsDropDown &&
          originatingView.hideSearchOptionsDropDown(event);
          break;
      }
    } 
  });
  return SearchFormsItemView;
});
