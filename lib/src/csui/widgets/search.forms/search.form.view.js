/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/progressblocker/blocker',
  'csui/widgets/search.custom/impl/search.object.view',
  'csui/widgets/search.forms/search.form.factory',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/next.node',
  'i18n!csui/widgets/search.forms/impl/nls/lang'
], function ($, _, Marionette, BlockingView, SearchObjectView, SearchFormFactory,
  FetchableMixin, SearchFormQueryModelFactory, NextNodeModelFactory, lang) {

  var AdvancedSearchFormView = SearchObjectView.extend({
    constructor: function AdvancedSearchFormView(options) {
      options = options || {};
      options.data || (options.data = {});
      this.context = options.context;
      this.searchFormId = _.uniqueId("csui-saved-search-form");
      this.jQuery = $;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      if (!options.model) {
        var searchFormId = options.data.searchFormId ||
                                 options.searchFormId;
        this.model = options.context.getCollection(SearchFormFactory, {
          attributes: {
            id: searchFormId
          }
        });
        FetchableMixin.mixin(SearchFormFactory);
      }
      this.listenTo(this.model, "sync", this.render);
      this.listenTo(this.model, 'error', this.handleError);
      this.loadingText = lang.loading;
      this.$el.on({
        "change input": _.bind(this._refreshDOM, this)
      });
      this.listenToOnce(this.model, "sync",function(){
        this.$el.removeClass("initialLoading");
       });
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
    },
    loadCustomSearch: function () {
      var viewStateModel = this.context && this.context.viewStateModel;
      viewStateModel && viewStateModel.setSessionViewState('selected_nodes',  undefined);

      var defaultValues = this.customFormView.formView.customFilter();
      if (!this.options.query) {
        this.options.query = this.model.options.options && this.model.options.options.options.model;
      }
      if (!!defaultValues && defaultValues.length !== 0) {
        if (this.$(".csui-custom-search-form-submit").hasClass("binf-disabled")) {
          this._enableSearch(true);
        }
        this.updatedFormValues = this.customFormView.formView.getValues();
        this.queryModel = this.options.query || this.context.getModel(SearchFormQueryModelFactory);
        this.nextNode = this.context.getModel(NextNodeModelFactory);
        if (!this.options.query && _.isEmpty(this.queryModel.attributes) &&
            _.isEmpty(this.nextNode.attributes)) {
          history.pushState({"search": {name: undefined, id: undefined}}, "", location.href);
        }
        this.queryModel.clear({silent: true});
        this.queryModel.updatedValues = this.updatedFormValues;
        var params = {};
        _.each(this.updatedFormValues, function (curChild) {
          if (curChild instanceof Object) {
            _.each(curChild, function (childValue, childKey) {
                  if (childValue instanceof Object) {
                    _.each(childValue, function (val, key) {
                      if(val instanceof Object) {
                        _.each(val, function (val, key) {
                          params[key] = val;
                        });
                      } else {
                        params[key] = val;
                      }
                    });
                  } else {
                    params[childKey] = childValue;
                  }
                }
            );
          }
        });
        params['query_id'] = this.model.get("data").templateId;
        params.forcePerspectiveChange = this.options.showInSearchResultsNewPerspective;
        this.resetPageDefaults();
        params.enableSearchForm = true;
        var isFormChanged = (this.customFormView && this.customFormView.formView) ? 
                            this.customFormView.formView.isFormChanged : undefined;
        if (isFormChanged !== undefined && !isFormChanged) {
          return;
        }
        this.queryModel.set(params);
        this.trigger('click:search');
      } else {
        this._enableSearch(false);
      }
    },
  });
  return AdvancedSearchFormView;
});
