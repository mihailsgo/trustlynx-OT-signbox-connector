/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/backbone', 'csui/lib/underscore', 'csui/lib/marionette3',
  'csui/widgets/search.forms/search.forms.list.view',
  'hbs!csui/widgets/search.forms/impl/search.forms.container',
  'i18n!csui/widgets/search.forms/impl/nls/lang',
  'css!csui/widgets/search.forms/impl/search.forms'
], function (Backbone, _, Marionette, SearchFormsListView, SearchFormsContainerTemplate, lang) {
  'use strict';
  var SearchFormsContainerView = Marionette.View.extend({
    className: 'csui-search-form-collection',
    template: SearchFormsContainerTemplate,
    templateContext: function () {
      return {
        searchForms: this.options.searchFormsList,
        labels: lang,
        showMore: !!this.options.showMore,
        skipHeading: !!this.options.hasQuickSearches && !!this.options.fromSearchBox,
        showMorelabel: this.options.searchFormsList.recent_search_forms.length ? lang.showMore :
                       lang.searchFormLabel,
        showMoreAria: this.options.searchFormsList.recent_search_forms.length ?
                      lang.showMoreSearchFormsAria : lang.openSearchFormsAria
      };
    },

    regions: function () {
      var regions = {};
      _.each(this.options.searchFormsList, function (list, searchFormId) {
        regions[searchFormId] = '#' + searchFormId;
      });
      return regions;
    },

    constructor: function SearchFormsContainerView(options) {
      options || (options = {});
      this.options = options;
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    onRender: function () {
      _.each(this.options.searchFormsList, _.bind(function (list, region) {
        var collection = this._createCollection(list);
        if (collection.length) {
          if (region === 'recent_search_forms') {
            collection = !!this.options.hasQuickSearches ? collection :
                         new Backbone.Collection(collection.filter(function (model) {
                           return model.get('type') !== 'quick';
                         }));
            this.recentSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.recentSearchForms);
          } else if (region === 'system_search_forms') {
            this.systemSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.systemSearchForms);
          } else if (region === 'personal_search_forms') {
            this.personalSearchForms = this._createListView(collection, region);
            this.showChildView(region, this.personalSearchForms);
          }
        }
      }, this));
    },

    _createListView: function (collection, region) {
      var listView =new SearchFormsListView({
                          options: this.options,
                          originatingView: this.options.originatingView,
                          collection: collection,
                          listName: region,
                          parentView: this
                        });
      return listView;
    },

    _createCollection: function (list) {
      var model,
          collection = new Backbone.Collection();
      _.each(list, function (item) {
        model = new Backbone.Model(item);
        collection.add(model);
      });
      return collection;
    },
  });
  return SearchFormsContainerView;
});