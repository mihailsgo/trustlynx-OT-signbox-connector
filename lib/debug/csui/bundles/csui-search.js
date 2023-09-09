csui.define('csui/models/widget/search.results/facet.server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/utils/url',
  'csui/models/widget/search.results/search.facet.query.mixin'
], function (_, Url, FacetQueryMixin) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      FacetQueryMixin.mixin(prototype);
      var originalSync = prototype.sync;

      return _.extend(prototype, {
        filterQueryParameterName: 'filter',

        makeServerAdaptor: function (options) {
          return this.makeFacetQuery(options);
        },

        cacheId: '',

        url: function () {
          var url = this.connector.getConnectionUrl().getApiBase('v2');
          return Url.combine(url, 'search');
        },

        sync: function (method, model, options) {
          var query = this.options.query.toJSON();
          //Global Search
          if (!!this.options.query.resetDefaults) {
            this.orderBy = "";
            this.skipCount = 0;
            this.options.query.resetDefaults = false;
          } else {
            this.orderBy = ((this.orderBy) &&
                            (this.previousQuery !== this.options.query.attributes.where)) ? "" :
                           this.orderBy;
            this.skipCount = (this.previousOrderBy !== this.orderBy) ? 0 : this.skipCount;
            this.topCount = this.options.topCount ? this.options.topCount : 10;
          }

          _.extend(query, this.getFilterParam(this.filters)); // returns an object with facets array
          _.extend(query, this.getBrowsableParams()); // returns object containing browsable_params
          query.options = '{\'facets\'}';

          // consider cache_id only while sorting and pagination.
          if ((!!this.orderBy || !!this.pagination) && !!this.cacheId) {
            query.cache_id = this.cacheId;
            this.pagination = false; // reset pagination to default.
          }

          _.extend(options, {
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            data: query,
            traditional: true
          });
          return originalSync.apply(this, arguments);
        },

        parse: function (response, options) {
          response.results = response.featured ? response.featured.concat(response.results) :
                             response.results;
          this.parseBrowsedState(response.collection, options);
          //Create search facets
          this._parseFacets(response.collection.searching.facets);
          response.results.sorting = response.collection.sorting;
          this.cacheId = (!!response.collection && !!response.collection.searching &&
                          !!response.collection.searching.cache_id) ?
                         response.collection.searching.cache_id : "";
          return this.parseBrowsedItems(response, options);
        },

        _parseFacets: function (facets) {
          var topics;
          if (facets) {
            topics = convertFacets(facets.selected, true)
                .concat(convertFacets(facets.available, false));
          }
          this.reset(topics);
        }
      });
    }
  };

  function convertFacets(facets, selected) {
    return _.map(facets, function (facet) {
      var topics = _.map(facet.facet_items, function (topic) {
        return {
          name: topic.display_name,
          total: topic.count,
          value: topic.value,
          selected: selected
        };
      });
      return {
        id: facet.name,
        name: facet.display_name,
        type: facet.type,
        topics: topics,
        items_to_show: 5,
        select_multiple: true
      };
    });
  }

  return ServerAdaptorMixin;
});
  

csui.define('csui/models/widget/search.results/search.facets',[
  'csui/lib/underscore', 'csui/models/facets',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/models/browsable/v1.request.mixin', 'csui/models/browsable/v2.response.mixin',
  'csui/models/widget/search.results/facet.server.adaptor.mixin',
  'csui/utils/deepClone/deepClone'
], function (_, FacetCollection, ConnectableMixin, FetchableMixin,
    BrowsableV1RequestMixin, BrowsableV2ResponseMixin, ServerAdaptorMixin) {
  'use strict';

  var SearchFacetCollection = FacetCollection.extend({
    constructor: function SearchFacetCollection(models, options) {
      this.options = options || (options = {});
      FacetCollection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options)
          .makeFetchable(options)
          .makeBrowsableV1Request(options)
          .makeBrowsableV2Response(options)
          .makeServerAdaptor(options);
    },
    clone: function () {
      return new this.constructor(this.models, {
        connector: this.connector,
        skip: this.skipCount,
        top: this.topCount,
        filters: _.deepClone(this.filters)
      });
    },

    isFetchable: function () {
      return (!!this.options.query.get('where') || !!this.options.query.get('query_id'));
    }
  });

  BrowsableV1RequestMixin.mixin(SearchFacetCollection.prototype);
  BrowsableV2ResponseMixin.mixin(SearchFacetCollection.prototype);
  ConnectableMixin.mixin(SearchFacetCollection.prototype);
  FetchableMixin.mixin(SearchFacetCollection.prototype);
  ServerAdaptorMixin.mixin(SearchFacetCollection.prototype);

  return SearchFacetCollection;
});

csui.define('csui/utils/contexts/factories/search.results.facets.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'csui/models/widget/search.results/search.facets'
], function (module, _, Backbone, CollectionFactory, ConnectorFactory, SearchFacetCollection) {

  var SearchResultFacetCollectionFactory = CollectionFactory.extend({

    propertyPrefix: 'searchFacets',

    constructor: function SearchResultFacetCollectionFactory(context, options) {
      CollectionFactory.prototype.constructor.apply(this, arguments);

      var facets = this.options.searchFacets || {};
      if (!(facets instanceof Backbone.Collection)) {
        var connector = context.getObject(ConnectorFactory, options),
            query     = facets.options.query,
            config    = module.config();
        facets = new SearchFacetCollection(facets.models, _.extend({
          connector: connector,
          query: query,
          stateEnabled: true
        }, facets.options, config.options, {
          autofetch: true,
          autoreset: true
        }));
      }
      this.property = facets;
    },

    isFetchable: function () {
      return this.property.isFetchable();
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return SearchResultFacetCollectionFactory;

});
csui.define('csui/models/widget/search.results/object.to.model',['csui/lib/jquery', 'csui/lib/underscore', "csui/lib/backbone"
], function ($, _, Backbone) {
  "use strict";

  var RegionsModel = Backbone.Model.extend({
    constructor: function RegionsModel() {
      Backbone.Model.apply(this, arguments);
    }
  });

  var RegionsModelCollection = Backbone.Collection.extend({
    model: RegionsModel,

    constructor: function RegionsModelCollection() {
      Backbone.Collection.apply(this, arguments);
    },

    isFetchable: false
  });

  var displayRegions = ['available', 'selected'];

  var toModel = function (model) {
    _.each(model, function(item) {
      if (_.isObject(item)) {
        displayRegions.map(function(region) {
          if (item[region]) {
            if (_.isArray(item[region])) {
              item[region] = new RegionsModelCollection(item[region]);
            }
          }
        });
      }
    });
    return model;
  };

  return toModel;
});
// Shows a form
csui.define('csui/widgets/search.custom/impl/form.view',['module', 'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/lib/alpaca/js/alpaca.lite',
  'csui/controls/form/form.view'
], function (module, $, _, Marionette, Alpaca, FormView) {

  var CustomSearchFormView = FormView.extend({
    constructor: function CustomSearchFormView(options) {
      this.options = options || {};
      FormView.prototype.constructor.call(this, _.extend(options, {custom: {adjustHeight: true}}));
      this.jQuery = $;
      var that = this;
      //Custom Flatten the array object of set categories
      this.customFlatten = function (x, result, prefix) {
        if (_.isObject(x)) {
          _.each(x, function (v, k) {
            that.customFlatten(v, result, k);
          });
        } else {
          if (/^(anydate|anyvalue)/i.test(x)) {
            x = "";
          }
          result[prefix] = x;
        }
        return result;
      };

      this.customFilter = function () {
        var that        = this,
            result      = [],
            flattenData = that.customFlatten(that.objectList(that.getValues()), {});
        if (_.isObject(flattenData)) {
          _.each(flattenData, function (v, k) {
            if (that.customEndsWith(k, '_DFrom') || that.customEndsWith(k, '_DFor') ||
                that.customEndsWith(k, '_DTo')) {
              var original_k = k.substr(0, k.lastIndexOf('_'));
              if (!v && !!flattenData[original_k]) {
                flattenData[original_k] = "";
              }
            }
            if (v) {
              result.push(v);
            }
          });
        }
        return result;
      };

      this.customEndsWith = function (string, substring) {
        return string.indexOf(substring, string.length - substring.length) !== -1;
      };

      this.objectList = function (data) {
        var list = [];
        _.each(data, function (item) {
          if (_.isObject(item)) {
            list.push(item);
          }
        });
        return _.flatten(list);
      };

      this.$el.on("keydown", function (event) {

        if (event.keyCode === 13 &&
            (event.target.type === "text" || event.target.type === 'search') &&
            event.target.value.trim() !== "") {
          //handling typeahead field (userfield)
          if (($(event.target).is('input.typeahead') &&
              $(event.target).siblings('.typeahead.scroll-container:visible').length !== 0) ||
              event.target.closest('.cs-nodepicker')) {
            return;
          }
          that.triggerSearch(event);
        } else if (event.keyCode === 13 &&
                   that.jQuery(".binf-dropdown-menu").parent(".binf-open").length >= 1) {
          event.stopImmediatePropagation();
        } else if (event.keyCode === 13) {
          if (event.target.value === "") {
            var defaultValues = that.customFilter();
            if (!!defaultValues && defaultValues.length === 0) {
              that.options.customView.trigger('enable:search', false);
            } else {
              that.triggerSearch(event);
            }
          } else {
            that.options.customView.trigger('enable:search', true);
          }
        }
      });

      //saving the values for changes in all the fields with input/change listeners to enable/disable the search button
      this.$el.on("input change", function (event) {
          if (event.target.value === "") {
            that.trigger('update:form');
            $(event.target).trigger('focus');
            var defaultValues = that.customFilter();
            if (!!defaultValues && defaultValues.length === 0) {
              that.options.customView.trigger('enable:search', false);
            }
          } else {
            that.options.customView.trigger('enable:search', true);
          }
      });
    },

    triggerSearch: function (event) {
        this.options.customView.trigger("trigger:search");
    },

    updateRenderedForm: function () {
      return false;
    },

    onRenderForm: function () {
      this.options.customView.triggerMethod("render:form");
    },

    onChangeField: function (event) {
      var defaultValues = this.customFilter();
      if (defaultValues.length === 0) {
        this.options.customView.trigger('enable:search', false);
      } else {
        this.options.customView.trigger('enable:search', true);
      }
      if (window.event && (window.event.keyCode === 13 || window.event.which === 13)) {
        if (!!event.value) {
          this.options.customView.trigger('enable:search', true);
          this.options.customView.triggerMethod("field:updated");
        } else {
          if (!!defaultValues && defaultValues.length === 0) {
            this.options.customView.trigger('enable:search', false);
          } else if (defaultValues && defaultValues.length !== 0) {
            this.options.customView.triggerMethod("field:updated");
          }
        }
      }
    }
  });
  return CustomSearchFormView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.custom/impl/customsearchform',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"isSetType") : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.program(4, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":3,"column":4},"end":{"line":9,"column":11}}})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"binf-col-md-12 cs-form-singlecolumn cs-form-set\"\r\n           id=\"csfSingleCol_"
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"modelId") : depths[1]), depth0))
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data,"loc":{"start":{"line":5,"column":42},"end":{"line":5,"column":52}}}) : helper)))
    + "\"></div>\r\n";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"binf-col-md-12 cs-form-doublecolumn\"\r\n           id=\"csfLeftCol_"
    + container.escapeExpression(container.lambda((depths[1] != null ? lookupProperty(depths[1],"modelId") : depths[1]), depth0))
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"index","hash":{},"data":data,"loc":{"start":{"line":8,"column":40},"end":{"line":8,"column":50}}}) : helper)))
    + "\"></div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"binf-row\">\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"fields") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":2},"end":{"line":10,"column":11}}})) != null ? stack1 : "")
    + "</div>\r\n";
},"useData":true,"useDepths":true});
Handlebars.registerPartial('csui_widgets_search.custom_impl_customsearchform', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.custom/impl/customsearch.item',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-custom-search-formitems\"></div>";
}});
Handlebars.registerPartial('csui_widgets_search.custom_impl_customsearch.item', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.custom/impl/search.customFormView',['csui/lib/marionette',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/base',
  'csui/widgets/search.custom/impl/form.view',
  'hbs!csui/widgets/search.custom/impl/customsearchform',
  'hbs!csui/widgets/search.custom/impl/customsearch.item'
], function (Marionette, _, $, base, CustomSearchFormView, CustomSearchTemplate,
    CustomSearchItemTemplate) {

  var CustomSearchAttrItemView = Marionette.ItemView.extend({
    tag: 'div',
    className: "customsearch-attr-container",
    constructor: function CustomSearchAttrItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.model.on('error', this.errorHandle, this);
    },
    template: CustomSearchItemTemplate,
    onRender: function (e) {
      var _searchCustomFormViewEle = new Marionette.Region({
            el: this.$el.find('.csui-custom-search-formitems')
          }),
          formView                 = new CustomSearchFormView({
            context: this.options.context,
            model: this.model,
            layoutMode: 'singleCol',
            mode: 'create',
            customView: this,
            templateId: this.model.attributes.data.templateId
          });
      _searchCustomFormViewEle.show(formView);
      this.formView = formView;
    },
    onRenderForm: function () {
      this.options.objectView.triggerMethod("render:form");
      return;
    }
  });

  return CustomSearchAttrItemView;

});

csui.define('csui/widgets/search.custom/impl/search.customview.model',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/utils/url'
], function (_, $, Backbone, ConnectableMixin, FetchableMixin, Url) {
  var SearchCustomModel = Backbone.Model.extend({

    constructor: function SearchCustomModel(attributes, options) {
      options || (options = {});
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = options;
      this.makeConnectable(options).makeFetchable(options);
    }
  });

  ConnectableMixin.mixin(SearchCustomModel.prototype);
  FetchableMixin.mixin(SearchCustomModel.prototype);
  _.extend(SearchCustomModel.prototype, {

    isFetchable: function () {
      return !!this.options;
    },

    url: function () {
      return Url.combine(this.connector.connection.url,
          'nodes/' + this.options.nodeId + '/customviewsearchforms');
    },

    parse: function (response, options) {
      response.name = response.text;
      return response;
    }
  });

  return SearchCustomModel;
});




csui.define('csui/widgets/search.custom/impl/search.customview.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory', 'csui/utils/contexts/factories/connector',
  'csui/widgets/search.custom/impl/search.customview.model'
], function (module, _, Backbone, ModelFactory, ConnectorFactory, SearchCustomModel) {

  var SearchCustomViewFactory = ModelFactory.extend({

    propertyPrefix: 'customSearch',

    constructor: function SearchCustomViewFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var customSearch = this.options.customSearch || {};
      if (!(customSearch instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            config = module.config();
        customSearch = new SearchCustomModel(customSearch.attributes || config.attributes, _.defaults({
          connector: connector,
          nodeId: options.customQuery.nodeId
        }, customSearch.options, config.options));
      }
      this.property = customSearch;
    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return SearchCustomViewFactory;

});

csui.define('csui/widgets/search.custom/impl/search.customquery.model',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/utils/url'
], function (_, $, Backbone, ConnectableMixin, FetchableMixin, Url) {
  var SearchCustomModel = Backbone.Model.extend({

    constructor: function SearchCustomModel(attributes, options) {
      this.options = options || (options = {});
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.makeConnectable(options).makeFetchable(options);
    }
  });

  ConnectableMixin.mixin(SearchCustomModel.prototype);
  FetchableMixin.mixin(SearchCustomModel.prototype);

  _.extend(SearchCustomModel.prototype, {

    isFetchable: function () {
      return this.options.node.isFetchable();
    },

    url: function () {
      return Url.combine(this.connector.connection.url,
          'searchqueries/' + this.get('id'));
    },

    parse: function (response, options) {
      response.name = response.text;
      return response;
    }
  });

  return SearchCustomModel;
});




csui.define('csui/widgets/search.custom/impl/search.customquery.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/widgets/search.custom/impl/search.customview.factory',
  'csui/widgets/search.custom/impl/search.customquery.model',
  'csui/utils/contexts/factories/connector'
], function (module, _, Backbone, ModelFactory, CustomViewFactory,
    SearchCustomQueryModel, ConnectorFactory) {

  var CustomQueryFactory = ModelFactory.extend({

    propertyPrefix: 'customQuery',

    constructor: function CustomQueryFactory(context, options) {
      options || (options = {});
      ModelFactory.prototype.constructor.apply(this, arguments);

      var customQuery = this.options.customQuery || {};
      if (!(customQuery instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            config    = module.config();
        customQuery = new SearchCustomQueryModel(options.attributes, _.extend({
          connector: connector
        }, config.options, customQuery.options));
      }
      this.property = customQuery;
    },

    fetch: function (options) {
      return this.property.fetch(this.options);
    }

  });

  return CustomQueryFactory;

});

csui.define('csui/widgets/search.custom/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.custom/impl/nls/root/lang',{
  searchButtonMessage: "Search",
  title: "Custom View Search",
  loadingText: "Loading custom view search form"
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.custom/impl/customsearch.main',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"csui-saved-search-submit-container\">\r\n    <button class=\"binf-btn binf-btn-primary csui-custom-search-form-submit\"\r\n            id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchButton") || (depth0 != null ? lookupProperty(depth0,"searchButton") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchButton","hash":{},"loc":{"start":{"line":5,"column":16},"end":{"line":5,"column":32}}}) : helper)))
    + "\" value=\"Search\"> "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"search") : stack1), depth0))
    + " </button>\r\n  </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-saved-search-form\" id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchFormId") || (depth0 != null ? lookupProperty(depth0,"searchFormId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchFormId","hash":{},"loc":{"start":{"line":1,"column":40},"end":{"line":1,"column":56}}}) : helper)))
    + "\"></div>\r\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hideSearchButton") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":2,"column":0},"end":{"line":7,"column":11}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_search.custom_impl_customsearch.main', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.custom/impl/error.template',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-error-icon-div\">\r\n  <div class=\"csui-error-icon-parent\">\r\n    <div class=\"csui-error-icon notification_error\"></div>\r\n  </div>\r\n</div>\r\n<div class=\"csui-suggestion\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"errorMessage") || (depth0 != null ? lookupProperty(depth0,"errorMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"errorMessage","hash":{},"loc":{"start":{"line":6,"column":29},"end":{"line":6,"column":45}}}) : helper)))
    + "</div>";
}});
Handlebars.registerPartial('csui_widgets_search.custom_impl_error.template', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/search.custom/impl/search.custom',[],function(){});
csui.define('csui/widgets/search.custom/impl/search.object.view',['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/lib/backbone',
  'csui/widgets/search.custom/impl/search.customFormView',
  'csui/controls/progressblocker/blocker',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/widgets/search.custom/impl/search.customquery.factory',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'csui/utils/contexts/factories/application.scope.factory',
  'i18n!csui/widgets/search.custom/impl/nls/lang',
  'hbs!csui/widgets/search.custom/impl/customsearch.main',
  'hbs!csui/widgets/search.custom/impl/error.template',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/utils/contexts/factories/next.node',
  'css!csui/widgets/search.custom/impl/search.custom.css'
], function (_, $, Marionette, Backbone, SearchCustomFormView, BlockingView,
    SearchQueryModelFactory, SearchCustomQueryFactory, FetchableMixin, ApplicationScopeModelFactory, lang, SearchObjectTemplate,
    errorTemplate, PerfectScrollingBehavior, NextNodeModelFactory) {

  var SearchObjectView = Marionette.CompositeView.extend({
    className: "csui-custom-view-search initialLoading",

    templateHelpers: function () {
      var messages = {
        search: lang.searchButtonMessage
      };
      var hideSearchButton = this.options.hideSearchButton ? this.options.hideSearchButton : false;
      var searchFormId = this.searchFormId;
      var searchButton = _.uniqueId("csui-custom-search-form-submit");
      return {
        messages: messages,
        hideSearchButton: hideSearchButton,
        searchFormId: searchFormId,
        searchButton: searchButton
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".csui-custom-search-formitems",
        scrollYMarginOffset: 15
      }
    },
    constructor: function SearchObjectView(options) {
      options = options || {};
      options.data || (options.data = {});
      this.context = options.context;
      this.searchFormId = _.uniqueId("csui-saved-search-form");
      this.jQuery = $;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      if (!options.model) {
        var savedSearchQueryId = options.data.savedSearchQueryId ||
                                 options.savedSearchQueryId;
        this.model = options.context.getCollection(SearchCustomQueryFactory, {
          attributes: {
            id: savedSearchQueryId
          }
        });
        FetchableMixin.mixin(SearchCustomQueryFactory);
      }
      this.listenTo(this.model, "sync", this.render);
      this.listenTo(this.model, 'error', this.handleError);
      this.loadingText = lang.loadingText;
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
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
    },
    ui : function() {
     return { searchFormId : '#' + this.searchFormId };
    },
    _refreshDOM: function () {
      setTimeout(_.bind(function () {
        this.triggerMethod('dom:refresh');
      }, this), 500);
    },

    template: SearchObjectTemplate,
    events: {
      "click .csui-custom-search-form-submit": "loadCustomSearch"
    },
    onRender: function (e) {
      if (this.model.attributes && this.model.attributes.data) {
        if (!!this.options.parentView) {
          if (!!this.model.get("schema").title) {
            this.options.parentView.options.title = this.model.get("schema").title;
          } else {
            //consider title from server in below precedence
            //1. From server, 2. Widget options, 3. lang bundles
            this.options.parentView.options.title = (!!this.options.parentView.options.data &&
                                                     !!this.options.parentView.options.data.title) ?
                                                    this.options.parentView.options.data.title :
                                                    (this.options.parentView.options.title ||
                                                     lang.title);
          }
          this.trigger("change:title");
        } else {
          var schemaSearchTitle = !!this.model.get("schema").title ?
                                  this.model.get("schema").title : lang.title;
          if (!!this.options.titleElement) {
            this.options.titleElement.html(schemaSearchTitle);
            this.options.titleElement.attr("title", schemaSearchTitle);
          }
        }
        if (this.options.customValues) {
          var isModelUpdatedWithCustomVals = this.updateCustomSearch(this.options.customValues.updatedValues,
              this.options.customValues.attributes, this.model.get("data"), true);

          if(isModelUpdatedWithCustomVals) {
            this.trigger("model:updated");
          }
        }
        this.options.objectView = this;
        var _searchCustomFormView = new SearchCustomFormView(_.extend(this.options,
            {model: this.model}));
        this.listenTo(_searchCustomFormView, 'trigger:search', this._triggerSearch);
        this.listenTo(_searchCustomFormView, 'enable:search', function (isSearchEnabled) {
          this._enableSearch(isSearchEnabled);
        });
        var _searchCustomFormViewEle = new Marionette.Region({
          el: this.ui.searchFormId
        });
        _searchCustomFormViewEle.show(_searchCustomFormView);
        this.customFormView = _searchCustomFormView;
        this.listenTo(this.customFormView.formView, 'form:changed', function () {
            this.customFormView.formView.isFormChanged = true;
        });
        this.blockActions();
        //Until user enters any value the search button should be in disable mode
        var defaultValues = _.filter(_.flatten(_.map(this.model.get("data"), _.values)),
            function (val) {return val; });
        if (!!defaultValues && defaultValues.length === 0) {
          this._enableSearch(false);
        } else {
          this._enableSearch(true);
        }
      }
    },
    handleError: function () {
      this.unblockActions();
      if (this.model.error && this.model.error.message) {
        //consider title from server in below precedence
        //1. From server, 2. Widget options, 3. lang bundles
        this.options.parentView.options.title = (!!this.options.parentView.options.data &&
                                                 !!this.options.parentView.options.data.title) ?
                                                this.options.parentView.options.data.title :
                                                (this.options.parentView.options.title ||
                                                 lang.title);
        this.trigger("change:title");
        this.ui.searchFormId.addClass("csui-custom-error");
        var emptyEl = errorTemplate.call(this, {errorMessage: this.model.error.message});
        this.ui.searchFormId.append(emptyEl);
        this.$el.find(".csui-saved-search-submit-container").addClass("binf-hidden");
      }
    },
    _triggerSearch: function () {
      var that = this;
      setTimeout(function (event) {
        if (!that.jQuery(".csui-custom-search-form-submit").hasClass("binf-disabled")) {
          that.loadCustomSearch();
        }
      }, 50);
    },
    _enableSearch: function (isSearchEnabled) {
      if (isSearchEnabled) {
        this.jQuery(".csui-custom-search-form-submit").removeClass("binf-disabled").removeClass(
            "csui-search-form-submit-disabled");
        this.trigger('enable:search', true);
      } else {
        this.jQuery(".csui-custom-search-form-submit").addClass("binf-disabled").addClass(
            "csui-search-form-submit-disabled");
        this.trigger('enable:search', false);
      }
    },

    onRenderForm: function () {
      if (this.$el.is(':visible')) {
        this._refreshDOM();
      }
      this.unblockActions();
      if (this.options.parentView &&
        typeof this.options.parentView.unblockActions === 'function' && this.applicationScope && this.applicationScope.id != "search") {
        this.options.parentView.unblockActions();
      }
      return;
    },
    onFieldUpdated: function () {
      this.loadCustomSearch();
    },

    _checkEqualValues: function(obj1, obj2) {
      // this function is an internal function which expects
      // the two objects to be of the same structure and only
      // compares the values.

      var keys = Object.keys(obj1);
      for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if(obj1[key] instanceof Object) {
          if(!this._checkEqualValues(obj1[key], obj2[key])) {
            return false;
          }
        } else if(obj1[key] != obj2[key]) {
            return false;
        }
      }
      return true;
    },

    updateCustomSearch: function (updatedFormValues, updatedValues, dataModel, checkDiff) {
      var foundDiff          = false;
      if (!!updatedFormValues) {
        if(checkDiff) {
          foundDiff = !this._checkEqualValues(this.model.attributes.data, updatedFormValues);
        }
        this.model.attributes.data = _.extend(this.model.attributes.data, updatedFormValues);
      } else if (!!updatedValues) {
        var self               = this,
            cloneUpdatedValues = Object.create(updatedValues);
        _.each(dataModel, function (dataVal, dataKey) {
          if (dataVal instanceof Object) {
            _.each(dataVal, function (cVal, cKey) {
              if (cVal instanceof Object) {
                if(cVal instanceof Array) {
                  if(!!cloneUpdatedValues[cKey]) {
                    if(checkDiff && !foundDiff) {
                      foundDiff = (cVal[0] != cloneUpdatedValues[cKey]);
                    }
                    cVal[0] = cloneUpdatedValues[cKey];
                    delete cloneUpdatedValues[cKey];
                  }
                } else {
                  _.each(cVal, function (cV, cK) {
                    if (!!cloneUpdatedValues[cK] ) {
                      if(checkDiff && !foundDiff) {
                        foundDiff = (cVal[cK] != cloneUpdatedValues[cK]);
                      }
                      cVal[cK] = cloneUpdatedValues[cK];
                      delete cloneUpdatedValues[cK];
                    }
                  });
                }
              } else if (!!cloneUpdatedValues[cKey] ) {
                if(checkDiff && !foundDiff) {
                  foundDiff = (dataVal[cKey] != cloneUpdatedValues[cKey]);
                }
                dataVal[cKey] = cloneUpdatedValues[cKey];
                delete cloneUpdatedValues[cKey];
              } 
            });
          }
        });
        //Add remaining values to model
        _.each(cloneUpdatedValues, function (val, key) {
          if (key !== "query_id") {
            var keyTokens = (key.indexOf("__") !== -1) ? key.split('__') : undefined,
                tempObj   = {};
            if (!!keyTokens) {
              var parentAttr = (keyTokens[0].indexOf("_") !== -1) ? key.split('_') : undefined;
              if (!!parentAttr) {
                tempObj[key] = val;
                var parentObj = this.model.attributes.data[parentAttr[0]];
                parentObj[keyTokens[0]] = _.extend(parentObj[keyTokens[0]], tempObj);
                checkDiff && (foundDiff = true);
              } else {
                tempObj[key] = val;
                this.model.attributes.data[keyTokens[0]] = _.extend(
                    this.model.attributes.data[keyTokens[0]],
                    tempObj);
                checkDiff && (foundDiff = true);
              }
            } else {
              var keyToken = (key.indexOf("_") !== -1) ? key.split('_') : undefined;
              tempObj[key] = val;
              if (keyToken) {
                this.model.attributes.data[keyToken[0]] = _.extend(
                    this.model.attributes.data[keyToken[0]],
                    tempObj);
                checkDiff && (foundDiff = true);
              }
            }
          }
        }, this);
      }

      return checkDiff ? foundDiff : undefined;
    },

    loadCustomSearch: function () {
      var defaultValues = this.customFormView.formView.customFilter();
      if (!!defaultValues && defaultValues.length !== 0) {
        if (this.$(".csui-custom-search-form-submit").hasClass("binf-disabled")) {
          this._enableSearch(true);
        }
        this.updatedFormValues = this.customFormView.formView.getValues();
        this.queryModel = this.options.query || this.context.getModel(SearchQueryModelFactory);
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
        // Always show results in new perspecitve even when this CVS triggered from search results itself. (using sidepanel)
        params.forcePerspectiveChange = this.options.showInSearchResultsNewPerspective;
        this.resetPageDefaults();
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

    resetPageDefaults: function () {
      this.queryModel.resetDefaults = true;
    }
  });
  return SearchObjectView;
});

csui.define('csui/widgets/search.custom/search.custom.view',[
  'csui/lib/underscore',
  'csui/lib/handlebars',
  'csui/lib/marionette',
  'csui/lib/jquery',
  'csui/utils/base',
  'csui/controls/tile/tile.view',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/controls/tile/behaviors/blocking.behavior',
  'csui/controls/progressblocker/blocker',
  'csui/widgets/search.custom/impl/search.object.view',
  'i18n!csui/widgets/search.custom/impl/nls/lang'
], function (_, Handlebars, Marionette, $, base, TileView, DefaultActionBehavior,BlockingBehavior, BlockingView,
    SearchCustomObjectView, lang) {

  var CustomSearchWidgetView = TileView.extend({
    constructor: function CustomSearchWidgetView(options) {
      options || (options = {});
      options.title = options.title || lang.title;
      options.icon = options.titleBarIcon || 'csui-icon-query-form-search';
      this.context = options.context;

      TileView.prototype.constructor.call(this, options);

      options = options.data ? _.extend(options, options.data) : options;
      this.options = options;
      this.options.parentView = this;
      this.options.blockingParentView = this;
      this.contentViewOptions = this.options;
      this.loadingText=lang.loadingText;
      BlockingView.imbue(this);
      this.blockActions();
    },
    contentView: SearchCustomObjectView,
    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },
    onShow: function () {
      var titleId = _.uniqueId('search');
      this.$el.find('.tile-title .csui-heading').html('').attr('id', titleId);
      this.listenTo(this.contentView, "change:title", this.updateTitle);
      this.$el.find('.tile-header').parent().attr('role', 'region').attr('aria-labelledby', titleId);
      this.$el.find('.tile-content').attr('aria-labelledby', titleId);
    },
    updateTitle: function () {
      this.$el.find('.tile-title .csui-heading').html(base.escapeHtml(this.options.title));
      this.$el.find('.tile-title').attr('title', this.options.title);
      this.$el.find('.tile-controls').attr('title', this.options.title);
    }
  });
  return CustomSearchWidgetView;
});

csui.define('csui/widgets/search.forms/search.form.model',[
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/models/mixins/connectable/connectable.mixin',
    'csui/models/mixins/fetchable/fetchable.mixin',
    'csui/utils/url'
  ], function (_, $, Backbone, ConnectableMixin, FetchableMixin, Url) {
    var SearchFormModel = Backbone.Model.extend({

      constructor: function SearchFormModel(attributes, options) {
        this.options = options || (options = {});
        Backbone.Model.prototype.constructor.call(this, attributes, options);
        this.makeConnectable(options).makeFetchable(options);
      }
    });

    ConnectableMixin.mixin(SearchFormModel.prototype);
    FetchableMixin.mixin(SearchFormModel.prototype);

    _.extend(SearchFormModel.prototype, {

      isFetchable: function () {
        return this.options.node.isFetchable();
      },

      url: function () {
        return Url.combine(this.connector.connection.url,
            'searchtemplates/' + this.get('id'));
      },

      parse: function (response, options) {
        response.name = response.text;
        return response;
      }
    });

    return SearchFormModel;
  });
csui.define('csui/widgets/search.forms/search.form.factory',['module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/contexts/factories/factory',
  'csui/widgets/search.forms/search.form.model',
  'csui/utils/contexts/factories/connector'
], function (module, _, Backbone, ModelFactory,
    SearchFormModel, ConnectorFactory) {

  var SearchFormFactory = ModelFactory.extend({

    propertyPrefix: 'searchTemplate',

    constructor: function SearchFormFactory(context, options) {
      options || (options = {});
      ModelFactory.prototype.constructor.apply(this, arguments);

      var formQuery = this.options.formQuery || {};
      if (!(formQuery instanceof Backbone.Model)) {
        var connector = context.getObject(ConnectorFactory, options),
            config    = module.config();
            formQuery = new SearchFormModel(options.attributes, _.extend({
          connector: connector
        }, config.options, formQuery.options));
      }
      this.property = formQuery;
    },

    fetch: function (options) {
      return this.property.fetch(this.options);
    }

  });

  return SearchFormFactory;

});

// Shows a form
csui.define('csui/widgets/search.forms/search.form.view',['csui/lib/jquery',
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
      // reset the selected nodes in the viewState when we change to custom search. The router does
      // not change and it will be difficult to detect this condition without resetting here.
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
        // Always show results in new perspecitve even when this CVS triggered from search results itself. (using sidepanel)
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

csui.define('csui/widgets/search.results/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.results/impl/nls/root/lang',{
  searchHeader:"Search",
  searchResultsHeaderAria:"Search results header",
  filterHeader:"Refine by",
  loadingSearchResultMessage: "Loading search results...",
  initialLoadMessage: "Search to find",
  noSearchResultMessage: "No results found.",
  searchQueryKeyboardShortcut:  "Press Ctrl+F3 to go to the Search Query box",
  suggestionKeyword: "Suggestions:",
  searchSuggestion1: "Make sure all words are spelled correctly.",
  searchSuggestion2: "Try different keywords.",
  searchSuggestion3: "Try more general keywords.",
  searchSuggestion4: "Try broadening or removing the location restriction.",
  failedSearchResultMessage: "Loading search results failed.",
  owner: "Owner",
  created: "Created",
  createdBy: "Created by",
  modified: "Modified",
  size: "Size",
  type: "Type",
  items: "Items",
  searchResults: "Search Results",
  searchSettings: "Search Settings",
  clearAll: "Clear all",
  about: "About",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
  relevance: "Relevance",
  name: "Name",
  creationDate: "CreationDate",
  showMore: "Show more",
  showMoreAria: "Show more metadata",
  showLess: "Show less",
  showLessAria: "Show less metadata",
  selectAll: "Select all results on current page.",
  selectAllAria: 'Select all results on current page',
  selectItem: 'Select {0}',
  selectItemAria: 'Select {0}. When selected an action bar of options can be reached per shift-tab',
  searchBackTooltip: 'Go back',
  searchBackTooltipTo: 'Go back to \'{0}\'',
  searchBackToHome: 'Home',
  versionText: 'v {0}',
  versionAria: 'version {0}',
  versionSeparator: '.',
  filterExpandTooltip: 'Show filters',
  filterCollapseTooltip: 'Hide filters',
  filterExpandAria: 'Show filter panel',
  filterCollapseAria: 'Hide filter panel',
  searchFormExpandTooltip: 'Show search form',
  searchFormCollapseTooltip: 'Hide search form',
  searchFormExpandAria: 'Show search form panel',
  searchFormCollapseAria: 'Hide search form panel',
  customSearchTab: 'Search',
  searchFilterTab: 'Refine by',
  mimeTypeAria: 'type {0}',
  itemBreadcrumbAria: 'Breadcrumb {0}',
  formatForNone: "{0} items",
  formatForOne: "{0} item",
  formatForTwo: "{0} items",
  formatForFive: "{0} items",
  promotedLabel: "Promoted",
  dialogTitle: "Filters",
  dialogTemplate: "Applying filters would clear your current selection." + "\n" +
                  "Do you want to proceed?",
  standardSearchView: "Standard search view",
  tabularSearchView: "Tabular search view",
  showDescription: "Show description",
  hideDescription: "Hide description",
  descriptionColumnTitle: "Description",
  summaryColumnTitle: "Summary",
  searchTableAria: 'Search Results',
  searchResultsTitle: 'Search results: ',
  saveAs: 'Save as',
  saveAsAria: 'Save as query',
  updateQuery: 'Save',
  updateQueryAria: 'Save query',
  saveOptionsAria: 'Save Options',
});



/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/impl/search.results.header',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <span class=\"csui-search-facet-filter-parent binf-hidden\">\r\n    <span class=\"csui-search-filter\" role=\"button\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"filterLabelAria") : stack1), depth0))
    + "\"\r\n       aria-expanded=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"filterExpandedAria") : stack1), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchFilterTooltip") : stack1), depth0))
    + "\" tabindex=\"0\">\r\n    </span>\r\n  </span>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <span class=\"csui-search-filter-parent binf-hidden\">\r\n    <span class=\"csui-search-form-filter\" role=\"button\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchFormLabelAria") : stack1), depth0))
    + "\"\r\n       aria-expanded=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchFormExpandedAria") : stack1), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchFormTooltip") : stack1), depth0))
    + "\" tabindex=\"0\">\r\n    </span>\r\n  </span>\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"csui-save-search-tools\">\r\n      <button class=\"binf-btn binf-btn-primary csui-query-save\" aria-haspopup=\"true\"\r\n         aria-expanded=\"false\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"saveAsAria") : stack1), depth0))
    + "\" tabindex=\"0\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"saveas") : stack1), depth0))
    + "</button>\r\n      <div class=\"csui-segemented-save-tools binf-hidden\">\r\n        <button class=\"binf-btn binf-btn-primary csui-segmented-save csui-segmented-update-button\"\r\n        aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"updateSavedQueryAria") : stack1), depth0))
    + "\" tabindex=\"0\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"updateSavedQuery") : stack1), depth0))
    + "</button>\r\n        <div class=\"binf-dropdown csui-segmented-dropdown\">\r\n          <button class=\"binf-btn binf-btn-primary binf-dropdown-toggle csui-segmented-save csui-segmented-dropdown-button\"\r\n          data-binf-toggle=\"dropdown\" tabindex=\"0\" aria-haspopup=\"false\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"saveOptionsAria") : stack1), depth0))
    + "\" aria-expanded=\"false\">\r\n            <span class=\"icon-expandArrowDownWhite\">\r\n            </span>\r\n          </button>\r\n          <ul class=\"binf-dropdown-menu\" role=\"menu\">\r\n            <li role=\"presentation\">\r\n              <a role=\"button\" href=\"#\" class=\"csui-update-query\" data-binf-toggle=\"tab\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"updateSavedQuery") : stack1), depth0))
    + "</a>\r\n            </li>\r\n            <li role=\"presentation\">\r\n              <a role=\"button\" href=\"#\" class=\"csui-create-query\" data-binf-toggle=\"tab\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"saveas") : stack1), depth0))
    + "</a>\r\n            </li>\r\n          </ul>\r\n        </div>\r\n      </div>\r\n    </div>\r\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <div class=\"csui-search-header-action csui-search-settings\">\r\n        <div class=\"csui-setting-icon\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"settingsLabel") : stack1), depth0))
    + "\"\r\n             aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"settingsLabel") : stack1), depth0))
    + "\" tabindex=\"0\"\r\n             role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\">\r\n          "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","theme":((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"iconTheme") : stack1),"iconName":"csui_action_settings32"},"loc":{"start":{"line":60,"column":10},"end":{"line":60,"column":96}}})) != null ? stack1 : "")
    + "\r\n        </div>\r\n        <div class=\"csui-settings-dropdown\" role='application'></div>\r\n      </div>\r\n\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-search-header\" aria-label= \""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchResultsHeaderAria") : stack1), depth0))
    + "\" role=\"toolbar\">\r\n  <span class=\"csui-search-arrow-back-parent\">\r\n    <span class=\"icon arrow_back cs-go-back\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchBackTooltip") : stack1), depth0))
    + "\"\r\n      title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"searchBackTooltip") : stack1), depth0))
    + "\" tabindex=\"0\" role=\"button\"></span>\r\n  </span>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"enableSearchFilter") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":6,"column":2},"end":{"line":12,"column":9}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"enableCustomSearch") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":13,"column":2},"end":{"line":19,"column":9}}})) != null ? stack1 : "")
    + "  <div class=\"csui-search-header-title\"></div>\r\n  <div class=\"csui-search-right-header-container binf-hidden\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"showSaveSearch") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":22,"column":4},"end":{"line":46,"column":11}}})) != null ? stack1 : "")
    + "    <div class=\"csui-search-header-action csui-search-sorting\" id=\"csui-search-sorting\"></div>\r\n    <span class=\"csui-search-header-action csui-description-toggle binf-hidden\"\r\n          aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"descriptionTitle") : stack1), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"descriptionTitle") : stack1), depth0))
    + "\"\r\n          role=\"button\" tabindex=\"0\"></span>\r\n    <div class=\"csui-search-header-action csui-tabular-view\"\r\n         aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"tabularViewIconTitle") : stack1), depth0))
    + "\"\r\n         role=\"button\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"tabularViewIconTitle") : stack1), depth0))
    + "\" tabindex=\"0\">\r\n    </div>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"showSettings") : stack1),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"loc":{"start":{"line":55,"column":4},"end":{"line":65,"column":11}}})) != null ? stack1 : "")
    + "  </div>\r\n</div>\r\n<div class=\"csui-table-rowselection-toolbar\"></div>";
}});
Handlebars.registerPartial('csui_widgets_search.results_impl_search.results.header', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/impl/search.results.header.title',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-search-header-title-container\">\r\n  <h2>\r\n    <span id=\"resultsTitle\" class=\"csui-results-title\"></span>\r\n    <span id=\"customSearchTitle\" class=\"csui-custom-search-title\"></span>\r\n  </h2>\r\n</div>\r\n<span id=\"headerCount\" class=\"headerCount\"></span>\r\n<span id=\"searchHeaderCountLive\" role=\"status\" class=\"binf-sr-only\" aria-live=\"polite\"></span>";
}});
Handlebars.registerPartial('csui_widgets_search.results_impl_search.results.header.title', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.results/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.results/nls/root/lang',{
  aboutNHits: "About {0} hits",
  ToolbarItemReserve: "Reserve",
  ToolbarItemUnreserve: "Unreserve"
});


csui.define('csui/widgets/search.results/impl/search.results.header.title.view',[
  'csui/lib/underscore', 'csui/lib/marionette',
  'hbs!csui/widgets/search.results/impl/search.results.header.title',
  'i18n!csui/widgets/search.results/nls/lang',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'css!csui/widgets/search.results/impl/search.results'
], function (_, Marionette, template, publicLang, lang) {
  'use strict';

  var TitleView = Marionette.ItemView.extend({

    template: template,

    constructor: function TitleView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    ui: {
      resultTitle: '#resultsTitle',
      customSearchTitle: '#customSearchTitle',
      headerCount: '#headerCount',
      searchHeaderCountLive: '#searchHeaderCountLive'
    },

    _assignTotalItemElem: function () {
      this.count = this.options.count || 0;
      var countTxt     = _.str.sformat(publicLang.aboutNHits, this.count),
          countTxtAria = "";
      if (this.count !== 0) {
        countTxtAria = countTxt;
      } else {
        countTxtAria = lang.noSearchResultMessage;
      }
      this.ui.headerCount.empty();
      this.ui.headerCount.append(countTxt);

      // with aria-live for the screen reader
      this.countTextAria = lang.searchResults + ": " + countTxtAria + ". " +
                           lang.searchQueryKeyboardShortcut;
      this.ui.searchHeaderCountLive.text(this.countTextAria);

      return true;
    },

    _updateSearchResultsTitle: function () {
      var searchHeaderTitle, tooltipText;
      if (!!this.options.useCustomTitle && !!this.title) {
        this.ui.customSearchTitle.text(this.title);
        tooltipText = lang.searchResults + ': ' + this.title;
        searchHeaderTitle = lang.searchResults + ': ';
      } else {
        searchHeaderTitle = this.options.searchHeaderTitle || lang.searchResults;
        tooltipText = searchHeaderTitle;
      }
      this.ui.resultTitle.text(searchHeaderTitle);
      this.ui.resultTitle.parent().attr("title", tooltipText);
    },

    setCustomSearchTitle: function (title) {
      this.title = '"' + title + '"';
      this.ui.customSearchTitle.text(title);
      var resultsTitle = lang.searchResults + ': ';
      this.ui.resultTitle.text(resultsTitle);
      this.ui.resultTitle.parent().attr("title", resultsTitle + this.title);
    },

    onRender: function () {
      this._assignTotalItemElem();
      this._updateSearchResultsTitle();
    }

  });

  return TitleView;
});

csui.define('csui/widgets/search.results/impl/search.results.header.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/utils/url', 'csui/utils/base',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/namedsessionstorage',
  'csui/models/nodes',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/accessibility',
  'csui/pages/start/perspective.routing',
  'csui/controls/settings/settings.view',
  'csui/controls/globalmessage/globalmessage',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/search.results/controls/sorting/sort.menu.view',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'hbs!csui/widgets/search.results/impl/search.results.header',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/widgets/search.results/impl/search.results.header.title.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/icon/icon.view',
  'csui/utils/high.contrast/detector!',
  'csui/utils/commands',
  'css!csui/widgets/search.results/impl/search.results'
], function (_, $, Backbone, Marionette, Url, base, PreviousNodeModelFactory, NextNodeModelFactory,
    NamedSessionStorage, NodeCollection, UserModelFactory, SearchQueryModelFactory, SearchFormQueryModelFactory,
    Accessibility,
    PerspectiveRouting, SettingsView, GlobalMessage, TabableRegionBehavior, SortingView, lang,
    headerTemplate, ApplicationScopeModelFactory, TitleView, ViewEventsPropagationMixin,
    IconView, highContrast, commands) {

  "use strict";
  var accessibleTable = Accessibility.isAccessibleTable(),
      searchSortingRegion;
  var SearchHeaderView = Marionette.LayoutView.extend({
    className: "csui-search-results-header",
    template: headerTemplate,
    templateHelpers: function () {
      var messages = {
        searchResults: lang.searchResults,
        clearAll: lang.clearAll,
        about: lang.about,
        searchResultsHeaderAria: lang.searchResultsHeaderAria,
        searchBackTooltip: lang.searchBackTooltip,
        searchFilterTooltip: lang.filterExpandTooltip,
        searchFormTooltip: lang.searchFormExpandTooltip,
        filterLabelAria: lang.filterExpandAria,
        filterExpandedAria: this.options.originatingView.showFacet,
        searchFormLabelAria: lang.searchFormExpandAria,
        searchFormExpandedAria: this.options.originatingView.showSearch,
        enableSearchFilter: this.options.enableFacetFilter,
        tabularViewIconTitle: lang.tabularSearchView,
        descriptionTitle: lang.showDescription,
        showSettings: !!this.options.enableSearchSettings,
        settingsLabel: lang.searchSettings,
        tabularSearchView: this.collection.prevSearchDisplayStyle === "TabularView",
        iconTheme: this._useIconsForDarkBackground ? 'dark' : '',
        saveas: lang.saveAs,
        saveAsAria: lang.saveAsAria,
        updateSavedQuery: lang.updateQuery,
        updateSavedQueryAria: lang.updateQueryAria,
        saveOptionsAria: lang.saveOptionsAria
      };
      return {
        messages: messages,
        enableCustomSearch: this.enableCustomSearch,
        showSaveSearch : this.showSaveSearch
      };
    },

    ui: {
      back: '.cs-go-back',
      parent: '.csui-search-arrow-back-parent',
      filter: '.csui-search-filter',
      filterParent: '.csui-search-facet-filter-parent',
      searchParent: '.csui-search-filter-parent',
      search: '.csui-search-form-filter',
      resultTitle: '.csui-results-title',
      searchHeaderTitle: '.csui-search-header-title',
      settingsMenu: '.csui-setting-icon',
      toggleResultsView: '.csui-tabular-view',
      toggleDescription: '.csui-description-toggle',
      headerRightToolbar: '.csui-search-right-header-container',
      saveQuery : '.csui-query-save',
      updateQuery: '.csui-query-update',
      searchQuerySegmentedButton: '.csui-segemented-save-tools',
      segmentedButtonSection: '.csui-segmented-update-button',
      segmentedDropdownSection: '.csui-segmented-dropdown-button',
      saveSearchTools: '.csui-save-search-tools'
    },

    events: {
      'click @ui.saveQuery' : 'onClickSaveQuery',
      'click @ui.segmentedButtonSection' : 'onClickUpdateQuery',
      'click @ui.back': 'onClickBack',
      'click @ui.parent': 'onClickBack',
      'keypress @ui.back': 'onClickBack',
      'click @ui.filter': 'onClickFilter',
      'click @ui.search': 'onClickSearch',
      'keypress @ui.search': 'onClickSearch',
      'click @ui.searchParent': 'onClickSearch',
      'keypress @ui.filter': 'onClickFilter',
      'click @ui.filterParent': 'onClickFilter',
      'click @ui.settingsMenu': '_createSettingsDropdown',
      'keydown @ui.settingsMenu': 'showSettingsDropdown',
      'click @ui.toggleResultsView': 'toggleView',
      'keypress @ui.toggleResultsView': 'toggleView',
      'click @ui.toggleDescription': 'onToggleDescriptionClick',
      'keypress @ui.toggleDescription': 'onToggleDescriptionClick',
      'click .csui-update-query': 'onClickUpdateQuery',
      'click .csui-create-query': 'onClickSaveQuery',
      keydown: "onKeyView"
    },

    regions: {
      settingsRegion: '.csui-settings-dropdown'
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },

    currentlyFocusedElement: function (event) {
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden")');
      if (tabElements.length > 0) {
        tabElements.prop('tabindex', -1);
      }
      if (!!event && event.shiftKey) {
        return $(tabElements[tabElements.length - 1]);
      } else {
        return $(tabElements[0]).hasClass('csui-acc-focusable-active') ? this.ui.filter :
               $(tabElements[0]);
      }
    },

    currentlyFocusedElementInHeader: function (event) {
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden"):visible:not(":disabled")');
      var elementOfFocus = tabElements.length > 0? $(tabElements[this.accNthHeaderItemFocused]): null;
      return elementOfFocus;
    },

    namedSessionStorage: new NamedSessionStorage(),
    constructor: function SearchHeaderView(options) {
      options || (options = {});
      this.enableCustomSearch = options.originatingView.enableCustomSearch;
      this._icon_table_standard = 'csui_action_table_standard32';
      this._icon_table_tabular = 'csui_action_table_tabular32';
      this.localStorage = options && options.localStorage;
      this.accNthHeaderItemFocused = this.enableCustomSearch ? 2 : 0;
      Marionette.LayoutView.prototype.constructor.call(this, options); // apply (modified)
      // options to this
      if (this.collection) {
        this.listenTo(this.collection, 'reset',
            this.updateHeader) // render after reset of collection
            .listenTo(this.collection, 'remove', this._collectionItemRemoved);
      }
      // Use a local clone to remember the node, which may have been visited
      // before the page with this widget got open; the original previousNode
      // gets reset with every perspective change
      this.previousNode = options.context.getModel(PreviousNodeModelFactory).clone();
      this.nextNode = options.context.getModel(NextNodeModelFactory);
      this.searchQuery = options.context.getModel(SearchQueryModelFactory);
      this.searchForm = options.context.getModel(SearchFormQueryModelFactory);
      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.context = options.context;

      // highContrast is 1 for white on dark and 2 for dark on white background
      // show the "dark" icon only when background is dark due to high contrast setting or
      // explicitly enabled by setting useIconsForDarkBackground in options to true and high contrast is not opposite
      this._useIconsForDarkBackground = (options.useIconsForDarkBackground && highContrast !== 2) || highContrast === 1;

      // retrieve user preferred search display style from local storage
      if (this.localStorage.storage && this.localStorage.storage.getItem('PrevSearchDisplayStyle')) {
        this.showDescription = this.localStorage.get(
            this._createSearchDisplayStyleKey() + '_showDescription');
      }

      this.showSaveSearch = this.options.saveSearchTools && this.isQueryObjectUnrestricted();
    },

    initialize: function () {
      this.titleView = this.options.titleView || new TitleView({});
    },

    isQueryObjectUnrestricted: function () {
      var objectTypes = this.options.context && this.options.context._factories.objecttypes && _.has(this.options.context._factories.objecttypes.property.attributes, "objecttypes") &&
      this.options.context._factories.objecttypes.property.attributes.objecttypes;

      //Check if user is restricted to create a search query.
      return !!_.find(objectTypes, function(object){ return object.type === 258; });

    },

    toggleSaveSearchTools: function (showSegmented) {
      if(this.options.originatingView && this.options.originatingView.hasEditPermsForSearchQuery) {
        this.ui.searchQuerySegmentedButton[showSegmented ? 'removeClass' : 'addClass']('binf-hidden');
        this.ui.saveQuery[showSegmented ? 'addClass' : 'removeClass']('binf-hidden');
      }
    },

    updateSaveSearchTools: function (afterUpdate, afterSave) {
      var isSavedQuery = this.options.originatingView.enableCustomSearch;
      if (isSavedQuery) {
        if (afterUpdate) {  //For saved queries, after updating query, only Save as button should be visible
          this.disableSaveSearchTools = false;
          this.toggleSaveSearchTools(false);
        } else if (!this.disableSaveSearchTools && !afterSave) { //After modifying search, segmented buttons should be visisble
          this.disableSaveSearchTools = true;
          this.toggleSaveSearchTools(true);
        }
      } else if (!isSavedQuery && this.options.originatingView.previousSavedQuery) {
        this.ui.searchQuerySegmentedButton['removeClass']('binf-hidden');
        this.ui.saveQuery['addClass']('binf-hidden');
        if (afterSave || afterUpdate) {  //In case of normal search results,after performing save/update disable the segmented buttons
          this.ui.segmentedButtonSection['prop']('disabled', true);
          this.ui.segmentedDropdownSection['prop']('disabled', true);
        } else {
          this.ui.segmentedButtonSection['prop']('disabled', false);
          this.ui.segmentedDropdownSection['prop']('disabled', false);
        }
      } else {
        this.toggleSaveSearchTools(false);
      }
    },

    updateHeader: function () {
      if(!this.titleViewRendered){
        this.renderTitleView();
      }
      /**
       * toggleClasses is anonymous function which adds and remove classes to header sub-elements.
       *
       * @param toggle
       */
      var toggleClasses = _.bind(function(toggle) {
        this.ui.back[toggle ? 'addClass' : 'removeClass']('search_results_data');
        this.ui.filter[toggle ? 'addClass' : 'removeClass']('search_results_data');
        this.ui.filterParent[toggle ? 'removeClass' : 'addClass']('binf-hidden');
        this.ui.searchParent[toggle
          && this.options.originatingView.enableCustomSearch
          ? 'removeClass' : 'addClass']('binf-hidden');
        this.ui.headerRightToolbar[toggle ? 'removeClass' : 'addClass']('binf-hidden');
        //In case of search form ,hide the save/update query buttons
        this.ui.saveSearchTools.length !== 0 && this.ui.saveSearchTools[toggle
           && !this.searchQuery.get('enableSearchForm') ? 'removeClass' : 'addClass']('binf-hidden');

        this.ui.saveSearchTools.length !== 0
         && !this.options.originatingView.hasEditPermsForSearchQuery
         && this.ui.searchQuerySegmentedButton['addClass']('binf-hidden');
      }, this);

      if (this.collection && this.collection.length) {
        toggleClasses(true);
        if (this.options.enableFacetFilter) {
          this.filterIconView = new IconView(
              {iconName: 'csui_action_filter32', states: true, on: this._filterStateIsOn});
          this.filterIconRegion = new Marionette.Region({el: this.ui.filter});
          this.filterIconRegion.show(this.filterIconView);
        }
        if (this.enableCustomSearch) {
          this.searchIconView = new IconView(
            {
              iconName: 'csui_action_search32',
              size: 'normal', states: true,
              on: this._searchStateIsOn
            });
          this.searchIconRegion = new Marionette.Region({ el: this.ui.search });
          this.searchIconRegion.show(this.searchIconView);
        }
        this.toggleDescriptionIconView = new IconView(
            {iconName: 'csui_action_reveal_description32', states: true, on: this.showDescription, theme: this._useIconsForDarkBackground ? 'dark' : ''});
        this.toggleDescriptionIconRegion = new Marionette.Region({el: this.ui.toggleDescription});
        this.toggleDescriptionIconRegion.show(this.toggleDescriptionIconView);

        this.toggleResultsIconView = new IconView(
            {iconName: this._icon_table_standard, states: true, theme: this._useIconsForDarkBackground ? 'dark' : ''});
        this.toggleResultsRegion = new Marionette.Region({el: this.ui.toggleResultsView});
        this.toggleResultsRegion.show(this.toggleResultsIconView);
        this.updateToggleIcon();
      } else {
        toggleClasses(false);
        this.setFacetOpened(false);
      }
      this.updateToggleDescriptionIcon();
      this.updateToggleDescription();
      if (this.collection.prevSearchDisplayStyle === "TabularView") {
        this._createSortRegion();
        this._createSortingView();
      }
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden")');
      tabElements.length > 0 && tabElements.splice(this.accNthHeaderItemFocused, 1);
      if (tabElements.length > 0) {
        tabElements.prop('tabindex', -1);
      }
      var ele = this.currentlyFocusedElementInHeader();
      ele && ele.attr("tabindex", 0);
      this.titleViewRendered = false;
    },

    setFacetOpened: function (isOpened) {
      this._filterStateIsOn = isOpened;
      this.filterIconView && this.filterIconView.setIconStateIsOn(isOpened);  // triggers rerender of icon with new state
    },
    setSearchOpened: function (isOpened) {
      this._searchStateIsOn = isOpened;
      this.searchIconView && this.searchIconView.setIconStateIsOn(isOpened);  // triggers rerender of icon with new state
    },

    updateToggleDescriptionIcon: function () {
      if (this.collection.prevSearchDisplayStyle === "TabularView") {
        this.$el.find('.csui-description-toggle').removeClass('search-settings-none');
        this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
        if (this.showDescription) {
          this.$el.find('.csui-description-toggle').attr("title", lang.hideDescription);
          this.$el.find('.csui-description-toggle').attr("aria-label", lang.hideDescription);
        } else {
          this.$el.find('.csui-description-toggle').attr("title", lang.showDescription);
          this.$el.find('.csui-description-toggle').attr("aria-label", lang.showDescription);
        }
      } else {
        this.$el.find('.csui-description-toggle').addClass('binf-hidden');
        this.$el.find('.csui-description-toggle').removeClass('icon-description-shown');
      }
    },

    updateToggleDescription: function () {
      if (this.options.originatingView &&
          this.options.originatingView.collection.prevSearchDisplayStyle === "TabularView") {
        if (accessibleTable && this.options.originatingView.targetView) {
          this.options.originatingView.getAdditionalColumns();
        } else {
          var descriptiveItems = this.options.originatingView.collection.filter(
              function (model) { return model.get('description') }),
              summaryItems = this.options.originatingView.collection.filter(
                  function (model) { return model.get('summary') }),
              showDescriptionFlag = this.localStorage.get(
                  this._createSearchDisplayStyleKey() + '_showDescription');
          this.selectedSettings = (this.selectedSettings) ? this.selectedSettings :
                                  this.collection.selectedSettings;
          switch (this.selectedSettings) {
          case 'DO': {
            if (descriptiveItems.length) {
              this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
              this._setShowDescriptions(showDescriptionFlag);
              if (showDescriptionFlag) {
                this.$el.find('.csui-description-toggle').removeClass('icon-description-hidden')
                    .addClass('icon-description-shown');
                this.$el.find('.csui-description-collapsed').removeClass(
                    'csui-description-collapsed');
              }
            } else if (!this.$el.find('.csui-description-toggle').hasClass('binf-hidden')) {
              this.$el.find('.csui-description-toggle').addClass('binf-hidden');
              this._setShowDescriptions(false);
              this.options.originatingView && this.options.originatingView.targetView &&
              this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                  'csui-description-collapsed');
            }
            break;
          }
          case 'SP':
          case 'DP':
          case 'SD': {
            if (descriptiveItems.length || summaryItems.length) {
              this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
              this._setShowDescriptions(showDescriptionFlag);
              if (showDescriptionFlag) {
                this.$el.find('.csui-description-toggle').removeClass(
                    'icon-description-hidden').addClass('icon-description-shown');
                this.$el.find('.csui-description-collapsed').removeClass(
                    'csui-description-collapsed');
              }
            } else if (!this.$el.find('.csui-description-toggle').hasClass('binf-hidden')) {
              this.$el.find('.csui-description-toggle').addClass('binf-hidden');
              this._setShowDescriptions(false);
              this.options.originatingView && this.options.originatingView.targetView &&
              this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                  'csui-description-collapsed');
            }
            break;
          }
          case 'SO': {
            if (summaryItems.length) {
              this.$el.find('.csui-description-toggle').removeClass('binf-hidden');
              this._setShowDescriptions(showDescriptionFlag);
              if (showDescriptionFlag) {
                this.$el.find('.csui-description-toggle').removeClass(
                    'icon-description-hidden').addClass('icon-description-shown');
                this.$el.find('.csui-description-collapsed').removeClass(
                    'csui-description-collapsed');
              }
            } else if (!this.$el.find('.csui-description-toggle').hasClass('binf-hidden')) {
              this.$el.find('.csui-description-toggle').addClass('binf-hidden');
              this._setShowDescriptions(false);
              this.options.originatingView && this.options.originatingView.targetView &&
              this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                  'csui-description-collapsed');
            }
            break;
          }
          case 'NONE': {
            this.$el.find('.csui-description-toggle').addClass('search-settings-none');
            this.options.originatingView && this.options.originatingView.targetView &&
            this.options.originatingView.targetView.$el.find('.cs-description').addClass(
                'csui-description-collapsed');
            this._setShowDescriptions(false);
            break;
          }
          }
        }
      }
    },
    onRender: function () {
      this.renderTitleView();
      if (this.collection && this.collection.length) {
        this.ui.back.addClass('search_results_data');
        this.ui.filter.addClass('search_results_data');
      } else {
        this.ui.back.addClass('search_results_nodata');
        this.ui.filter.addClass('search_results_nodata');
      }

      this.listenTo(this.options.originatingView, 'queryTools:update', function () {
        this.showSaveSearch && this.updateSaveSearchTools();
      });

      this.rendered = true;
      this.$el.show();

      var hideBackButton, viewStateModel = this.context && this.context.viewStateModel;
      // This checks the whole browser history, since the page has been loaded;
      // not just the history in the window, since the Smart UI has appeared there.
      // Making the page behave differently, when opened in the browser directly
      // and when navigating to it from some link is a bad practice.  UI breaks
      // the principle, that the URL shows a resource in the same way.  *If you
      // reload the page - it is just hitting F5 - the artificial state built
      // among the internal navigation gets lost anyway*.  It is better to leave
      // the browser history on the browser and its handling on the browser and
      // its buttons and not trying to "help the user" by duplicating the
      // functionality like this.
      if (this.options.enableBackButton) {
        this.ui.back.attr('title', this.options.backButtonToolTip);
        this.ui.back.attr('aria-label', this.options.backButtonToolTip);
      } else if (this._isViewStateModelEnabled() && !viewStateModel.hasRouted()) {
        hideBackButton = true;
      } else if (PerspectiveRouting.getInstance(this.options).hasRouted() || history.state ||
                 this._isViewStateModelEnabled() ||
                 this.previousNode.get('id') ||
                 (!!this.namedSessionStorage && this.namedSessionStorage.get("previousNodeId")) ||
                 this._isPreviousRouter("Metadata")) {
        // In integration scenario we cannot depend on history.state to show back button.
        //So providing a option to show backbutton based on option
        this._setBackButtonTitle();
      } else {
        hideBackButton = true;
      }

      if (hideBackButton) {
        this.ui.back.hide();
        this.ui.parent.hide();
      }

      if (!this.tableRowSelectionToolbarRegion) {

        this._createToolbarRegion();

        this.options.originatingView._updateToolbarActions();
      }

      if (this._isViewStateModelEnabled()) {
        viewStateModel && this.listenTo(viewStateModel, "navigate", function (historyEntry) {
          if (historyEntry && hideBackButton) {
            this.ui.back.show();
            this.ui.parent.show();
          }
        });
      }
    },

    renderTitleView: function () {
      _.extend(this.titleView.options, {
        count: this.collection && this.collection.totalCount,
        useCustomTitle: !!this.options.useCustomTitle,
        searchHeaderTitle: this.collection && this.collection.searching ?
                           this.collection.searching.result_title : lang.searchResults
      });

      this.titleView.render();
      Marionette.triggerMethodOn(this.titleView, 'before:show', this.titleView, this);
      this.ui.searchHeaderTitle.append(this.titleView.el);
      Marionette.triggerMethodOn(this.titleView, 'show', this.titleView, this);
    },

    onBeforeDestroy: function () {
      this.titleView.destroy();
    },

    onClickSaveQuery: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.resetTabIndex();
      var self = this,
        context = this.context,
        connector = this.collection.connector,
        saveQuery = commands.get('SaveQuery'),
        promise = saveQuery.execute({
          context: context,
          connector: connector,
          originatingView: this.options.originatingView
        }, this.collection);
      promise.always(function () {
        var succeeded = promise.state() === 'resolved';
        succeeded && self.updateSaveSearchTools(false, true);
      });
      this._closeSaveSearchToolsDropdown();
    },

    onClickUpdateQuery: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.resetTabIndex();
      var self = this,
        context = this.context,
        connector = this.collection.connector,
        updateQuery = commands.get('UpdateQuery'),
        promise = updateQuery.execute({
          context: context,
          connector: connector
        }, {
          cache_id: this.collection.cacheId ? this.collection.cacheId : this.collection.searching.cache_id,
          queryId: this.searchQuery.get('query_id') ? this.searchQuery.get('query_id') : this.options.originatingView.previousSavedQuery
        });
      promise.always(function () {
        var succeeded = promise.state() === 'resolved';
        if(succeeded) {
          //Make filters read only if there are any only in case of search queries
          if(self.enableCustomSearch && !self.searchQuery.get('enableSearchForm')) {
            self.trigger('readonly:filters');
          }
          self.updateSaveSearchTools(true, false);
        }
      });
      this._closeSaveSearchToolsDropdown();
    },

    _closeSaveSearchToolsDropdown: function () {
      if (this.ui.segmentedDropdownSection && this.ui.segmentedDropdownSection.parent().hasClass('binf-open')) {
        this.ui.segmentedDropdownSection.binf_dropdown('toggle');
      }
    },

    showSettingsDropdown: function (event) {
      var keyCode = event.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        this._createSettingsDropdown(event);
        event.preventDefault();
        event.stopPropagation();
      }
    },

    _createSettingsDropdown: function (event) {
      var eventTarget = event.currentTarget;
      if (!eventTarget.classList.contains('csui-setting-icon')) {
        return; // event bubbled from dropdown to toolbar item => ignore it
      }
      if (!this.settingsView || (this.settingsView && this.settingsView.isDestroyed())) {
        $(document).on('mouseup.dropdown.' + this.cid, _.bind(this._closeSettingsMenu, this));
        this.data = {};
        this.settingsView = new SettingsView({
          model: this.options.settings,
          tableCollection: this.collection,
          data: this.data,
          searchResultsView: this.options.originatingView,
          isTabularView: this.collection.prevSearchDisplayStyle === 'TabularView'
        });
        this.listenTo(this.settingsView, 'close:menu', _.bind(function (event) {
          this._destroySettingsDropdown(event);
        }, this));
        this.settingsRegion.show(this.settingsView);
        this.$el.children().find('.csui-setting-icon').attr('aria-expanded', true);
        this.propagateEventsToViews(this.settingsView);
        this.settingsView.$el.find('.binf-show').trigger('focus');
        this.settingsView.isVisible = true;
        this.listenTo(this.settingsView, 'update:showSummaryDescriptions', function () {
          this.selectedSettings = this.settingsView.model.get(
              'display').summary_description.selected;
          if (this.collection.prevSearchDisplayStyle === "TabularView") {
            this.options.originatingView.targetView.selectedSettings = this.selectedSettings;
            this.options.originatingView.targetView.options.descriptionRowViewOptions
                .showSummaryOnly = this.selectedSettings === 'SO';
            this.updateHeader();
            this._createSortRegion();
            this._createSortingView();
            this._createToolbarRegion();
            this.options.originatingView._updateToolbarActions();
            if (this.options.originatingView.collection.selectedItems &&
                this.options.originatingView.collection.selectedItems.length > 0) {
              this.options.originatingView.collection.selectedItems.reset(
                  this.options.originatingView.targetView._allSelectedNodes.models);
              this.options.originatingView.targetView._tableRowSelectionToolbarView.trigger(
                  'toggle:condensed:header');
            }
          } else {
            this.options.originatingView.targetView.render();
            this.options.originatingView.targetView.trigger('render:metadata');
          }
        });
      } else {
        this._destroySettingsDropdown();
        this.$el.find('.csui-search-settings').attr('aria-expanded', false);
      }
      this.setAccNthHeaderItemFocused(this.ui.settingsMenu);
    },

    _destroySettingsDropdown: function (event) {
      this.settingsView.destroy();
      $(document).off('mouseup.dropdown.' + this.cid);
      if (!!this.data.summary_description || !!this.data.display_regions) {
        this.options.originatingView.blockActions();
        // setting the isSortOptionSelected only when there is a change in search settings
        this.collection.isSortOptionSelected = true;
        this.formData = new FormData();
        var self = this;
        _.mapObject(this.data, function (value, key) {
          if (key === 'display_regions') {
            self.formData.append(key, value);
          } else if (key === 'summary_description') {
            self.formData.append(key, value);
          }
        });
        this.settingsView.model.save(null, {
          parse: false,
          data: this.formData,
          processData: false,
          cache: false,
          contentType: false
        }).done(_.bind(function (response) {
          if (!!self.data.summary_description) {
            self.settingsView.model.get(
                'display').summary_description.selected = self.data.summary_description;
            self.settingsView.trigger('update:showSummaryDescriptions');
            self.options.originatingView.collection.settings_changed = false;
          }
          if (!!self.data.display_regions) {
            self.options.originatingView.unblockActions();
            self.options.originatingView.collection.settings_changed = true;
            self.settingsView.options.tableCollection.fetch();
          }
          if (!self.options.originatingView.collection.settings_changed) {
            self.options.originatingView.executeEndProcess();
            self.trigger('render:table');
          }
          this.$el.find(".csui-setting-icon").trigger('focus');
        }, this)).fail(function (error) {
          //onfailure to save search settings
          error = new base.Error(error);
          GlobalMessage.showMessage('error', error.message);
          self.options.originatingView.unblockActions();
        });
        if (this.options.originatingView && this.options.originatingView.targetView &&
            this.options.originatingView.targetView.standardHeaderView) {
          this.options.originatingView.targetView.standardHeaderView.expandAllView.pageChange();
          this.options.originatingView.targetView.standardHeaderView.expandAllView._isExpanded = false;
        }
      }
      if (this.settingsView.isChanged) {
        if (this.options.originatingView) {
          this.trigger('render:table');
          this.settingsView.isChanged = false;
        }
      }
    },

    _closeSettingsMenu: function (e) {
      var loaderDisabled = !!this.options.originatingView.$el.find(
          '.load-container.binf-hidden').length;
      if (!loaderDisabled || (this.ui.settingsMenu.is && this.ui.settingsMenu.is(e && e.target)) ||
          (this.settingsView && this.settingsView.$el.has(e && e.target).length)) {
        e.stopPropagation();
      } else if (!(this.settingsView && this.settingsView.isDestroyed())) {
        this._destroySettingsDropdown(e);
        this.$el.find(".csui-setting-icon").trigger('focus').attr('aria-expanded', false);
      }
    },

    onToggleDescriptionClick: function (e) {
      if ((e.type === 'keypress' && (e.keyCode === 13 || e.keyCode === 32)) ||
          (e.type === 'click')) {
        e.preventDefault();
        var originatingView = this.options.originatingView;
        if (!this.showDescription) {
          this.localStorage.set(this._createSearchDisplayStyleKey() + '_showDescription', true);
          originatingView.targetView.options.descriptionRowViewOptions.showDescriptions = true;
          this.ui.toggleDescription.attr("title", lang.hideDescription);
          this.ui.toggleDescription.attr("aria-label", lang.hideDescription);
          this._setShowDescriptions(true);
        } else {
          this.localStorage.set(this._createSearchDisplayStyleKey() + '_showDescription', false);
          originatingView.targetView.options.descriptionRowViewOptions.showDescriptions = false;
          this.ui.toggleDescription.attr("title", lang.showDescription);
          this.ui.toggleDescription.attr("aria-label", lang.showDescription);
          originatingView.$el.find('.cs-description').addClass('csui-description-collapsed');
          this._setShowDescriptions(false);
        }
        this.$el.find('.csui-description-toggle').trigger('focus');
        this.currentlyFocusedElement();
        this.setAccNthHeaderItemFocused(this.ui.toggleDescription);
        var ele = this.currentlyFocusedElementInHeader();
        ele && ele.attr("tabindex",0);
      }
    },

    _setShowDescriptions: function (show) {
      this.showDescription = show;
      this.toggleDescriptionIconView && this.toggleDescriptionIconView.setIconStateIsOn(show);
      this.trigger('toggle:description', {showDescriptions: show});
    },

    toggleView: function (e) {
      if ((e.type === 'keypress' && (e.keyCode === 13 || e.keyCode === 32)) ||
          (e.type === 'click')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        this.ui.toggleResultsView.removeClass('csui-toggledView');
        if (this.collection.prevSearchDisplayStyle === "TabularView") {
          if (this.$el.parent('#header').hasClass('csui-show-header')) {
            this.$el.parent('#header').removeClass('csui-show-header');
            this.$el.find('.csui-search-header').removeClass('csui-show-header');
          }
          this.$el.find('.csui-table-rowselection-toolbar').addClass('binf-hidden');
          this._prevSearchDisplayStyleLocalStorage("StandardView");
          this.collection.prevSearchDisplayStyle = "StandardView";
          searchSortingRegion && searchSortingRegion.$el.empty();
        } else {
          this._prevSearchDisplayStyleLocalStorage("TabularView");
          this.collection.prevSearchDisplayStyle = "TabularView";
          this._createSortRegion();
          this.collection.isSortOptionSelected = true;
          this._createSortingView();
          this._createToolbarRegion();
          this.ui.toggleResultsView.addClass('csui-toggledView');
          if (this.collection.selectedItems.length > 0) {
            this.$el.find('.csui-search-header').addClass('csui-show-header');
            this.$el.parent('#header').addClass('csui-show-header');
          }
        }
        this.updateToggleIcon();
        this.updateToggleDescriptionIcon();
        this.updateToggleDescription();
        this.trigger('reload:searchForm');
        this.currentlyFocusedElement();
        this.setAccNthHeaderItemFocused(this.ui.toggleResultsView);
        var ele = this.currentlyFocusedElementInHeader();
        ele && ele.attr("tabindex", 0);
        this.ui.toggleResultsView.trigger('focus');
      }
    },

    updateToggleIcon: function () {
      if (this.collection.prevSearchDisplayStyle === "TabularView") {
        this.ui.toggleResultsView.attr("title", lang.standardSearchView);
        this.ui.toggleResultsView.attr("aria-label", lang.standardSearchView);
        this.toggleResultsIconView.setIcon(this._icon_table_standard);
      } else {
        this.ui.toggleResultsView.attr("title", lang.tabularSearchView);
        this.ui.toggleResultsView.attr("aria-label", lang.tabularSearchView);
        this.toggleResultsIconView.setIcon(this._icon_table_tabular);
      }
    },

    _createSortRegion: function () {
      // FIXME: Saving a view-specific region in global variable is
      // one of the worst and stupidest things that I have ever seen.
      // 1. User instance variables to keep view instance state and data.
      // 2. Use addRegion to keep this optional region inside the view.
      // 3. Do not use ID in widgets to prevent conflicts. Use classes.
      searchSortingRegion = new Marionette.Region({
        el: this.$('#csui-search-sorting')
      });
    },

    _createSortingView: function () {
      var originatingView = this.options.originatingView,
          sortingView;

      if (originatingView) {
        if (!originatingView.sortingView) {
          sortingView = new SortingView({
            collection: this.options.collection,
            enableSorting: this.options.enableSorting !== undefined ? this.options.enableSorting :
                           true
          });
        } else {
          sortingView = originatingView.sortingView;
        }
        searchSortingRegion.show(sortingView);
      }
    },

    _createToolbarRegion: function () {
      var tableRowSelectionToolbarRegion = new Marionette.Region({
        el: '.csui-search-results-header .csui-table-rowselection-toolbar'
      });
      this.tableRowSelectionToolbarRegion = tableRowSelectionToolbarRegion;
    },

    _isPreviousRouter: function (name) {
      var viewStateModel = this.context.viewStateModel;
      return viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.LAST_ROUTER) === name;
    },

    _prevSearchDisplayStyleLocalStorage: function (searchDisplayStyle) {
      this.localStorage.set(this._createSearchDisplayStyleKey(), searchDisplayStyle);
    },

    _setBackButtonTitle: function () {
      // The search should allow the viewStateModel to handle the navigation
      // and where to go next. Do not save any information about the next node
      // or the pervious node.
      // More cleanup is needed also.
      var name = lang.searchBackToHome;
      var viewStateModel = this.context.viewStateModel;
      name = viewStateModel && viewStateModel.getBackToTitle();
      this.ui.back.attr('title', _.str.sformat(lang.searchBackTooltipTo, name));
      this.ui.back.attr('aria-label', _.str.sformat(lang.searchBackTooltipTo, name));
    },

    setCustomSearchTitle: function (title) {
      !!this.titleView.setCustomSearchTitle &&
      this.titleView.setCustomSearchTitle(title);
    },

    _collectionItemRemoved: function () {
      var originalCount = this.collection.totalCount;
      this.collection.totalCount = --this.collection.totalCount;
      if (this.collection.prevSearchDisplayStyle === "TabularView" &&
          this.tableRowSelectionToolbarRegion) {
        delete this.tableRowSelectionToolbarRegion;
      }
      this.render();
      this.titleViewRendered = true;
      this.updateHeader();
      this.collection.totalCount = originalCount;
    },

    onClickBack: function (event) {
      if (this.backButtonClicked) {
        // protect against getting called twice when search invoked from my assignments and hitting
        // the back button in the search result.
        return;
      }
      this.backButtonClicked = true;
      if ((event.type === 'keypress' && event.keyCode === 13) || (event.type === 'click')) {
        if (this.options.enableBackButton) {
          event.stopPropagation();
          //To notify the caller about back button navigation
          //as we don't have previousNode in integration scenario
          this.trigger("go:back");
        } else if (this._isViewStateModelEnabled()) {
          if (this.context.viewStateModel.getLastRouterIndex() !== -1) {
            this.context.viewStateModel.restoreLastRouter();
          } else {
            this.applicationScope.set('id', '');
          }
        } else if (this.previousNode.get('id') ||
                   (!!this.namedSessionStorage && this.namedSessionStorage.get("previousNodeId"))) {
          // Force reloading of the widget data.
          this.nextNode.set('id', undefined, {silent: true});
          this.nextNode.set('id', this.namedSessionStorage.get("previousNodeId"));
        } else {
          this.applicationScope.set('id', '');
        }
      }
    },

    _isViewStateModelEnabled: function () {
      return this.context && this.context.viewStateModel;
    },

    onClickFilter: function (event) {
      if ((event.type === 'keypress'
        && (event.keyCode === 13 || event.keyCode === 32))
        || (event.type === 'click')) {
        event.preventDefault();
        event.stopPropagation();
        this.searchinit = false;
        this.filterinit = true;
        this.trigger("open:facet:view", this.options.originatingView);
        this.trigger("toggle:filter", this.options.originatingView);
        this.trigger("focus:filter", this.options.originatingView);
        this.trigger("correct:search:aria", this.options.originatingView);
        this.setAccNthHeaderItemFocused(this.ui.filter);
      }
    },

    onClickSearch: function (event) {
      if ((event.type === 'keypress'
        && (event.keyCode === 13 || event.keyCode === 32))
        || (event.type === 'click')) {
        event.preventDefault();
        event.stopPropagation();
        this.searchinit = true;
        this.filterinit = false;
        this.trigger("open:custom:view", this.options.originatingView);
        this.trigger("toggle:search", this.options.originatingView);
        this.trigger("focus:search", this.options.originatingView);
        this.trigger("correct:filter:aria", this.options.originatingView);
        this.setAccNthHeaderItemFocused(this.ui.search);
      }
    },

    onKeyView: function (event) {
      if (event.type === "keydown") {
        var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden"):visible:not(":disabled")');
        if (event.keyCode != 9 && event.keyCode != 16) {
          this.currentlyFocusedElement();
        }
        switch (event.keyCode) {
          case 39:
            // right arrow key
            if (this.accNthHeaderItemFocused < tabElements.length - 1) {
              this.accNthHeaderItemFocused++;
            }
            this._moveTo(event);
            break;
          case 37:
            // left arrow key
            if (this.accNthHeaderItemFocused > 0) {
              this.accNthHeaderItemFocused--;
            }
            this._moveTo(event);
            break;
          case 13:
          case 32:
            $(event.target).click();
            event.preventDefault();
            event.stopPropagation();
            this.currentlyFocusedElementInHeader().trigger("focus");
            this.currentlyFocusedElementInHeader().attr("tabindex", 0);
            break;
        }
      }
    },
    resetTabIndex: function(){
      var tabElements = this.$('.csui-search-header *[tabindex]:not(".binf-hidden"):visible');
      if(tabElements && tabElements.length>0){
        tabElements[0].tabIndex=0;
        for (var i = 1; i < tabElements.length; i++) {
          tabElements[i].tabIndex=-1;
        }
        this.accNthHeaderItemFocused = 0;
      }
    },
    setAccNthHeaderItemFocused: function (icon) {
      var tabElements = this.$('*[tabindex]:not(".binf-hidden"):visible');
      this.accNthHeaderItemFocused = tabElements.index(icon);
    },

    _moveTo: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.trigger("changed:focus", this);
      this.currentlyFocusedElementInHeader().trigger("focus");
      this.currentlyFocusedElementInHeader().attr("tabindex", 0);
    },

    _createSearchDisplayStyleKey: function () {
      var context = this.context || (this.options && this.options.context),
        srcUrl = new Url().getAbsolute(),
        userID = context && context.getModel(UserModelFactory).get('id'), hostname;
      if (srcUrl == "undefined" || srcUrl == "null") {
        hostname = !!srcUrl && !!userID ? (srcUrl + userID) : "defaultSearchDisplayStyle";
      }
      else {
        hostname = srcUrl && srcUrl.split('//')[1] && srcUrl.split('//')[1].split('/')[0].split(':')[0] + userID;
      }
      return hostname;
    }
  });
  _.extend(SearchHeaderView.prototype, ViewEventsPropagationMixin);
  return SearchHeaderView;
});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/impl/metadata/search.metadata',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " <span class=\"csui-count\" >+"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"count") || (depth0 != null ? lookupProperty(depth0,"count") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"count","hash":{},"loc":{"start":{"line":9,"column":28},"end":{"line":9,"column":37}}}) : helper)))
    + "</span>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-search-metadata-label\">\r\n     <span class=\"csui-search-metadata binf-col-lg-4 binf-col-md-4 binf-col-sm-4\r\n                    binf-col-xs-4\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"titleAttr") || (depth0 != null ? lookupProperty(depth0,"titleAttr") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"titleAttr","hash":{},"loc":{"start":{"line":3,"column":42},"end":{"line":3,"column":55}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"label") || (depth0 != null ? lookupProperty(depth0,"label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"label","hash":{},"loc":{"start":{"line":3,"column":57},"end":{"line":3,"column":66}}}) : helper)))
    + "</span>\r\n</div>\r\n<div class=\"csui-search-metadata-value\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"tooltipText") || (depth0 != null ? lookupProperty(depth0,"tooltipText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"tooltipText","hash":{},"loc":{"start":{"line":5,"column":47},"end":{"line":5,"column":62}}}) : helper)))
    + "\">\r\n<span class=\"searchDetails binf-col-lg-7 binf-col-md-7 binf-col-sm-7\r\n                    binf-col-xs-7\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"value") || (depth0 != null ? lookupProperty(depth0,"value") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"value","hash":{},"loc":{"start":{"line":7,"column":35},"end":{"line":7,"column":44}}}) : helper)))
    + "</span>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"count") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":8,"column":0},"end":{"line":10,"column":7}}})) != null ? stack1 : "")
    + "</div>\r\n\r\n";
}});
Handlebars.registerPartial('csui_widgets_search.results_impl_metadata_search.metadata', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.results/impl/metadata/search.metadata.view',[
  'csui/lib/jquery','csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/base',
  'csui/controls/table/cells/cell.factory', 'csui/controls/table/cells/templated/templated.view',
  'csui/controls/table/cells/search/category/category.popover.list.view',
  'csui/utils/types/date', 'i18n!csui/widgets/search.results/impl/nls/lang',
  'hbs!csui/widgets/search.results/impl/metadata/search.metadata',
  'css!csui/widgets/search.results/impl/search.results'
], function ($,_, Marionette, base, cellViewFactory, cellView, CategoryPopover, date, lang, itemTemplate) {
  "use strict";

  var SearchMetadataItemView = Marionette.ItemView.extend({
    className: "csui-search-item-details binf-col-lg-12",
    template: itemTemplate,
    attributes: {
      'role': 'listitem'
    },

    events: {
      'click .csui-count': 'openPopover',
      'keydown .csui-search-metadata-value': 'onKeyInView'
    },

    constructor: function SearchMetadataItemView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      var CellView = cellViewFactory.getCellView(this.model);
      if (CellView.columnClassName === "") {
        CellView = cellView;
      }
      var column = {
        CellView: CellView,
        attributes: this.model.attributes,
        name: this.model.get("key"),
        title: this.model.get('title') || this.model.get('name') ||
          this.model.get("column_name")
      };
      this.metadataView = new CellView({
          tagName: 'span',
          model: this.options.searchItemModel,
          column: column,
          originatingView: this.options.originatingView,
          searchMetadataView: this
        });
    },

    templateHelpers: function () {
      if (this._index < this.options.displayCount) {
        if (this._index < 2) {
          this.el.classList.add('csui-search-result-item-tobe-hide');
        }
      } else {
        this.el.classList.add('csui-search-hidden-items');
        this.el.classList.add('truncated-' + this.options.rowId);
      }
      var metadataValue = this.metadataView.getValueData && this.metadataView.getValueData();
      return {
        label: this.model.get("name"),
        titleAttr : this.model.get("titleAttr") || this.model.get("name"),
        value: metadataValue &&
               (metadataValue.formattedValue || metadataValue.value || metadataValue.name),
        tooltipText: metadataValue &&
                     (metadataValue.value || metadataValue.name || metadataValue.nameAria),
        count: metadataValue && metadataValue.count
      };
    },

    onRender: function(){
      if(this.metadataView.collection){
        var searchMetadataValue = $(this.$el.find('.csui-search-metadata-value')),
        searchMetadataAria = this.metadataView.getValueData && this.metadataView.getValueData().value;
        searchMetadataValue.attr('tabindex', 0);
        searchMetadataValue.attr('aria-label', searchMetadataAria);
        searchMetadataValue.attr('role', 'button');
      }
    },

    openPopover: function (event) {
      this.metadataView.openPopover(event);
    },

    onKeyInView : function(event){
      this.metadataView.onKeyInView(event);
    }
  });

  var SearchMetadataCollectionView = Marionette.CollectionView.extend({
    className: "csui-search-items-metadata",
    childView: SearchMetadataItemView,
    ui: {
      fieldsToBeHiddenOnHover: '.csui-search-result-item-tobe-hide'
    },
    childViewOptions: function () {
      return {
        rowId: this.options.rowId,
        searchItemModel: this.model,
        displayCount: this.childDisplayCount,
        originatingView: this.options.originatingView
      };
    },

    constructor: function SearchMetadataCollectionView(options) {
      options || (options = {});
      this.options = options;

      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      var desc    = this.model.get("description"),
          summary = this.model.get("summary");

      this.childDisplayCount = ((summary && summary.length) || (desc && desc.length)) ? 3 : 2;
    },
    filter: function (child, index, collection) {
      if (child.get('key') === 'size' || child.get('key') === 'OTObjectSize') {
        return (this.model.get(child.get('key')) &&
                this.model.get(child.get('key') + "_formatted") !== "");
      } else if (["OTLocation", "OTName", "OTMIMEType", "reserved", "favorite"].indexOf(
              child.get('key')) >= 0) {
        return;
      } else {
        return (this.model.get(child.get('key')) && this.model.get(child.get('key')) !== "");
      }
    },
    onRender: function () {
      var collection = this.collection;
      this.collection.comparator = function (model) {
        return model.get("definitions_order");
      };
      this.collection.sort();
      this.bindUIElements();
    }
  });

  return SearchMetadataCollectionView;
});
csui.define('csui/widgets/search.results/impl/breadcrumbs/search.breadcrumbs.view',[
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette3',
  'csui/utils/base',
  'csui/utils/contexts/factories/next.node',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/utils/commands',
  'csui/utils/commandhelper',
  'csui/controls/breadcrumbs/breadcrumbs.view',
], function (_, $, Backbone, Marionette, base, NextNodeModelFactory,
    TabableRegionBehavior, commands, CommandHelper, CsuiBreadcrumbsView) {

  var SearchResultsBreadCrumbView = CsuiBreadcrumbsView.extend({

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function SearchResultsBreadCrumbView(options) {
      options || (options = {});
      CsuiBreadcrumbsView.prototype.constructor.call(this, options);
      this.listenTo(this, 'childview:click:ancestor', _.bind(this.onClickAncestor, this));
    },

    onClickAncestor: function (modal, node) {
      var context = this.context = this.options.context;
      this._nextNode = this.options.node || context.getModel(NextNodeModelFactory);
      var nodeId = node.get("id");
      var args = { node: node };
      this.trigger('before:defaultAction', args);

      if (!args.cancel) {

        if (this.accLastBreadcrumbElementFocused) {
          var command = commands.get('goToLocation');
          if (!command) {
            throw new Error('Invalid command: goToLocation');
          }

          this._nextNode.set('id', nodeId, { silent: true });

          // make the parent undefined so that the goto location work.
          this._nextNode.parent = undefined;

          var status = {
            nodes: new Backbone.Collection([this._nextNode]),
            context: this.options.context,
            model: this._nextNode,
            originatingView: this
          },
            options = {
              context: this.options.context,
              originatingView: this
            };

          CommandHelper.handleExecutionResults(command.execute(status, options));
        }
        else {
          if (this._nextNode.get('id') === nodeId) {
            // when id is same as nextNode's id, nextNode.set(id) event is not triggered
            this._nextNode.unset('id', { silent: true });
          }

          var viewStateModel = this.context && this.context.viewStateModel;
          var viewState = viewStateModel && viewStateModel.get('state');
          if (viewState) {
            this.context.viewStateModel.set('state', _.omit(viewState, 'filter'), { silent: true });
          }

          this._nextNode.trigger('before:change:id', node, this);
          this._nextNode.set('id', nodeId);
        }
      }

      this.$el.trigger('setCurrentTabFocus');
    }

  });

  return SearchResultsBreadCrumbView;

});

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/impl/search.result',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return " aria-describedby=\"idOfPromotedLabel\" ";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <div class=\"csui-search-results-version csui-search-item-version-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":20,"column":81},"end":{"line":20,"column":88}}}) : helper)))
    + "\">\r\n                  <a href=\"javascript:void(0);\" class=\"csui-search-version-label\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"versionAria") || (depth0 != null ? lookupProperty(depth0,"versionAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"versionAria","hash":{},"loc":{"start":{"line":21,"column":94},"end":{"line":21,"column":109}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"versionText") || (depth0 != null ? lookupProperty(depth0,"versionText") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"versionText","hash":{},"loc":{"start":{"line":21,"column":111},"end":{"line":21,"column":126}}}) : helper)))
    + "\r\n                  </a>\r\n                </div>\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <div class=\"csui-search-item-action-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":29,"column":52},"end":{"line":29,"column":59}}}) : helper)))
    + "-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"version_id") || (depth0 != null ? lookupProperty(depth0,"version_id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"version_id","hash":{},"loc":{"start":{"line":29,"column":60},"end":{"line":29,"column":74}}}) : helper)))
    + " csui-search-item-inline-actions\"></div>\r\n";
},"7":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <div class=\"csui-search-item-action-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":31,"column":52},"end":{"line":31,"column":59}}}) : helper)))
    + " csui-search-item-inline-actions\"></div>\r\n";
},"9":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              <div class=\"csui-search-promoted\" id=\"idOfPromotedLabel\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"promoted_label") || (depth0 != null ? lookupProperty(depth0,"promoted_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"promoted_label","hash":{},"loc":{"start":{"line":40,"column":83},"end":{"line":40,"column":101}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"promoted_label") || (depth0 != null ? lookupProperty(depth0,"promoted_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"promoted_label","hash":{},"loc":{"start":{"line":40,"column":110},"end":{"line":40,"column":128}}}) : helper)))
    + "\">\r\n                <span class=\"csui-search-promoted-label\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"promoted_label") || (depth0 != null ? lookupProperty(depth0,"promoted_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"promoted_label","hash":{},"loc":{"start":{"line":41,"column":57},"end":{"line":41,"column":75}}}) : helper)))
    + "</span>\r\n              </div>\r\n";
},"11":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              <div class=\"csui-search-breadcrumb\">\r\n                <div class=\"csui-search-item-breadcrumb csui-search-item-breadcrumb-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":46,"column":84},"end":{"line":46,"column":91}}}) : helper)))
    + "\"></div>\r\n                <div class=\"csui-search-row-spacer binf-col-lg-12 binf-col-md-12 binf-col-sm-12\r\n                binf-col-xs-12\"></div>\r\n              </div>\r\n";
},"13":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <p class=\"csui-search-item-desc csui-overflow-description binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n            "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"description") || (depth0 != null ? lookupProperty(depth0,"description") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"description","hash":{},"loc":{"start":{"line":54,"column":12},"end":{"line":54,"column":27}}}) : helper)))
    + "\r\n          </p>\r\n          <div class=\"csui-search-row-spacer binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12 csui-search-row-spacer-divider\">\r\n          </div>\r\n";
},"15":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "          <p class=\"csui-search-item-summary csui-overflow-summary binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"summary") : depth0),{"name":"each","hash":{},"fn":container.program(16, data, 0),"inverse":container.noop,"loc":{"start":{"line":62,"column":12},"end":{"line":68,"column":21}}})) != null ? stack1 : "")
    + "          </p>\r\n          <div class=\"csui-search-row-spacer binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12 csui-search-row-spacer-divider\">\r\n          </div>\r\n";
},"16":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"type") : depth0),{"name":"if","hash":{},"fn":container.program(17, data, 0),"inverse":container.program(19, data, 0),"loc":{"start":{"line":63,"column":12},"end":{"line":67,"column":19}}})) != null ? stack1 : "");
},"17":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <span class=\"csui-summary-hh\">"
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"text") : depth0), depth0))
    + "</span>\r\n";
},"19":function(container,depth0,helpers,partials,data) {
    return "            <span>"
    + container.escapeExpression(container.lambda(depth0, depth0))
    + "</span>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-search-item-row-wrapper csui-search-item-complete-row binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n  <div class=\"csui-search-item-row binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n    <h3 class=\"csui-search-item-hide-h3\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":3,"column":41},"end":{"line":3,"column":49}}}) : helper)))
    + "</h3>\r\n    <div class=\"csui-search-item-check\"></div>\r\n    <div class=\"csui-search-item-icon\">\r\n      <a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultActionUrl") || (depth0 != null ? lookupProperty(depth0,"defaultActionUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultActionUrl","hash":{},"loc":{"start":{"line":6,"column":15},"end":{"line":6,"column":35}}}) : helper)))
    + "\"\r\n       "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_promoted") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":7,"column":7},"end":{"line":7,"column":72}}})) != null ? stack1 : "")
    + "\r\n                        aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":8,"column":36},"end":{"line":8,"column":44}}}) : helper)))
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mimeTypeAria") || (depth0 != null ? lookupProperty(depth0,"mimeTypeAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mimeTypeAria","hash":{},"loc":{"start":{"line":8,"column":45},"end":{"line":8,"column":61}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"OTName") || (depth0 != null ? lookupProperty(depth0,"OTName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"OTName","hash":{},"loc":{"start":{"line":8,"column":70},"end":{"line":8,"column":80}}}) : helper)))
    + "\"\r\n                  class=\"csui-search-item-link "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"inactiveClass") : stack1), depth0))
    + "\"><span class=\"csui-type-icon\"></span></a>\r\n      </div>\r\n    <div class=\"csui-search-col2 binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n      <div class=\"csui-search-item-left-panel binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n        <div class=\"csui-search-item\">\r\n          <div class=\"csui-search-item-name-wrapper\">\r\n            <div class=\"csui-search-item-name \">\r\n              <a href=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"defaultActionUrl") || (depth0 != null ? lookupProperty(depth0,"defaultActionUrl") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"defaultActionUrl","hash":{},"loc":{"start":{"line":16,"column":23},"end":{"line":16,"column":43}}}) : helper)))
    + "\"  "
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_promoted") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":16,"column":46},"end":{"line":16,"column":111}}})) != null ? stack1 : "")
    + "\r\n                  aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":17,"column":30},"end":{"line":17,"column":38}}}) : helper)))
    + " "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mimeTypeAria") || (depth0 != null ? lookupProperty(depth0,"mimeTypeAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mimeTypeAria","hash":{},"loc":{"start":{"line":17,"column":39},"end":{"line":17,"column":55}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"OTName") || (depth0 != null ? lookupProperty(depth0,"OTName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"OTName","hash":{},"loc":{"start":{"line":17,"column":64},"end":{"line":17,"column":74}}}) : helper)))
    + "\"\r\n                  class=\"csui-search-item-link "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"inactiveClass") : stack1), depth0))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"OTName") || (depth0 != null ? lookupProperty(depth0,"OTName") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"OTName","hash":{},"loc":{"start":{"line":18,"column":75},"end":{"line":18,"column":85}}}) : helper)))
    + "</a>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_version") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":19,"column":14},"end":{"line":24,"column":21}}})) != null ? stack1 : "")
    + "              <div class=\"csui-icon csui-search-results-nodestateicon csui-search-item-nodestateicon\r\n                  csui-search-item-nodestateicon-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":26,"column":49},"end":{"line":26,"column":56}}}) : helper)))
    + "\"></div>\r\n                <div class=\"csui-search-toolbar-container binf-hidden \">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"version_id") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"loc":{"start":{"line":28,"column":14},"end":{"line":32,"column":21}}})) != null ? stack1 : "")
    + "              </div>\r\n            </div>\r\n          </div>\r\n        </div>\r\n        <div class=\"csui-search-item-content-wrapper binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n          <div class=\"csui-search-promoted-breadcrumbs-row\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"has_promoted") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"loc":{"start":{"line":39,"column":12},"end":{"line":43,"column":19}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"showBreadcrumb") : stack1),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"loc":{"start":{"line":44,"column":12},"end":{"line":50,"column":19}}})) != null ? stack1 : "")
    + "          </div>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"description") : depth0),{"name":"if","hash":{},"fn":container.program(13, data, 0),"inverse":container.noop,"loc":{"start":{"line":52,"column":10},"end":{"line":58,"column":17}}})) != null ? stack1 : "")
    + "          \r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"summary") : depth0),{"name":"if","hash":{},"fn":container.program(15, data, 0),"inverse":container.noop,"loc":{"start":{"line":60,"column":10},"end":{"line":72,"column":17}}})) != null ? stack1 : "")
    + "        </div>\r\n      </div>\r\n      <div class=\"csui-search-item-center-panel binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\"></div>\r\n      <div class=\"csui-search-item-right-panel\">\r\n        <div class=\"csui-search-item-control-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":77,"column":45},"end":{"line":77,"column":52}}}) : helper)))
    + " binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n          <div class=\"csui-search-row-spacer binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\"></div>\r\n          <div role=\"list\" class=\"csui-search-item-details-wrapper binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\"></div>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"csui-search-item-action-panel csui-search-item-action-panel-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":83,"column":76},"end":{"line":83,"column":83}}}) : helper)))
    + "\">\r\n      <div class=\"csui-search-item-fav search-fav-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"loc":{"start":{"line":84,"column":50},"end":{"line":84,"column":57}}}) : helper)))
    + "\"></div>\r\n    </div>\r\n  </div>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_search.results_impl_search.result', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/impl/search.empty',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-no-result-message-wrapper\">\r\n    <p class=\"csui-no-result-message\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":2,"column":45},"end":{"line":2,"column":56}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"message","hash":{},"loc":{"start":{"line":2,"column":58},"end":{"line":2,"column":69}}}) : helper)))
    + "</p>\r\n    <div class=\"csui-display-hide\">\r\n        <ul class=\"csui-search-suggestion-list\">\r\n            <li>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchSuggestion1") || (depth0 != null ? lookupProperty(depth0,"searchSuggestion1") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchSuggestion1","hash":{},"loc":{"start":{"line":5,"column":16},"end":{"line":5,"column":37}}}) : helper)))
    + "</li>\r\n            <li>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchSuggestion2") || (depth0 != null ? lookupProperty(depth0,"searchSuggestion2") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchSuggestion2","hash":{},"loc":{"start":{"line":6,"column":16},"end":{"line":6,"column":37}}}) : helper)))
    + "</li>\r\n            <li>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchSuggestion3") || (depth0 != null ? lookupProperty(depth0,"searchSuggestion3") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchSuggestion3","hash":{},"loc":{"start":{"line":7,"column":16},"end":{"line":7,"column":37}}}) : helper)))
    + "</li>\r\n            <li>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"searchSuggestion4") || (depth0 != null ? lookupProperty(depth0,"searchSuggestion4") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"searchSuggestion4","hash":{},"loc":{"start":{"line":8,"column":16},"end":{"line":8,"column":37}}}) : helper)))
    + "</li>\r\n        </ul>\r\n    </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_search.results_impl_search.empty', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/controls/expandall/impl/expandall',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-search-expandall-wrapper\">\r\n  <div class=\"csui-search-expandall-text\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"expandAll") : stack1), depth0))
    + "\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"expandAll") : stack1), depth0))
    + "</div>\r\n  <button class=\"csui-search-header-expand-all\" aria-label=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"expandAll") : stack1), depth0))
    + "\" title=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"expandAll") : stack1), depth0))
    + "\">\r\n    <span class=\"icon csui-icon icon-expandArrowDown\"></span>\r\n  </button>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_search.results_controls_expandall_impl_expandall', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/search.results/controls/expandall/impl/expandall',[],function(){});
csui.define('csui/widgets/search.results/controls/expandall/expandall.view',['csui/lib/jquery', 'csui/lib/marionette',
  'hbs!csui/widgets/search.results/controls/expandall/impl/expandall',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'css!csui/widgets/search.results/controls/expandall/impl/expandall'
], function ($, Marionette, template, lang) {

  var expandAllView = Marionette.ItemView.extend({

    template: template,
    templateHelpers: function () {
      var messages = {
        expandAll: lang.expandAll
      };
      return {
        messages: messages
      };
    },

    events: {
      'click @ui.expandAllSelector': 'expandAll'
    },

    ui: {
      expandAllSelector: '.csui-search-header-expand-all',
      expandIcon: '.icon',
      expandAllLabelText: '.csui-search-expandall-text'
    },

    expandAll: function (event) {
      if (this.collection.length > 0) {
        var that = this;
        if (this._isExpanded) {
          this._isExpanded = false;

          this.ui.expandAllLabelText.html(lang.expandAll);
          this.ui.expandAllLabelText.attr('title', lang.expandAll);
          $(".csui-expand-all").addClass("csui-collapse-all");
          this.ui.expandIcon.removeClass('icon-expandArrowUp');
          this.ui.expandIcon.addClass('icon-expandArrowDown');
          this.ui.expandIcon.attr('title', lang.expandAll);
          this.ui.expandAllSelector.attr('title', lang.expandAll).attr('aria-label', lang.expandAll);
          this.options.view.$el.find("." + this.options._eleCollapse).trigger('click');
        } else {
          this._isExpanded = true;

          this.ui.expandAllLabelText.html(lang.collapseAll);
          this.ui.expandAllLabelText.attr('title', lang.collapseAll);
          $(".csui-expand-all").removeClass("csui-collapse-all");
          this.ui.expandIcon.removeClass('icon-expandArrowDown');
          this.ui.expandIcon.addClass('icon-expandArrowUp');
          this.ui.expandIcon.attr('title', lang.collapseAll);
          this.ui.expandAllSelector.attr('title', lang.collapseAll).attr('aria-label', lang.collapseAll);
          this.options.view.$el.find("." + this.options._eleExpand).trigger('click');
        }

          if (this.options.view.options.layoutView) {
            this.options.view.options.layoutView.updateScrollbar();
          }
        event.preventDefault();
        event.stopPropagation();
      }
    },

    pageChange: function () {
      if (this.ui.expandIcon instanceof Object &&
          this.ui.expandIcon[0].classList.contains(this.options._eleCollapse)) {
        this.ui.expandIcon.removeClass(this.options._eleCollapse).addClass(
            this.options._eleExpand).attr('title', lang.expandAll);
            this.ui.expandAllLabelText.html(lang.expandAll);
            this.ui.expandAllLabelText.attr('title', lang.expandAll);
            this.ui.expandAllSelector.attr('title', lang.expandAll).attr('aria-label', lang.expandAll);
      }
    }

  });

  return expandAllView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/impl/standard/standard.search.results.header',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div\r\n    class=\"csui-search-header-left-actions binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n  <div class=\"binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n    <div id=\"selectAllCheckBox\" class=\"csui-select-all csui-search-item-check\"></div>\r\n    <div id=\"SelectedItemsCounter\" class=\"csui-selected-items-counter-view\"></div>\r\n    <div id=\"toolbar\"\r\n         class=\"csui-search-toolbar binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\"></div>\r\n  </div>\r\n</div>\r\n<div class=\"csui-search-header-right-actions\">\r\n  <div class=\"binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n    <div class=\"csui-search-header-actions\">\r\n      <div class=\"csui-search-sorting\" id=\"csui-search-sort\"></div>\r\n      <div class=\"csui-expand-all\" id=\"expandAllArrow\"></div>\r\n    </div>\r\n  </div>\r\n</div> \r\n";
}});
Handlebars.registerPartial('csui_widgets_search.results_impl_standard_standard.search.results.header', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.results/impl/standard/standard.search.results.header.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/widgets/search.results/controls/expandall/expandall.view',
  'csui/controls/checkbox/checkbox.view',
  'csui/widgets/search.results/controls/sorting/sort.menu.view',
  'csui/controls/selected.count/selected.count.view',
  'csui/models/node/node.model',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'hbs!csui/widgets/search.results/impl/standard/standard.search.results.header',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'css!csui/widgets/search.results/impl/search.results'
], function (_, $, Backbone, Marionette, TableToolbarView, ExpandAllView, CheckboxView, SortingView,
    SelectedCountView, NodeModel, lang, template, ViewEventsPropagationMixin) {
  'use strict';
  var StandardSearchResultsHeaderView = Marionette.LayoutView.extend({
    template: template,
    regions: {
      expandAllRegion: '#expandAllArrow',
      sortRegion: '#csui-search-sort',
      selectAllRegion: '#selectAllCheckBox',
      toolbarRegion: '#toolbar',
      selectedCounterRegion: '#SelectedItemsCounter'
    },
    constructor: function StandardSearchResultsHeaderView(options) {
      options || (options = {});
      this.collection = options.collection;
      this.resultsView = options.view;
      this.options = options.options;
      this.localStorage = options.localStorage;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenTo(this.collection, 'remove', this._updateToolItems)
          .listenTo(this.collection, 'sync', this._updateToolItems);
      this.setSelectAllView();
      this.setSortingView();
      this.setExpandAllView();
      this._setToolBar();
      this._setSelectionCounterView();
      this.listenTo(this.collection, "sync", this._removeAllSelections);
      this.listenTo(this.collection, 'reset', function () {
         this.expandAllView.pageChange();
      });
      this.listenTo(this, 'dom:refresh', this._refreshEle);
      this.listenTo(this.options.originatingView, 'query:changed', function () {
        if (this.expandAllView) {
          this.expandAllView._isExpanded = false;
        }
      });
      this._commandController = this.options.originatingView.commandController;
      this.listenTo(this._commandController, 'before:execute:command', function (eventArgs) {
        this.toolbarView.otherToolbarView.trigger('before:execute:command', eventArgs);
      });
      this.listenTo(this._commandController, 'after:execute:command', function (eventArgs) {
        this.toolbarView.otherToolbarView.trigger('after:execute:command', eventArgs);
      });
    },

    _refreshEle: function() {
      if(this.toolbarView){
        this.toolbarView.trigger('dom:refresh');
      }
      if (this._selectAllView) {
        this._selectAllView.triggerMethod('dom:refresh');
      }
      if (this.expandAllView) {
        this.expandAllView.triggerMethod('dom:refresh');
      }
    },

    onRender: function () {
        this.sortRegion.show(this.sortingView);
        this.expandAllRegion.show(this.expandAllView);
        this.selectedCounterRegion.show(this.selectedCounterView);
        this.selectAllRegion.show(this._selectAllView);
        this.toolbarRegion.show(this.toolbarView);
        this._updateToolItems();
    },

    // Toolbar view
    _setToolBar: function () {
      var self       = this,
          parentNode = new NodeModel({id: undefined},
              {connector: this.collection.connector});
      this.collection.node = parentNode;

      // toolbarItems is an object with several TooItemFactories in it (for each toolbar one)
      this.toolbarView = new TableToolbarView({
        toolbarItems: this.options.toolbarItems,
        toolbarItemsMasks: this.options.toolbarItemsMasks,
        collection: this.collection,
        originatingView: this.options.originatingView,
        container: this.container,
        context: this.options.context,
        toolbarCommandController: this.options.originatingView.commandController,
        events: function () {
          return _.extend({}, TableToolbarView.prototype.events, {
            'keydown': self.onKeyInViewInToolbarView
          });
        }
      });
      this.listenTo(this.toolbarView, 'refresh:tabindexes', function () {
        // unlike in nodes table view, for header toolbar in search results has to navigate through
        // tab key instead-of direction keys
        this.toolbarView.$el.find('.csui-otherToolbar>ul>li>a:visible').attr('tabindex', 0);
        if(this.collection.selectedItems.length >= this.collection.length && this.collection.where({csuiIsSelected:true}).length) {
        this._selectAllView.ui.cb.trigger('focus');
        }
      });
    },

    _updateToolItems: function () {
      if (this.toolbarView) {
        var nodes = this.collection.selectedItems.models;
        if (nodes && nodes.length === 1) {
          this.toolbarView.options.collection.node = nodes[0].parent;
        } else {
          this.toolbarView.options.collection.node = new NodeModel({id: undefined},
              {connector: this.collection.connector});
        }
        this.toolbarView.updateForSelectedChildren(nodes);
      }
      //TODO: check for the purpose of the below code
        // if (this.collection.length === 0) {
        //   this.el.classList.add('binf-hidden');
        // } else {
        //   this.el.classList.remove('binf-hidden');
        // }
      //TODO: End
    },

    onKeyInViewInToolbarView: function (event) {
      switch (event.keyCode) {
      case 37:
      case 39:
        // right arrow
        event.preventDefault();
        event.stopPropagation();
        break;
      }
    },

    // Select counter view
    _setSelectionCounterView: function () {
      //this.collection.selectedItems = new Backbone.Collection();
      this.selectedCounterView = new SelectedCountView({
        collection: this.collection.selectedItems,
        scrollableParent: '.csui-result-list'
      });
      this.listenTo(this.collection.selectedItems, 'remove reset add', this._updateToolItems);
      this.listenTo(this.selectedCounterView.collection, 'remove', this._updateRowsState);
      this.listenTo(this.selectedCounterView.collection, 'reset', _.bind(function () {
        if (this.collection.prevSearchDisplayStyle === "StandardView") {
          this.resultsView._rowStates.set(StandardSearchResultsHeaderView.RowStatesSelectedRows,
              []);
        }
      }, this));
    },

    _updateRowsState: function (models) {
      var updateModels = [];
      if (!(models instanceof Array)) {
        updateModels.push(models);
      } else {
        updateModels = models;
      }
      if (this.collection.prevSearchDisplayStyle === 'StandardView') {
        _.each(updateModels, function (model) {
          var newSelectedModelIds = this.resultsView._rowStates.get(
              StandardSearchResultsHeaderView.RowStatesSelectedRows);
          newSelectedModelIds = _.without(newSelectedModelIds, model.get('id'));
          this.collection.selectedItems.remove(model);
          this.resultsView._rowStates.set(StandardSearchResultsHeaderView.RowStatesSelectedRows,
              newSelectedModelIds);
        }, this);

      }
    },

    // Select view
    setSelectAllView: function () {
      this._selectAllView = new CheckboxView({
        checked: this._calculateSelectAllCheckedStatus(),
        disabled: this.collection.length === 0,
        ariaLabel: lang.selectAllAria,
        title: lang.selectAll
      });

      this.listenTo(this._selectAllView, 'clicked', function (e) {
        e.cancel = true;  // don't update checkbox immediately

        var checked = this._selectAllView.model.get('checked'); // state before clicking cb

        switch (checked) {
        case 'true':
          // all rows are selected -> deselect all
          var updateModels = [],
              modelId      = this.resultsView._rowStates.get(
                  StandardSearchResultsHeaderView.RowStatesSelectedRows);
          modelId.forEach(function (modelID) {
            var model = this.collection.selectedItems.findWhere({id: modelID});
            this.collection.selectedItems.remove(model);
          }, this);
          this.resultsView._rowStates.set(StandardSearchResultsHeaderView.RowStatesSelectedRows,
              []);
          break;
        default:
          // no or some rows are selected -> select all, except those that are not selectable
          var selectedModelIds = [];
          var newlySelected = this.collection.filter(function (model) {
            if (model.get('selectable') !== false) {
              selectedModelIds.push(model.get('id'));
              if (!this.collection.selectedItems.findWhere({id: model.get('id')})) {
                return true;
              }
            }
            return false;
          }, this);
          this.collection.selectedItems.add(newlySelected);
          this.resultsView._rowStates.set(StandardSearchResultsHeaderView.RowStatesSelectedRows,
              selectedModelIds);
        }
        this._selectAllView.ui.cb.trigger('focus');
      });

      this.listenTo(this.resultsView._rowStates,
          'change:' + StandardSearchResultsHeaderView.RowStatesSelectedRows,
          function () {
            this._updateSelectAllCheckbox();
          });

      this.listenTo(this.collection, 'reset', function () {
        this._updateSelectAllCheckbox();
      });
    },

    _updateSelectAllCheckbox: function () {
      if (this._selectAllView) {
        this._selectAllView.setChecked(this._calculateSelectAllCheckedStatus());
        this._selectAllView.setDisabled(this.collection.length === 0);
      }
    },

    _removeAllSelections: function () {
      var selectedItemCollection = [];
      this.collection.each(_.bind(function (model) {
        if (!!this.collection.selectedItems.findWhere({id: model.get('id')})) {
          selectedItemCollection.push(model.get('id'));
        }
      }, this));
      // resetting the rowstates only selectedItems present to updated checkboxes properly
      selectedItemCollection.length &&
      this.resultsView._rowStates.set({'selected': []}, {'silent': true});
      this.resultsView._rowStates.set(StandardSearchResultsHeaderView.RowStatesSelectedRows,
          selectedItemCollection);
      // if (this.selectedItems.length > 0 && this.headerView.collection.showTabularSearchView) {
      //   this.selectedItems.reset(this.tableView._allSelectedNodes.models);
      // }
    },

    _calculateSelectAllCheckedStatus: function () {
      var selected = this.resultsView._rowStates.get(
          StandardSearchResultsHeaderView.RowStatesSelectedRows);
          if (selected && selected.length) {
                  var all  = selected.length === this.collection.length;
            if (selected.length > 0 && !all) {
              return 'mixed';
            } else {
              return selected.length > 0;
            }
          }
    },

    // Sorting view
    setSortingView: function () {
      this.sortingView = new SortingView({
        collection: this.collection,
        enableSorting: this.options.enableSorting !== undefined ? this.options.enableSorting : true
      });
      return true;
    },

    // Expand all view
    setExpandAllView: function () {
      this.expandAllView = new ExpandAllView({
        collection: this.collection,
        view: this.resultsView,
        _eleCollapse: "icon-expandArrowUp",
        _eleExpand: "icon-expandArrowDown"
      });
      return this.expandAllView;
    },
  }, {
    RowStatesSelectedRows: 'selected'
  });

  _.extend(StandardSearchResultsHeaderView.prototype, ViewEventsPropagationMixin);
  return StandardSearchResultsHeaderView;
});
csui.define('csui/widgets/search.results/impl/standard/standard.search.results.view',[
  'module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/progressblocker/blocker',
  'csui/controls/table/cells/favorite/favorite.view',
  'csui/controls/checkbox/checkbox.view',
  'csui/controls/node.state/node.states.view',
  'csui/controls/node.state/node.state.icons',
  'csui/widgets/search.results/impl/metadata/search.metadata.view',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'csui/controls/tableactionbar/tableactionbar.view',
  'i18n', 'csui/models/node/node.model',
  'csui/utils/nodesprites', 'csui/controls/node-type.icon/node-type.icon.view',
  'csui/widgets/search.results/impl/breadcrumbs/search.breadcrumbs.view',
  'csui/models/nodeancestors',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/utils/contexts/factories/search.metadata.factory',
  'hbs!csui/widgets/search.results/impl/search.result',
  'hbs!csui/widgets/search.results/impl/search.empty',
  'csui/utils/node.links/node.links',
  'csui/utils/accessibility',
  'csui/utils/log',
  'csui/widgets/search.results/impl/standard/standard.search.results.header.view',
  'csui/lib/handlebars.helpers.xif',
  'css!csui/widgets/search.results/impl/search.results',
  'csui/lib/jquery.mousehover',
  'csui/lib/jquery.redraw'
], function (module, _, $, Backbone, Marionette, base, BlockingView, FavoritesView, CheckboxView,
    NodeStateCollectionView, nodeStateIcons, SearchMetadataView, lang, TableActionBarView, i18n,
    NodeModel, NodeSpriteCollection, NodeTypeIconView, BreadcrumbsView, NodeAncestorCollection,
    DefaultActionBehavior, SearchMetadataFactory, itemTemplate, emptyTemplate, nodeLinks,
    Accessibility, log, StandardSearchResultsHeaderView) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();

  var config = _.extend({
    enableFacetFilter: true, // LPAD-60082: Enable/disable facets
    enableBreadcrumb: true,
    enableSearchSettings: true, // global enable/disable search settings, but LPAD 81034 ctor can overrule
    showInlineActionBarOnHover: !accessibleTable,
    forceInlineActionBarOnClick: false,
    inlineActionBarStyle: "csui-table-actionbar-bubble"
  }, module.config());
  var SearchStaticUtils = {
    isAppleMobile: base.isAppleMobile(),
    mimeTypes: {},
    isRtl: i18n && i18n.settings.rtl
  };

  var NoSearchResultView = Marionette.ItemView.extend({

    className: 'csui-empty',
    template: emptyTemplate,

    constructor: function NoSearchResultView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this.model, 'change', this.render);
    }

  });
  var SearchResultItemView = Marionette.LayoutView.extend({

    className: function () {
      var classList = 'binf-list-group-item binf-col-lg-12 binf-col-md-12 binf-col-sm-12' +
                      ' binf-col-xs-12 ';
      classList += this.hasVersion() ? 'csui-search-result-version-item' : '';
      classList += this.hasPromoted() ? ' csui-search-promoted-item' : '';
      return classList;
    },
    template: itemTemplate,

    regions: {
      favRegion: ".csui-search-item-fav",
      selectionRegion: ".csui-search-item-check",
      searchMetadataRegion: ".csui-search-item-details-wrapper",
      breadcrumbRegion: ".csui-search-item-breadcrumb",
      nodeStateRegion: ".csui-search-item-nodestateicon"
    },

    ui: {
      descriptionField: '.csui-overflow-description',
      summaryField: '.csui-overflow-summary',
      modifiedByField: '.csui-search-modified-by',
      metadataDetails: '.csui-search-item-details',
      inlineToolbarContainer: '.csui-search-toolbar-container',
      inlineToolbar: '.csui-search-item-row',
      arrowIcon: '.search-results-item-expand .icon'
    },

    events: {
      'click .csui-search-item-link': 'openSearchItem',
      'click .csui-search-version-label': 'openVersionHistory',
      'click .icon-expandArrowUp': 'showMetadataInfo',
      'click .icon-expandArrowDown': 'hideMetadataInfo'
    },

    templateHelpers: function () {
      var defaultActionController = this.options.defaultActionController,
        checkModelHasAction = defaultActionController.hasAction.bind(defaultActionController),
        inActiveClass = checkModelHasAction(this.model) ? '' :
          'csui-search-no-default-action',
        messages = {
          created: lang.created,
          createdby: lang.createdBy,
          modified: lang.modified,
          owner: lang.owner,
          type: lang.type,
          items: lang.items,
          showMore: lang.showMore, // where does this show up
          showLess: lang.showLess,
          versionSeparator: lang.versionSeparator,
          inactiveClass: inActiveClass,
          showBreadcrumb: config.enableBreadcrumb && this.model.collection.isLocationColumnAvailable
        },
        defaultActionUrl = this.defaultActionUrl,
        promotedText = this.promotedText,
        selectedSettings = this.model.collection.selectedSettings,
        description = this.model.get("description"),
        summary = this.model.get("summary");
      if (selectedSettings) {
        switch (selectedSettings) {
          case 'SD':
            break;
          case 'SO': {
            description = undefined;
            break;
          }
          case 'SP': {
            summary && (description = undefined);
            break;
          }
          case 'DP': {
            description && (summary = undefined);
            break;
          }
          case 'DO': {
            summary = undefined;
            break;
          }
          case 'NONE':
          default: {
            description = summary = undefined;
          }
        }
      }
      var versionName = this.hasVersion() ? this.model.get('versions').version_number_name : '';
      var retValue = {
        showOwner: this.model.attributes.hasOwnProperty('owner_user_id'), // LPAD-61022: hide owner, if not set in response
        messages: messages,
        defaultActionUrl: defaultActionUrl,
        has_promoted: this.hasPromoted(),
        promoted_label: lang.promotedLabel,
        promoted_text: promotedText.replace(/,/g, ', '),
        has_version: this.hasVersion(),
        versionText: _.str.sformat(lang.versionText, versionName),
        versionAria: _.str.sformat(lang.versionAria, versionName),
        cid: this.cid,
        itemBreadcrumb: this.itemBreadcrumb,
        mimeTypeAria: this.mimeTypeAria,
        summary: summary,
        description: description
      };
      return retValue;
    },

    openSearchItem: function (event) {
      if (base.isControlClick(event)) {
        // do nothing, let's execute browser's default behaviour as it is in both ctrl+click and
        // command+click in mac.
      } else {
        event.preventDefault();
        this.trigger("click:item", this.model);
      }
    },

    constructor: function SearchResultItemView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.collection = options.collection;
      this.model.attributes.mime_type = !!this.model.attributes.mime_type ?
                                        this.model.attributes.mime_type :
                                        (this.model.attributes.versions ?
                                         this.model.attributes.versions.mime_type : "");
      this._hiddenMetadataElements = $();
      var mimType = this.model.attributes.mime_type;
      this.mimeTypeSearch = SearchStaticUtils.mimeTypes[mimType];

      if (!this.mimeTypeSearch) {
        // TODO: Share the better type name used by NodeTypeIconView
        SearchStaticUtils.mimeTypes[mimType] = NodeSpriteCollection.findTypeByNode(this.model);
      }

      this.mimeTypeSearch = SearchStaticUtils.mimeTypes[mimType];

      _.extend(this.model.attributes, {
        collection_id: this.model.cid,
        mime_type_search: this.mimeTypeSearch
      });

      var ancestors  = this.model.attributes.ancestors,
          ancLen     = ancestors ? ancestors.length : 0,
          parent     = ancLen ? ancestors[ancLen - 1] : undefined,
          parentName = parent && parent.attributes ? parent.attributes.name : undefined;

      this.itemBreadcrumb = _.str.sformat(lang.itemBreadcrumbAria, parentName);

      this.mimeTypeAria = _.str.sformat(lang.mimeTypeAria, this.mimeTypeSearch);

      this.defaultActionUrl = nodeLinks.getUrl(this.model, {connector: this.model.connector});
      this.promotedText = '';
      if (this.hasPromoted()) {
        this.promotedText = !!this.hasBestBet() ? this.model.get('bestbet') :
                            this.model.get('nickname');
        this.promotedText = this.promotedText.toString();
      }

      this._rowStates = options.rowStates;
      this.addOwnerDisplayName();
      this.addCreatedUserDisplayName();
      this.listenTo(this._rowStates, 'change:' + StandardSearchResultsView.RowStatesSelectedRows,
          this._selectionChanged
      );

      this.listenTo(this.model, 'change', function () {
        // Ignore the sole 'change:csuiDelayedActionsRetrieved' event and not re-render every row
        // for all rows in the collection.  This has performance impact and flickering effect.
        // Only the TableActionToolbar should be re-rendered, and it is already done by itself
        // with delayedActions event listening.
        if (_.size(this.model.changed) === 1 &&
            _.has(this.model.changed, 'csuiDelayedActionsRetrieved')) {
          return;
        }
        if (this.model.changed.name) {
          this.model.set({OTName: this.model.changed['name']});
        }
        this.render();
        this.updateItemdetails();
      });
      // to handle rename scenario for selected items, which are not part of existing collection.
      if (this.model.get('name') !== this.model.get('OTName')) {
        this.model.set({OTName: this.model.get('name')});
        this.render();
        this.updateItemdetails();
      }
      this.listenTo(this.options.parentView, 'render:metadata',
          _.bind(function (metadataModels) {
            this.searchMetadataView = new SearchMetadataView({
              rowId: this.cid,
              collection: this.options.parentView.metadata,
              model: this.model,
              originatingView: this.options.originatingView
            });

            var tableColumns = this.searchMetadataView.options.collection.models;
            if (tableColumns && tableColumns.length === 1 && tableColumns[0].get("key") === null) {
              this.searchMetadataView.options.collection.add(metadataModels, {'silent': true});
            }

            this.searchMetadataRegion.show(this.searchMetadataView);
          }, this));

      if (this._canShowInlineActionBar()) {
        this.$el.on('mouseenter.' + this.cid, '.csui-search-item-row',
            _.bind(this._hoverStart, this));
        this.$el.on('mouseleave.' + this.cid, '.csui-search-item-row',
            _.bind(this._hoverEnd, this));
      }
    },

    _canShowInlineActionBar: function() {
      return SearchStaticUtils.isAppleMobile === false && config.showInlineActionBarOnHover;
    },

    _hoverStart: function () {
      this.showInlineActions();
    },

    _hoverEnd: function () {
      this.hideInlineActions();
    },

    _selectionChanged: function (rowStatesModel) {
      var previous = rowStatesModel.previous(StandardSearchResultsView.RowStatesSelectedRows);
      var changed = rowStatesModel.changed[StandardSearchResultsView.RowStatesSelectedRows];

      var deselected = _.difference(previous, changed);
      var selected = _.difference(changed, previous);

      var id = this.model.get('id');

      if (_.contains(deselected, id)) {
        this.model.set('csuiIsSelected', false);
        this._checkboxView.setChecked(false);
        this.ui.inlineToolbar.removeClass('selected');
      }
      if (_.contains(selected, id)) {
        this.model.set('csuiIsSelected', true);
        this._checkboxView.setChecked(true);
        this.ui.inlineToolbar.addClass('selected');

        this.hideInlineActions(); // hide if a item was selected by checkbox
      }
    },

    initActionViews: function (options) {
      this.favView = new FavoritesView({
        tagName: 'div',
        focusable: true,
        model: options.model,
        context: options.context,
        tableView: options.originatingView
      });

      var selectedModelIds = this._rowStates.get(StandardSearchResultsView.RowStatesSelectedRows);
      var checked = _.contains(selectedModelIds, this.model.get('id'));
      var checkboxTitle = _.str.sformat(lang.selectItem, options.model.get('name'));
      var checkboxAriaLabel = _.str.sformat(lang.selectItemAria, options.model.get('name'));

      var selectable = options.model.get('selectable') !== false;
      this._checkboxView = new CheckboxView({
        checked: checked ? 'true' : 'false',
        disabled: !selectable,
        ariaLabel: checkboxAriaLabel,
        title: checkboxTitle
      });

      this.listenTo(this._checkboxView.model, 'change:checked', function (event) {
        this._markAsSelected(event.changed.checked === 'true');
      });

      //options.models = SearchMetadataItems;
      options.connector = options.model.connector;
      if (!!config.enableBreadcrumb && this.model.collection.isLocationColumnAvailable) {
        this.addBreadcrumbs(options);           
      }
    },

    _getEnabledNodeStateIcons: function () {
      var nodeStateIconsPrototype, enabledNodeStateIcons;
      nodeStateIconsPrototype = Object.getPrototypeOf(nodeStateIcons);
      enabledNodeStateIcons = new nodeStateIconsPrototype.constructor(
          nodeStateIcons.filter(function (iconModel) {
            var IconView = iconModel.get('iconView');
            try {
              return IconView && (!IconView.enabled || IconView.enabled({
                    context: this.options.context,
                    node: this.model
                  }));
            } catch (error) {
              log.warn('Evaluating an icon view failed.\n{0}',
                  error.message) && console.warn(log.last);
            }
          }, this));
      return enabledNodeStateIcons;
    },

    _markAsSelected: function (select) {
      var newSelectedModelIds;
      var modelId = this.model.get('id');
      var selectedModelIds = this._rowStates.get(StandardSearchResultsView.RowStatesSelectedRows);
      if (select) {
        if (!_.contains(selectedModelIds, modelId)) {
          this.collection.selectedItems.add(this.model);
          newSelectedModelIds = selectedModelIds.concat([modelId]);
          this._rowStates.set(StandardSearchResultsView.RowStatesSelectedRows, newSelectedModelIds);
        }
      } else {
        if (_.contains(selectedModelIds, modelId)) {
          var modelRemoved = this.collection.selectedItems.findWhere({id: this.model.get('id')});
          this.collection.selectedItems.remove(modelRemoved);
          newSelectedModelIds = _.without(selectedModelIds, modelId);
          this._rowStates.set(StandardSearchResultsView.RowStatesSelectedRows, newSelectedModelIds);
        }
      }

    },

    addBreadcrumbs: function (options) {
      var ancestors = new NodeAncestorCollection(
          options.model.attributes.ancestors, {
            node: options.model, autofetch: false
          }),
          isPromoted = this.hasPromoted();
      if (!isPromoted || (isPromoted && this.model.get("ancestors"))) {
        this.breadcrumbsView = new BreadcrumbsView({
          context: options.context,
          collection: ancestors,
          originatingView: options.originatingView
          // TODO: Use {fetchOnCollectionUpdate: false} to prevent
          // the control from an extra fetching of the collection.
        });
        this.breadcrumbsView.trigger("sync:collection", true);
      } else {
        // for volumes donot include breadcrumbs for best_bets/nick_names results.
        if (options.model.parent.get('id') > 0) {
          this.getAncestors(options).fetch().done(_.bind(function (response) {
            if(!!this.breadcrumbsView.completeCollection) {
              this.breadcrumbsView.completeCollection.length &&
              this.breadcrumbsView.completeCollection.last().set({'showAsLink': true},
                  {'silent': true});
              this.model.attributes.ancestors = this.breadcrumbsView.completeCollection.models;
            } else {
              this.breadcrumbsView.collection.length &&
              this.breadcrumbsView.collection.last().set({'showAsLink': true}, {'silent': true});
              this.model.attributes.ancestors = this.breadcrumbsView.collection.models;
            }
            this.breadcrumbsView.trigger("sync:collection", true);
            if (this.model.collection && this.model.collection.fetched) {
              this.model.trigger("change:ancestors", this.model);
              this.breadcrumbsView.trigger("before:synchronized");
            }
          }, this));
        } else {
          this.breadcrumbsView = undefined;
        }
      }
      return true;
    },

    getAncestors: function (opts) {
      var node            = opts.model,
          ancestorOptions = {node: node.parent, autofetch: false},
          newAncestors    = new NodeAncestorCollection(undefined, ancestorOptions);
      this.breadcrumbsView = new BreadcrumbsView({
        context: opts.context,
        collection: newAncestors,
        startSubCrumbs: 0,
        hasPromoted: this.hasPromoted(),
        isRtl: SearchStaticUtils.isRtl
      });
      return newAncestors;
    },

    onRender: function (e) {
      this.initActionViews(this.options);
      var enabledStateIcons = this._getEnabledNodeStateIcons();
      if (enabledStateIcons.length) {
        this.nodeStateView = new NodeStateCollectionView({
          context: this.options.context,
          node: this.options.model,
          tableView: this.options.originatingView,
          targetView: this.options.originatingView,
          collection: enabledStateIcons
        });
        this.nodeStateRegion.show(this.nodeStateView);
      }

      var meta = this.model.get("search_result_metadata");
      if (!!meta && (meta.current_version !== false && meta.version_type !== "minor") &&
          this.model.get('favorite') !== undefined) { // LPAD-61021) {
        this.favRegion.show(this.favView);
      }
      if (!!config.enableBreadcrumb && !!this.breadcrumbsView) {
        this.breadcrumbRegion.show(this.breadcrumbsView);
        this.$el.find('ol.binf-breadcrumb').attr('aria-label', this.itemBreadcrumb);

        var nodesCount = this.$el.find('ol.binf-breadcrumb > li').length;
        if (nodesCount === 1) {
          this.$el.find('.tail').addClass("one-node");
        } else if (nodesCount === 2) {
          this.$el.find('.tail').addClass("two-nodes");
        }
      }
      this.selectionRegion.show(this._checkboxView);
      if (this.model.collection && this._checkboxView.options.checked === "true") {
        this.$el.find('.csui-search-item-row').addClass('selected');
      }
      this.options.parentView && this.options.parentView.trigger('render:metadata');
      this._nodeIconView = new NodeTypeIconView({
        el: this.$('.csui-type-icon').get(0),
        node: this.model
      });
      this._nodeIconView.render();

      this.listenTo(this, 'adjust:breadcrumb', function () {
        this.breadcrumbsView && this.breadcrumbsView.trigger("readjust:breadcrumbs");
      });
    },

    hasVersion: function () {
      var hasVer = this.model.get('versions');
      if (hasVer) {
        var srMetadata = this.model.get("search_result_metadata");
        hasVer = srMetadata &&
                 (srMetadata.current_version === false || srMetadata.version_type === 'minor');
      }
      return hasVer;
    },

    hasBestBet: function () {
      var bestBets = this.model.get('bestbet');
      return !!bestBets && !!bestBets.length;
    },

    hasNickName: function () {
      var nickName = this.model.get('nickname');
      return !!nickName && !!nickName.length;
    },

    hasPromoted: function () {
      return !!this.hasBestBet() || !!this.hasNickName();
    },

    onBeforeDestroy: function () {
      if (this._nodeIconView) {
        this._nodeIconView.destroy();
      }
      if (this.$el && this._canShowInlineActionBar()) {
        this.$el.off('mouseenter.' + this.cid, '.csui-search-item-row', this._hoverStart);
        this.$el.off('mouseleave.' + this.cid, '.csui-search-item-row', this._hoverEnd);
      }
    },

    onShow: function (e) {
      this.updateItemdetails(e);
      if (this.nodeStateView) {
        var stateViews = this.nodeStateView.el.getElementsByTagName('li');
        if (stateViews.length === 1) {
          this.$el.addClass('csui-search-result-nodestate-item');
        } else if (stateViews.length === 2) {
          this.$el.addClass('csui-search-result-nodestate-item2');
        } else if (stateViews.length > 2) {
          this.$el.addClass('csui-search-result-nodestate-more');
        }
      }
    },

    _toggleExpand: function (buttonEl) {
      this.bindUIElements();
      if (this._isExpanded) {
        this._isExpanded = false;
        $('.truncated-' + this.cid).hide();
        buttonEl.attr('title', lang.showMore)
                .attr('aria-expanded', 'false')
                .attr('aria-label', lang.showMoreAria);
        this.ui.arrowIcon.removeClass('icon-expandArrowUp');
        this.ui.arrowIcon.addClass('icon-expandArrowDown');
        this.ui.descriptionField.removeClass("csui-search-item-desc-height");
        this.ui.descriptionField.addClass("csui-overflow");
        this.ui.summaryField.removeClass("csui-search-item-summary-height");
        this.ui.summaryField.addClass("csui-overflow");
      } else {
        this._isExpanded = true;
        $('.truncated-' + this.cid).show();
        buttonEl.attr('title', lang.showLess)
                .attr('aria-expanded', 'true')
                .attr('aria-label', lang.showLessAria);
        this.ui.arrowIcon.removeClass('icon-expandArrowDown');
        this.ui.arrowIcon.addClass('icon-expandArrowUp');
        this.ui.descriptionField.addClass("csui-search-item-desc-height");
        this.ui.descriptionField.removeClass("csui-overflow");
        this.ui.summaryField.addClass("csui-search-item-summary-height");
        this.ui.summaryField.removeClass("csui-overflow");
      }
    },

    updateItemdetails: function (e) {
      var self           = this,
          hasDescription = this.hasDescriptionText(this.ui.descriptionField[0]), // for few objects it could be summary.
          hasSummary     = this.hasDescriptionText(this.ui.summaryField[0]);

      if (hasDescription) {
        this.ui.descriptionField.addClass("csui-overflow");
      }

      this.$el.find('.truncated-' + this.cid).addClass('binf-hidden');

      if (hasSummary) {
        this.ui.summaryField.addClass("csui-overflow");
      }

      if (!!config.enableBreadcrumb && this.breadcrumbsView) {
        this.breadcrumbsView.trigger("readjust:breadcrumbs");
      }

      if (this.$el.find('.search-results-item-expand').length === 0) {
        this.$el.find('.csui-search-item-fav.search-fav-' + this.cid)
            .after(
                '<button class="search-results-item-expand" title="' + lang.showMore +
                '" aria-expanded="false" aria-label="' + lang.showMoreAria +
                '"><span class="icon icon-expandArrowDown"></span></button>')
            .next().on('click', function () {
          self._toggleExpand.call(self, $(this));
        });
      }

      if (!hasDescription) {   //when there is no description, hide description field and 'Modified' metadata property
        this.ui.descriptionField.addClass("binf-hidden");
        this.ui.modifiedByField.addClass("binf-hidden");
      }

      if (!hasSummary) {   //when there is no summary, hide summary field
        this.ui.summaryField.addClass("binf-hidden");
      }
    },

    addOwnerDisplayName: function () {
      var ownerDisplayName = "";
      if (!!this.model.attributes.owner_user_id_expand) {
        ownerDisplayName = this.getDisplayName(this.model.attributes.owner_user_id_expand);
      }
      _.extend(this.model.attributes, {
        owner_display_name: ownerDisplayName
      });
    },

    addCreatedUserDisplayName: function () {
      var createUserDisplayName = "";
      if (!!this.model.attributes.create_user_id_expand) {
        createUserDisplayName = this.getDisplayName(this.model.attributes.create_user_id_expand);
      }
      _.extend(this.model.attributes, {
        create_user_display_name: createUserDisplayName
      });
    },

    getDisplayName: function (userInfo) {
      return userInfo.name_formatted || userInfo.name;
    },

    hasDescriptionText: function (el) {
      return (el && el.textContent.trim().length > 0);
    },

    showInlineActions: function () {
      if (this.ui.inlineToolbarContainer.find('.csui-table-actionbar').length === 0) {
        if (this.collection.selectedItems.length > 0) {
          // no inline bar if items are selected by checkbox
          return;
        }

        this.ui.inlineToolbarContainer.removeClass("binf-hidden");

        var versionId   = this.model.attributes.version_id ?
                          "-" + this.model.attributes.version_id :
                          "",
            selectedRow = $(".csui-search-item-action-" + this.cid + versionId)[0];
        var args = {
          sender: this,
          target: selectedRow,
          node: this.model
        };
        this.trigger("enterSearchRow", args);
      }
    },

    hideInlineActions: function () {
      this.ui.inlineToolbarContainer.addClass("binf-hidden");
      this._hiddenMetadataElements.removeClass("binf-hidden");
      this._hiddenMetadataElements = $();
      if (!this._isExpanded) {
        var descLength = this.ui.descriptionField.html() && this.ui.descriptionField.html().trim().length;
        if (descLength <= 0) {
          this.ui.descriptionField.addClass("binf-hidden");
          this.ui.modifiedByField.addClass("binf-hidden");
        }

        var summaryLength = this.ui.summaryField.html() && this.ui.summaryField.html().trim().length;
        if (summaryLength <= 0) {
          this.ui.summaryField.addClass("binf-hidden");
        }
      }

      var versionId   = this.model.attributes.version_id ? "-" + this.model.attributes.version_id :
                        "",
          selectedRow = $(".csui-search-item-action-" + this.cid + versionId)[0];
      var args = {
        sender: this,
        target: selectedRow,
        node: []
      };
      this.trigger("leaveSearchRow", args);
    },

    openVersionHistory: function (event) {
      var self         = this,
          args         = {},
          selectedNode = [];
      var versionId   = this.model.attributes.version_id ? "-" + this.model.attributes.version_id :
                        "",
          selectedRow = $(".csui-search-item-action-" + this.cid + versionId)[0];
      selectedNode = this.model;
      args = {
        sender: self,
        target: selectedRow,
        model: selectedNode
      };
      self.options.originatingView.openVersionHistory(args);
    },

    showMetadataInfo: function (event) {
      this.ui.descriptionField.removeClass("binf-hidden");
      this.ui.modifiedByField.removeClass("binf-hidden");
      this.ui.summaryField.removeClass("binf-hidden");
      event.preventDefault();
      event.stopPropagation();
    },

    hideMetadataInfo: function (event) {
      var descLength = this.ui.descriptionField.html() && this.ui.descriptionField.html().trim().length;
      if (descLength <= 0) {
        this.ui.descriptionField.addClass("binf-hidden");
        this.ui.modifiedByField.addClass("binf-hidden");
      }
      var summaryLength = this.ui.summaryField.html() && this.ui.summaryField.html().trim().length;
      if (summaryLength <= 0) {
        this.ui.summaryField.addClass("binf-hidden");
      }
      event.preventDefault();
      event.stopPropagation();
    }
  });

  var StandardSearchResultsView = Marionette.CollectionView.extend({

    className: 'binf-list-group',

    childView: SearchResultItemView,
    childViewOptions: function () {

      return {
        context: this.options.context,
        defaultActionController: this.defaultActionController,
        metadata: this.metadata,
        rowStates: this._rowStates,
        originatingView: this.options.originatingView,
        headerView: this.options.originatingView.headerView,
        parentView: this,
        isLocationColumnAvailable: this.isLocationColumnAvailable > -1,
        collection: this.collection
      };
    },

    emptyView: NoSearchResultView,
    emptyViewOptions: function () {
      return {
        model: this.emptyModel
      };
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    childEvents: {
      'click:item': 'onClickItem'
    },

    constructor: function SearchResultListView(options) {
      options || (options = {});
      this.options = options;
      this.context = options.context;
      this.collection = options.collection;
      this.localStorage = this.options.localStorage;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.setRowStates();
      this.setInlineActionBarEvents();
      this.metadata = this.options.metadata ||
                      this.context.getCollection(SearchMetadataFactory, this);
      this.setStandardSearchHeaderView();
      this.listenTo(this, 'update:tool:items', this._updateToolItems);

      //TODO: after sync
      this.listenTo(this.collection, 'sync', function () {
        // on page navigation new models are loaded into this.resultsView.collection,
        // so replacing with new models in this.selectedItems to maintain consistency.
        this.collection.selectedItems && this.collection.selectedItems.length &&
        this.collection.each(_.bind(function (model) {
          var index = this.collection.selectedItems.findIndex({id: model.get('id')});
          if (index !== -1 && this.collection.selectedItems.at(index) !== model) {
            this.collection.selectedItems.remove(this.collection.selectedItems.at(index));
            this.collection.selectedItems.add(model, {at: index});
            model.set('csuiIsSelected', true);
            var newSelectedModelIds;
            var modelId = model.get('id');
            var selectedModelIds = this._rowStates.get(StandardSearchResultsView.RowStatesSelectedRows);
            if (!_.contains(selectedModelIds, modelId)) {
              this.collection.selectedItems.add(this.model);
              newSelectedModelIds = selectedModelIds.concat([modelId]);
              this._rowStates.set(StandardSearchResultsView.RowStatesSelectedRows, newSelectedModelIds);
            }
          } else {
            this._updateToolItems();
          }
        }, this));
      });

      this.listenTo(this.collection, "sync", this._focusOnFirstSearchResultElement);
      this.listenTo(this.options.originatingView, 'render:metadata', this.renderMetadataModels);

      this.listenTo(this, 'dom:refresh', function () {
        this.standardHeaderView.triggerMethod('dom:refresh');
      });
      BlockingView.delegate(this, options.originatingView);

      this.collection.originatingView = options.originatingView;
      this.emptyModel = new Backbone.Model({
        message: lang.noSearchResultMessage,
        suggestionKeyword: lang.suggestionKeyword,
        searchSuggestion1: lang.searchSuggestion1,
        searchSuggestion2: lang.searchSuggestion2,
        searchSuggestion3: lang.searchSuggestion3,
        searchSuggestion4: lang.searchSuggestion4
      });
      this.listenTo(this.collection, 'sync', function () {
        var tabElements = this.options.originatingView.facetView &&
                          this.options.originatingView.facetView.$('.csui-facet');
        if (tabElements && tabElements.length) {
          tabElements.prop('tabindex', 0);
        }
      });
      this.listenTo(this.collection, 'error', function () {
        this.emptyModel.set('message', lang.failedSearchResultMessage);
      });
      this.listenTo(this, 'dom:refresh', this._refreshDom);
      this.listenTo(this, 'facet:opened', function () {
        //To adjust the breadcrumb whenever search results width changes.
        var focusedElement= this.collection.originatingView.headerView.currentlyFocusedElementInHeader();
        if ($(window).width() > 1023) {
          this.children.each(function (view) {
            view.trigger('adjust:breadcrumb');
          });
        }
        focusedElement && focusedElement.trigger('focus');
      });
      this.listenTo(this, 'destroy:header:view', function () {
        this.standardHeaderView.destroy();
        this.standardHeaderView = undefined;
      });
    },
    _focusOnFirstSearchResultElement: function () {
      if (this.options.collection && this.options.collection.models && !(this.options.collection.models.some(
        function (node) {
          if (node.isReservedClicked === true || node.isUnreservedClicked === true) {
            return true;
          }
        }))
      ) {
        if (this.options.originatingView && (!this.options.originatingView.collection.settings_changed)) {
          this.$el.find(".binf-list-group-item:first-child .csui-search-item-name > a").trigger('focus');
        } else {
          this.options.originatingView.collection.settings_changed = false;
        }
      }

    },

    renderMetadataModels: function () {

      this.metadata = _.extend({}, this.metadata,
          this.collection.searching && this.collection.searching.sortedColumns);
      var metadataModels = _.filter(this.metadata.models,
          function (item) {
            return !item.get("default");
          });
      this.trigger('render:metadata', metadataModels);
    },

    setRowStates: function () {
      this._rowStates = new Backbone.Model();
      this._rowStates.set(StandardSearchResultsView.RowStatesSelectedRows, []);
    },

    setStandardSearchHeaderView: function () {
      this.standardHeaderView = new StandardSearchResultsHeaderView({
        collection: this.collection,
        view: this,
        options: this.options,
        selectedItems: this.collection.selectedItems
      });
    },
    _updateToolItems: function () {
      this.standardHeaderView && this.standardHeaderView._updateToolItems();
    },
    _showInlineActionBar: function (args) {
      if (!!args) {
        this._savedHoverEnterArgs = null;

        var parentId = args.node.get('parent_id');
        if (parentId instanceof Object) {
          parentId = args.node.get('parent_id').id;
        }
        var parentNode = new NodeModel({id: parentId},
            {connector: args.node.connector});

        this.inlineToolbarView = new TableActionBarView(_.extend({
              context: this.options.context,
              commands: this.defaultActionController.commands,
              delayedActions: this.collection.delayedActions,
              collection: this.options.toolbarItems.inlineToolbar || [],
              toolItemsMask: this.options.toolbarItemsMasks.toolbars.inlineToolbar,
              container: parentNode,
              containerCollection: this.collection,
              model: args.node,
              originatingView: this.options.originatingView,
              notOccupiedSpace: 0,
              status: {
                originatingView: this.options.originatingView,
                connector: args.node.connector
              }
            }, this.options.toolbarItems.inlineToolbar &&
               this.options.toolbarItems.inlineToolbar.options)
        );

        this.listenTo(this.inlineToolbarView, 'after:execute:command',
            this.options.originatingView._toolbarCommandExecuted);
        this.inlineToolbarView.render();
        this.listenTo(this.inlineToolbarView, 'destroy', function () {
          this.inlineToolbarView = undefined;
          if (this._savedHoverEnterArgs) {
            this._showInlineActionBarWithDelay(this._savedHoverEnterArgs);
          }
        }, this);
        $(args.target).append(this.inlineToolbarView.$el);
        this.inlineToolbarView.triggerMethod("show");
      }
    },
    setInlineActionBarEvents: function () {
      this.listenTo(this, 'childview:enterSearchRow',
          this._showInlineActionBarWithDelay);
      this.listenTo(this, 'childview:openVersionHistory',
          this.openVersionHistory);
      this.listenTo(this, 'childview:leaveSearchRow', this._actionBarShouldDestroy);
      this.listenTo(this.collection, "reset", this._destroyInlineActionBar);
    },
    _showInlineActionBarWithDelay: function (_view, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
      }
      var self = this;
      this._showInlineActionbarTimeout = setTimeout(function () {
        self._showInlineActionbarTimeout = undefined;
        // if (!self.targetView.lockedForOtherContols) {
        // don't show the action bar control if the searchresult view is locked because a different
        // control is already open
        self._showInlineActionBar.call(self, args);
        //}
      }, 200);
    },
    _actionBarShouldDestroy: function (_view, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
        this._showInlineActionbarTimeout = undefined;
      }
      if (this.inlineToolbarView) {
        //this.inlineToolbarView.updateForSelectedChildren(args.node);
        this.inlineToolbarView.destroy();
      }
    },
    _destroyInlineActionBar: function () {
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
        this.inlineToolbarView = undefined;
      }
    },

    onClickItem: function (target) {
      this.triggerMethod('execute:defaultAction', target.model);
    },

    onScrollTop: function () {
      $('.binf-list-group').scrollTop(0);
    },

    _refreshDom: function () {
      this.$el.addClass("list-group-height");
      this.onScrollTop();
    }
  }, {
    RowStatesSelectedRows: 'selected'
  });

  return StandardSearchResultsView;
});
csui.define('csui/widgets/search.results/impl/tabular/tabular.search.results.view',[
  'module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base', 'csui/controls/table/table.view',
  'csui/controls/table/rows/description/search.description.view',
  'csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view',
  'csui/controls/tableactionbar/tableactionbar.view',
  'csui/utils/accessibility',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'csui/lib/jquery.mousehover',
  'csui/lib/jquery.redraw',
], function (module, _, $, Backbone, Marionette, base, TableView, DescriptionRowView,
  TableRowSelectionToolbarView, TableActionBarView, Accessibility, lang) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();

  var TabularSearchResultsView = TableView.extend({

    ui: {
      toggleDetails: '.csui-table-cell-_toggledetails.sorting_disabled'
    },

    events: {
      'mouseup @ui.toggleDetails': 'onToggleOrChangePageSize',
      'keypress @ui.toggleDetails': 'onToggleOrChangePageSize',
      'mouseup .binf-table > thead > tr > th:not(.sorting_disabled)': 'onTableSortClick',
      'keypress .binf-table > thead > tr > th:not(.sorting_disabled)': 'onTableSortClick',
      'keydown .binf-table': 'onKeyInView'
    },

    constructor: function TabularSearchResultsView(options) {

      this.collection = options.collection;
      this.options = options;
      this.columns = this.collection.searching && this.collection.searching.sortedColumns;
      if (options.accessibleTable) {
        this.getAdditionalColumns();
      }
      this.collection.columns = (this.columns) ? this.columns : this.tableColumns;

      this.settings = this.options.originatingView.getSettings();
      if (this.settings && this.settings.get('display')) {
        var selectedSummary = this.settings.get('display').summary_description.selected;
        this.showSummaryOnly = (selectedSummary === 'SO') ? true : false;
      }
      this.defaultActionController = this.options.defaultActionController;
      var args = _.extend({
        context: this.options.context,
        connector: this.collection.options.connector,
        collection: this.collection,
        columns: this.options.columns,
        enableSorting: this.options.enableSorting !== undefined ? this.options.enableSorting : true,
        tableColumns: this.options.tableColumns,
        pageSize: this.options.data.pageSize || this.options.pageSize,
        originatingView: this.options.originatingView,
        container: this.options.container,
        orderBy: this.collection.orderBy,
        filterBy: this.options.filterBy,
        actionItems: this.defaultActionController.actionItems,
        descriptionRowView: DescriptionRowView,
        descriptionRowViewOptions: {
          firstColumnIndex: 2,
          lastColumnIndex: 2,
          showDescriptions: false,
          showSummary: true,
          collapsedHeightIsOneLine: true,
          displayInEntireRow: true,
          showSummaryOnly: this.showSummaryOnly,
          descriptionColspan: 7
        },
        commands: this.defaultActionController.commands,
        blockingParentView: this.options.originatingView,
        parentView: this.options.originatingView,
        focusView: 'tableHeader',
        inlineBar: {
          viewClass: TableActionBarView,
          options: _.extend({
            collection: this.options.toolbarItems.inlineToolbar || [],
            toolItemsMask: this.options.toolbarItemsMasks.toolbars.inlineToolbar,
            delayedActions: this.collection.delayedActions,
            container: this.container,
            containerCollection: this.collection
          }, this.options.toolbarItems.inlineToolbar &&
             this.options.toolbarItems.inlineToolbar.options, {
            inlineBarStyle: this.options.config.inlineActionBarStyle,
            forceInlineBarOnClick: this.options.config.forceInlineActionBarOnClick,
            showInlineBarOnHover: this.options.config.showInlineActionBarOnHover
          })
        },
        allSelectedNodes: this.collection.selectedItems,
        customLabels: this.options.customLabels,
        tableAria: lang.searchTableAria
      });

      options = _.extend(options, args);

      TableView.prototype.constructor.call(this, options);
      this.selectedSettings = this.collection.selectedSettings;
      this._showEmptyViewText = !this.collection.length;
      this.listenTo(this.options.originatingView, 'update:table',function () {
         this.options.tableColumns.trigger('update');
      });
      this.listenTo(this.options.originatingView, 'toggle:description', function (showDescription) {
        this.showDetailRowDescriptions(showDescription);
        this.trigger('update:scrollbar');
      });

      this._setTableViewEvents();

      this.listenTo(this, 'set:tablerow:assets', function() {

        // must be after setTableView
        this.columns = this.options.originatingView.columns;
        this.setTableRowSelectionToolbar({
          toolItemFactory: this.options.toolbarItems.otherToolbar || [],
          toolbarItemsMask: this.options.toolbarItemsMasks.toolbars.otherToolbar,
          // condensed header toggle is only available for main NodesTable, not derived tables
          showSelectionCounter: true
        });
        this._setTableRowSelectionToolbarEventListeners();
      });

      
      this.listenTo(this.options.originatingView, "properties:view:destroyed", this.onPropertiesViewDestroyed);
      
      this.listenTo(this.options.originatingView, "permissions:view:destroyed", this.onPropertiesViewDestroyed);

      this.listenTo(this.collection, 'remove', function () {
        if (!this.collection.selectedItems.length && (this.collection.models.length === 0 || 
              this.collection.totalCount < this.collection.topCount)) {
          this.collection.trigger('sync');
        }
      });
    },

    onRender: function () {
      if (this.collection.selectedItems.length) {
        this.collection.selectedItems.trigger('reset');
      }
      var elem = this.$el.find("td.csui-table-cell-name a") && $(this.$el.find("td.csui-table-cell-name a")[0]);      
      if(elem && !this.options.originatingView.headerView.ui.toggleResultsView.hasClass('csui-toggledView')) {
        elem.tabIndex = 0;
        setTimeout(function(){
          elem.trigger('focus');
        }, 0);
      }
    },

    _setTableViewEvents: function () {
      this.listenTo(this, 'tableRowSelected', function (args) {
        this.cancelAnyExistingInlineForm.call(this);
        if (this.collection.selectedItems) {
          var selectedNodes  = args.nodes,
              selectedModels = this.collection.selectedItems.models.slice(0);
          _.each(selectedNodes, function (selectedNode) {
            if (!this.collection.selectedItems.get(selectedNode)) {
              selectedModels.push(selectedNode);
            }
          }, this);
          this.collection.selectedItems.reset(selectedModels);
        }
      });
      if (this.container) {
        this.listenTo(this.container, 'change:id', function () {
          if (this.options.fixedFilterOnChange) {
            this.collection.clearFilter(false);
            this.collection.setFilter(this.options.fixedFilterOnChange, false);
          }
          else if (this.options.clearFilterOnChange) {
            this.collection.clearFilter(false);
          }
          if (this.options.resetOrderOnChange) {
            this.collection.resetOrder(false);
          }
          if (this.options.resetLimitOnChange) {
            this.collection.resetLimit(false);
          }
        });
      }
      this.listenTo(this.collection.selectedItems, 'reset', function () {
        if (this.tableToolbarView) {
          // update table toolbar after row selection changed
          //this.tableToolbarView.filterToolbarView.collection.status.thumbnailViewState = this.tableView.thumbnailView;
          this.options.originatingView.headerView.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
          this._onSelectionUpdateCssClasses(this.collection.selectedItems.length);
        }
        var selectedItems = this.collection.selectedItems;
        this.collection.each(function (node) {
          var selectedItem = selectedItems.get(node.get('id'));
          node.set('csuiIsSelected', selectedItem !== undefined);
        });
      });

      this.listenTo(this, 'tableRowUnselected', function (args) {
        if (this.collection.selectedItems) {
          var unselectedNodes = args.nodes;
          _.each(unselectedNodes, function (unselectedNode) {
            this.collection.selectedItems.remove(unselectedNode, {silent: true});
          }, this);
          this.collection.selectedItems.reset(_.clone(this.collection.selectedItems.models));
        }
      });

      this.listenTo(this, 'execute:defaultAction', function (node) {
        var args = {node: node};
        this.trigger('before:defaultAction', args);
        if (!args.cancel) {
          var self = this;
          this.defaultActionController
              .executeAction(node, {
                context: this.options.context,
                originatingView: this.options.originatingView
              })
              .done(function () {
                self.trigger('executed:defaultAction', args);
              });
        }
      });
      if (this.enableDragNDrop) {
        this.listenTo(this, 'tableRowRendered', function (row) {
          var rowdragNDrop = this.setDragNDrop(row);
          this._assignDragArea(rowdragNDrop, $(row.target));
          this._assignDragArea(rowdragNDrop, row.expandedRows);
        });
      }
      return true;
    },

    setTableRowSelectionToolbar: function (options) {
      this._tableRowSelectionToolbarView = new TableRowSelectionToolbarView({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.options.originatingView.commandController,
        showCondensedHeaderToggle: options.showCondensedHeaderToggle,
        showSelectionCounter: true,
        scrollableParent: '.csui-nodetable tbody',
        // if toolbarCommandController is not defined, a new ToolbarCommandController
        // with the following commands is created
        commands: this.defaultActionController.commands,
        selectedChildren: this.collection.selectedItems,
        container: this.collection.node,
        context: this.context,
        originatingView: this.options.originatingView,
        collection: this.collection
      });
      var toolbarView = this._tableRowSelectionToolbarView;
      this.listenTo(toolbarView, 'toggle:condensed:header', function () {
        // only show/hide the condensed header when in row selection mode
        this.options.originatingView.headerView.$el.find('.csui-search-header').toggleClass('csui-show-header');
        this.showingBothToolbars = this.options.originatingView.headerView &&
        this.options.originatingView.headerView.$el.find('.csui-search-header').hasClass('csui-show-header');
        if (this.showingBothToolbars) {
          this.options.originatingView.headerView.$el.find('.csui-search-header').removeClass(
              'csui-table-rowselection-toolbar-visible').removeClass('binf-hidden');
              this.options.originatingView.headerView.$el.parent('#header').addClass('csui-show-header');
        } else {
          this.options.originatingView.headerView.$el.find('.csui-search-header').addClass(
              'csui-table-rowselection-toolbar-visible').addClass('binf-hidden');
              this.options.originatingView.headerView.$el.parent('#header').removeClass('csui-show-header');
        }
        // let the right toolbar know to update its attributes
        toolbarView.trigger('toolbar:activity', true, this.showingBothToolbars);
      });

      this.listenTo(toolbarView, 'render', function () {
          this.listenTo(toolbarView._selectedCountView.collection,'remove', function (models) {
            var model = this.collection.findWhere({id: models.get('id')});
            if (model) {
              model.set('csuiIsSelected', false);
            } else {
              models.set('csuiIsSelected', false);
            }
            this._onSelectionUpdateCssClasses(this.collection.selectedItems.length);
          });
      });
    },

    _setTableRowSelectionToolbarEventListeners: function () {
      // listen for change of the selected rows in the table.view and if at least one row is
      // selected, display the table-row-selected-toolbar and hide the table-toolbar
      this.listenTo(this.collection.selectedItems, 'reset', function () {
          var headerView = this.options.originatingView && this.options.originatingView.headerView;
          headerView.tableRowSelectionToolbarRegion &&
             headerView.tableRowSelectionToolbarRegion.$el.removeClass('binf-hidden');
          this._tableRowSelectionToolbarView._rightToolbarView.options.showCondensedHeaderToggle = true;
          headerView.tableRowSelectionToolbarRegion &&
          headerView.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
          this._onSelectionUpdateCssClasses(this.collection.selectedItems.length);
      });

    },

    _onSelectionUpdateCssClasses: function (selectionLength, stopTriggerToolbarActivity) {
      var $rowSelectionToolbarEl = this.options.originatingView.headerView.tableRowSelectionToolbarRegion.$el;
      var headerVisible = this.options.originatingView.headerView &&
      this.options.originatingView.headerView.$el.find('.csui-search-header').hasClass('csui-show-header');
      this._tableRowSelectionToolbarVisible = !selectionLength;
      if (accessibleTable) {
        if (selectionLength > 0) {
          if (!this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = true;
            // make tableToolbar invisible
            //  and rowSelectionToolbar visible

            // this lets the tableToolbar disappear
            if (!headerVisible && !this.showingBothToolbars) {
              this.options.originatingView.headerView.$el.find('.csui-search-header').addClass(
                  'csui-table-rowselection-toolbar-visible').addClass('binf-hidden');
            }
            // this lets the rowSelectionToolbar appear
            $rowSelectionToolbarEl.removeClass('binf-hidden').addClass('csui-table-rowselection-toolbar-visible');
          }
          this._tableRowSelectionToolbarView.trigger('toolbar:activity',
              this._tableRowSelectionToolbarVisible, headerVisible);
        } else {
          this.showingBothToolbars = false;
          if (this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = false;
            // make tableToolbar visible
            //  and rowSelectionToolbar invisible

            // without the rowSelectionToolbar, it is not necessary to have height for both toolbars
            this.options.originatingView.headerView.$el.find('.csui-search-header').removeClass('csui-show-header');

            // this lets the tableToolbar appear
            this.options.originatingView.headerView.$el.find('.csui-search-header').removeClass('binf-hidden');
            this.options.originatingView.headerView.$el.find('.csui-search-header').removeClass(
                'csui-table-rowselection-toolbar-visible');

            // this lets the rowSelectionToolbar disappear
            $rowSelectionToolbarEl.removeClass('csui-table-rowselection-toolbar-visible').addClass('binf-hidden');
            this.options.originatingView.headerView.$el.parent('#header').removeClass('csui-show-header');
          }
        }
      } else {
        if (selectionLength > 0) {
          if (!this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = true;
            // make tableToolbar invisible
            //  and rowSelectionToolbar visible

            // this will start the transition on height of rowSelectionToolbar from 0 to full
            // height, which smoothly lets the rowSelectionToolbar appear
            $rowSelectionToolbarEl
                .removeClass('binf-hidden').redraw()
                .addClass('csui-table-rowselection-toolbar-visible');

            // this will start the transition on height of search header to 0, which finally lets
            // the search header disappear
            if (!headerVisible && !this.showingBothToolbars) {
              this.options.originatingView.headerView.$el.find('.csui-search-header').addClass(
                  'csui-table-rowselection-toolbar-visible').addClass('binf-hidden');
            }
          }
          this._tableRowSelectionToolbarView.trigger('toolbar:activity',
              this._tableRowSelectionToolbarVisible, headerVisible);
        } else {
          this.showingBothToolbars = false;
          if (this._tableRowSelectionToolbarVisible) {
            this._tableRowSelectionToolbarVisible = false;
            // make tableToolbar visible
            //  and rowSelectionToolbar invisible

            // without the rowSelectionToolbar, it is not necessary to have height for both toolbars
            this.options.originatingView.headerView.$el.find('.csui-search-header').removeClass('csui-show-header');
            $rowSelectionToolbarEl
                .removeClass('csui-table-rowselection-toolbar-visible').addClass('binf-hidden');

            // this will start the transition on height of tableToolbar from 0 to full
            // height, which smoothly lets the tableToolbar appear
            this.options.originatingView.headerView.$el.find('.csui-search-header').removeClass(
                'csui-table-rowselection-toolbar-visible').removeClass('binf-hidden');
                this.options.originatingView.headerView.$el.parent('#header').removeClass('csui-show-header');
          }
        }
      }
    },

    onTableSortClick: function (event) {
      //Setting the isSortOptionSelected whenever sort is performed from table columns
      //Instead of setting it after collection sync
      if ((event.type === 'keypress' && (event.keyCode === 13 || event.keyCode === 32)) ||
      (event.type === 'mouseup')) {
        this.collection.isSortOptionSelected = false;
      }
    },

    onToggleOrChangePageSize: function (event) {
      if ((event.type === 'keypress' && (event.keyCode === 13 || event.keyCode === 32)) ||
          (event.type === 'mouseup')) {
        this.collection.isSortOptionSelected = true;
      }
    },

    onPropertiesViewDestroyed: function () {
      this.onMetadataNavigationViewDestroyed();
      this.options.originatingView.headerView.updateToggleDescription();
      this.render();
    },

    onMetadataNavigationViewDestroyed: function () {
      if (!!this.collection.inMetadataNavigationView && this.isTabularView) {
        this.collection.inMetadataNavigationView = false;
      }
    },

  });

  return TabularSearchResultsView;
});
csui.define('csui/models/widget/search.results/search.metadata/search.columns',['csui/lib/underscore', "csui/lib/backbone",
  'i18n!csui/models/impl/nls/lang'
], function (_, Backbone, lang) {

  var metadataColumnModel = Backbone.Model.extend({

    idAttribute: "key",

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    }

  });

  var metadataColumnCollection = Backbone.Collection.extend({

    model: metadataColumnModel,
    comparator: "sequence",

    getColumnKeys: function () {
      return this.pluck('key');
    },

    deepClone: function () {
      return new metadataColumnCollection(
          this.map(function (column) {
            return column.attributes;
          }));
    }
  });

  var metadataColumns = new metadataColumnCollection([
    {
      key: 'OTMIMEType',
      sequence: 0,
      titleIconInHeader: 'mime_type',
      permanentColumn: true // don't wrap column due to responsiveness into details row
    },
    {
      key: 'OTName',
      sequence: 1,
      permanentColumn: true, // don't wrap column due to responsiveness into details row
      isNaming: true  // use this column as a starting point for the inline forms
    },
    {
      key: 'version_id',
      column_key: 'version_id',
      title: lang.version,
      noTitleInHeader: true,
      permanentColumn: true,
      sequence: 2
    },
    {
      key: 'reserved',
      column_key: 'reserved',
      sequence: 3,
      title: lang.state, // "reserved" is just to bind the column to some property
      noTitleInHeader: true, // don't display a text in the column header
      permanentColumn: true
    },
    {
      key: 'favorite',
      column_key: 'favorite',
      sequence: 910,
      title: lang.favorite,
      noTitleInHeader: true,
      permanentColumn: true // don't wrap column due to responsiveness into details row
    }
  ]);

  return metadataColumns;
});


csui.define('csui/widgets/search.results/impl/toolbaritems',['csui/lib/underscore', "module",
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/search.results/impl/toolbaritems'
], function (_, module, extraToolItems) {

  // TODO: Deprecate this module

  if (extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      // TODO: log a deprecation warning
    });
  }

  return extraToolItems;

});

csui.define('csui/widgets/search.results/toolbaritems',[
  'csui/lib/underscore',
  'i18n!csui/widgets/search.results/nls/lang',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/search.results/toolbaritems',
  // Load extra tool items from the previous module location
  'csui/widgets/search.results/impl/toolbaritems'
], function (_, publicLang, lang, ToolItemsFactory, TooItemModel, extraToolItems,
    oldExtraToolItems) {
  'use strict';

  // Keep the keys in sync with csui/widgets/search.results/toolbaritems.masks
  var toolbarItems = {

    filterToolbar: new ToolItemsFactory({
          filter: [
            {
              signature: "Filter",
              name: lang.ToolbarItemFilter,
              iconName: "csui_action_filter32"
            }
          ]
        },
        {
          addTrailingDivider: false
        }),
    tableHeaderToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "CopyLink",
              name: lang.ToolbarItemCopyLink
            }
          ],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'SendTo',
              name: lang.ToolbarItemSendTo,
              flyout: 'sendto',
              group: 'share'
            },
            {
              signature: 'Share',
              name: lang.ToolbarItemShare,
              flyout: 'share',
              promoted: true,
              group: 'share'
            },
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink,
              flyout: 'sendto',
              promoted: true,
              group: 'share'
            }
          ],
          main: [
            {signature: "InlineEdit", name: lang.ToolbarItemRename},
            {signature: "permissions", name: lang.ToolbarItemPermissions},
            {signature: "Download", name: lang.ToolbarItemDownload},
            {signature: "ReserveDoc", name: publicLang.ToolbarItemReserve},
            {signature: "UnreserveDoc", name: publicLang.ToolbarItemUnreserve},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
            {signature: "Copy", name: lang.ToolbarItemCopy},
            {signature: "Move", name: lang.ToolbarItemMove},
            {signature: "AddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "Collect", name: lang.ToolbarCollect},
            {signature: "Delete", name: lang.ToolbarItemDelete},
            {signature: "RemoveCollectedItems", name: lang.ToolbarItemRemoveCollectionItems},
            {signature: "ZipAndDownload", name: lang.MenuItemZipAndDownload},
            {
              signature: "CompoundDocument",
              name: lang.compoundDocument,
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRelease",
              name: lang.CreateRelease,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRevision",
              name: lang.CreateRevision,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "Reorganize",
              name: lang.Reorganize,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "ViewReleases",
              name: lang.ToolbarItemViewReleases,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            }
          ],
          shortcut: [
            {signature: "OriginalCopyLink", name: lang.ToolbarItemOriginalCopyLink},
            {signature: "OriginalEdit", name: lang.ToolbarItemOriginalEdit},
            {signature: "OriginalEmailLink", name: lang.ToolbarItemOriginalShare},
            {signature: "OriginalReserveDoc", name: publicLang.ToolbarItemOriginalReserve},
            {signature: "OriginalUnreserveDoc", name: publicLang.ToolbarItemOriginalUnreserve},
            {signature: "OriginalCopy", name: lang.ToolbarItemOriginalCopy},
            {signature: "OriginalMove", name: lang.ToolbarItemOriginalMove},
            {signature: "OriginalAddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "OriginalDownload", name: lang.ToolbarItemOriginalDownload},
            {signature: "OriginalDelete", name: lang.ToolbarItemOriginalDelete}
          ]
        },
        {
          maxItemsShown: 15,
          dropDownIconName: "csui_action_more32",
          dropDownText: lang.ToolbarItemMore,
          addGroupSeparators: false,
          lazyActions: true
        }),
    otherToolbar: new ToolItemsFactory({
          info: [{
            signature: "Properties",
            name: lang.ToolbarItemInfo,
            iconName: "csui_action_properties32"
          }, {
            signature: "DocPreview",
            name: lang.ToolbarItemDocPreview,
            commandData: {ifNotOpenDelegate: true}
          }, {
            signature: "CopyLink",
            name: lang.ToolbarItemCopyLink
          }],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'SendTo',
              name: lang.ToolbarItemSendTo,
              flyout: 'sendto',
              group: 'share'
            },
            {
              signature: 'Share',
              name: lang.ToolbarItemShare,
              flyout: 'share',
              promoted: true,
              group: 'share'
            },
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink,
              flyout: 'sendto',
              promoted: true,
              group: 'share'
            }
          ],
          main: [
            {signature: "permissions", name: lang.ToolbarItemPermissions},
            {signature: "Download", name: lang.ToolbarItemDownload},
            {signature: "ReserveDoc", name: publicLang.ToolbarItemReserve},
            {signature: "UnreserveDoc", name: publicLang.ToolbarItemUnreserve},
            {signature: "Copy", name: lang.ToolbarItemCopy},
            {signature: "Move", name: lang.ToolbarItemMove},
            {signature: "AddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "Collect", name: lang.ToolbarCollect},
            {signature: "Delete", name: lang.ToolbarItemDelete},
            {signature: "ZipAndDownload", name: lang.MenuItemZipAndDownload},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
            {
              signature: "CompoundDocument",
              name: lang.compoundDocument,
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRelease",
              name: lang.CreateRelease,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRevision",
              name: lang.CreateRevision,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "Reorganize",
              name: lang.Reorganize,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "ViewReleases",
              name: lang.ToolbarItemViewReleases,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            }
          ]
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false,
          lazyActions: true
        }),
    inlineToolbar: new ToolItemsFactory({
          info: [{
            signature: "Properties",
            name: lang.ToolbarItemInfo,
            iconName: "csui_action_properties32"
          }, {
            signature: "DocPreview",
            name: lang.ToolbarItemDocPreview,
            iconName: "csui_action_preview32",
            commandData: {ifNotOpenDelegate: true}
          }, {
            signature: "CopyLink",
            name: lang.ToolbarItemCopyLink,
            iconName: "csui_action_copy_link32"
          }
          ],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true,  iconName: "csui_action_edit32"},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'Share',
              name: lang.MenuItemShare,
              iconName: "csui_action_share32",
              flyout: 'share'
            },
            {
              signature: 'SendTo',
              name: lang.ToolbarItemSendTo,
              iconName: "csui_action_send_to32",
              flyout: 'sendto'
            },
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink,
              flyout: 'sendto'
            }	
          ],
          other: [
            {
              signature: "permissions",
              name: lang.ToolbarItemPermissions,
              iconName: "csui_action_view_perms32"
            },
            {
              signature: "Download",
              name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "ReserveDoc",
              name: publicLang.ToolbarItemReserve,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "UnreserveDoc",
              name: publicLang.ToolbarItemUnreserve,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "Lock",
              name: lang.ToolbarItemLock,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "Unlock",
              name: lang.ToolbarItemUnlock,
              iconName: "csui_action_unreserve32"
            },
            {
              signature: "Copy",
              name: lang.ToolbarItemCopy,
              iconName: "csui_action_copy32"
            },
            {
              signature: "Move",
              name: lang.ToolbarItemMove,
              iconName: "csui_action_move32"
            },
            {
              signature: "AddVersion",
              name: lang.ToolbarItemAddVersion,
              iconName: "csui_action_add_version32"
            },
            {
              signature: "Collect",
              name: lang.ToolbarCollect,
              iconName: "csui_action_collect32"
            },
            {
              signature: "Delete",
              name: lang.ToolbarItemDelete,
              iconName: "csui_action_delete32"
            },
            {
              signature: "ZipAndDownload",
              name: lang.MenuItemZipAndDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "CompoundDocument",
              name: lang.compoundDocument,
              flyout: "CompoundDocument",
              iconName: "csui_action_compound_document32"
            },
            {
              signature: "CreateRelease",
              name: lang.CreateRelease,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRevision",
              name: lang.CreateRevision,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "Reorganize",
              name: lang.Reorganize,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "ViewReleases",
              name: lang.ToolbarItemViewReleases,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            }
          ]
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        }),
    tabularInlineToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "Properties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "CopyLink",
              name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          edit: [
            {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true,  iconName: "csui_action_edit32"},
            {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
            {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
            {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
          ],
          share: [
            {
              signature: 'Share',
              name: lang.MenuItemShare, 
              iconName: "csui_action_share32",
              flyout: 'share'
            }
          ],
          other: [
            {
              signature: "permissions",
              name: lang.ToolbarItemPermissions,
              iconName: "csui_action_view_perms32"
            },
            {
              signature: "Download",
              name: lang.ToolbarItemDownload,
              iconName: "csui_action_download32"
            },
            {
              signature: "ReserveDoc",
              name: publicLang.ToolbarItemReserve,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "UnreserveDoc",
              name: publicLang.ToolbarItemUnreserve,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "Copy",
              name: lang.ToolbarItemCopy,
              iconName: "csui_action_copy32"
            },
            {
              signature: "Move",
              name: lang.ToolbarItemMove,
              iconName: "csui_action_move32"
            },
            {
              signature: "AddVersion",
              name: lang.ToolbarItemAddVersion,
              iconName: "csui_action_add_version32"
            },
            {
              signature: "Collect",
              name: lang.ToolbarCollect,
              iconName: "csui_action_collect32"
            },
            {
              signature: "Delete",
              name: lang.ToolbarItemDelete,
              iconName: "csui_action_delete32"
            },
            {
              signature: "ZipAndDownload",
              name: lang.MenuItemZipAndDownload,
              iconName: "csui_action_download32"
            }
          ]
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        }),

    versionToolItems: ['properties', 'open', 'download', 'delete']
  };

  if (oldExtraToolItems) {
    addExtraToolItems(oldExtraToolItems);
  }

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;
});

csui.define('csui/widgets/search.results/toolbaritems.masks',['module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  // Keep the keys in sync with csui/widgets/search.results/toolbaritems
  var toolbars = ['otherToolbar', 'inlineToolbar'];

  function ToolbarItemsMasks() {
    var config = module.config(),
        globalMask = new GlobalMenuItemsMask();
    // Create and populate masks for every toolbar
    this.toolbars = _.reduce(toolbars, function (toolbars, toolbar) {
      var mask = new ToolItemMask(globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        source = source[toolbar];
        if (source) {
          mask.extendMask(source);
        }
      });
      // Enable restoring the mask to its initial state
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
  }

  ToolbarItemsMasks.toolbars = toolbars;

  return ToolbarItemsMasks;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/search.results/impl/search.results',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"csui-sidepanel-header binf-hidden\">\r\n          <h1 class=\"csui-sidepanel-heading\" title=\"search\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"messages") : depth0)) != null ? lookupProperty(stack1,"sidePanelHeader") : stack1), depth0))
    + "</h1>\r\n        </div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "            <div class=\"csui-search-results-custom\">\r\n              <div id=\"csui-search-custom-container\"></div>\r\n            </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- TODO: need to apply localization -->\r\n<div id=\"header\"></div>\r\n<div class=\"binf-container-fluid\">\r\n  <div class=\"csui-facet-table-container\">\r\n    <div class=\"csui-search-left-panel csui-popover-panel csui-is-hidden\">\r\n      <div class=\"csui-popover-panel-container\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"enableCustomSearch") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":7,"column":8},"end":{"line":11,"column":15}}})) != null ? stack1 : "")
    + "        <div class=\"csui-search-left-panel-content\"  role=\"tabpanel\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"enableCustomSearch") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":13,"column":10},"end":{"line":17,"column":17}}})) != null ? stack1 : "")
    + "          <div id=\"facetview\" class=\"csui-facetview\"></div>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"csui-search-results-body binf-col-lg-12 binf-col-md-12 binf-col-xs-12\">\r\n      <div id=\"csui-search-custom-results\">\r\n        <div class=\"csui-search-results-content binf-col-lg-12 binf-col-md-12\">\r\n          <div id=\"facetbarview\"></div>\r\n          <div\r\n              class=\"csui-search-tool-container binf-hidden binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\">\r\n            <div class='csui-standard-header-view' id=\"csui-standard-header-view\"></div>\r\n          </div>\r\n          <div id=\"results\" tabindex=\"-1\" class=\"csui-result-list binf-col-lg-12 binf-col-md-12\r\n          binf-col-sm-12 binf-col-xs-12\"></div>\r\n          <div class='csui-search-loading-wrapper csui-search-blocking binf-hidden'>\r\n            <div class='csui-search-loading'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"loadingMessage") || (depth0 != null ? lookupProperty(depth0,"loadingMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"loadingMessage","hash":{},"loc":{"start":{"line":33,"column":45},"end":{"line":33,"column":63}}}) : helper)))
    + "</div>\r\n          </div>\r\n          <div class='csui-search-loading-wrapper csui-search-init-loading-wrapper csui-serch-reults-initial-load'>\r\n            <div class='csui-search-initial-loading'>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"initialLoadMessage") || (depth0 != null ? lookupProperty(depth0,"initialLoadMessage") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"initialLoadMessage","hash":{},"loc":{"start":{"line":36,"column":53},"end":{"line":36,"column":75}}}) : helper)))
    + "</div>\r\n          </div>\r\n          <div\r\n              class=\"csui-search-row-divider binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\"></div>\r\n        </div>\r\n\r\n        <div id=\"pagination\"\r\n             class=\"binf-col-lg-12 binf-col-md-12 binf-col-sm-12 binf-col-xs-12\"></div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_search.results_impl_search.results', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/search.results/search.results.view',[
  'module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette', 'nuc/utils/log',
  'csui/utils/base', 'csui/utils/url',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/search.results.factory',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/controls/mixins/view.state/node.selection.restore.mixin',
  'csui/controls/mixins/view.state/multi.node.fetch.mixin',
  'csui/widgets/search.results/impl/search.results.header.view',
  'csui/widgets/search.results/impl/standard/standard.search.results.view',
  'csui/widgets/search.results/impl/tabular/tabular.search.results.view',
  'csui/controls/table/table.view',
  'csui/controls/table/rows/description/search.description.view',
  'csui/models/widget/search.results/search.metadata/search.columns',
  'csui/models/nodechildrencolumn',
  'csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view',
  'csui/controls/pagination/nodespagination.view',
  'csui/controls/progressblocker/blocker',
  'csui/widgets/search.results/toolbaritems',
  'csui/widgets/search.results/toolbaritems.masks',
  'csui/widgets/search.custom/impl/search.object.view',
  'csui/widgets/search.forms/search.form.view',
  'csui/utils/contexts/factories/search.settings.factory',
  'csui/controls/globalmessage/globalmessage',
  'i18n!csui/widgets/search.results/impl/nls/lang',
  'csui/controls/tableactionbar/tableactionbar.view',
  'csui/utils/contexts/factories/search.results.facets.factory',
  'csui/models/node/node.model',
  'csui/models/nodes',
  'csui/utils/commands/properties',
  'csui/utils/contexts/factories/user',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/utils/contexts/factories/search.metadata.factory',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/controls/toolbar/toolbar.command.controller',
  'hbs!csui/widgets/search.results/impl/search.results',
  'csui/utils/defaultactionitems',
  'csui/utils/commands',
  'csui/utils/namedlocalstorage',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/controls/facet.panel/facet.panel.view',
  'csui/controls/facet.bar/facet.bar.view',
  'csui/utils/accessibility',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/utils/contexts/factories/usernodepermission',
  'csui/lib/handlebars.helpers.xif',
  'css!csui/widgets/search.results/impl/search.results',
  'csui/lib/jquery.mousehover',
  'csui/lib/jquery.redraw'
], function (module, _, $, Backbone, Marionette, log, base, Url, SearchQueryModelFactory, SearchFormQueryModelFactory,
    SearchResultsCollectionFactory, LayoutViewEventsPropagationMixin, NodeSelectionRestoreMixin,
    MultiNodeFetchMixin, NodeViewStateMixin, HeaderView,
    StandardSearchResultsView, TabularSearchResultsView,
    TableView, DescriptionRowView, tableColumns,
    NodeChildrenColumnModel, TableRowSelectionToolbarView, PaginationView,
    BlockingView, toolbarItems, ToolbarItemsMasks,
    SearchObjectView, SearchFormView, SearchSettingsFactory,
    GlobalMessage, lang, TableActionBarView, SearchResultFacetCollectionFactory, NodeModel, NodeCollection,
    PropertiesCommand, UserModelFactory, DefaultActionBehavior, SearchMetadataFactory, PerfectScrollingBehavior,
    ToolbarCommandController, layoutTemplate, defaultActionItems,
    commands, NamedLocalStorage, ModalAlert, FacetPanelView, FacetBarView, Accessibility, LargeFileSettingsFactory, UserNodePermissionFactory) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable(),
      STANDARD_VIEW = 'StandardView',
      TABULAR_VIEW = 'TabularView';

  var config = _.extend({
    enableFacetFilter: true, // LPAD-60082: Enable/disable facets
    enableBreadcrumb: true,
    enableSearchSettings: true, // global enable/disable search settings, but LPAD 81034 ctor can overrule
    showInlineActionBarOnHover: !accessibleTable,
    forceInlineActionBarOnClick: false,
    inlineActionBarStyle: "csui-table-actionbar-bubble",
    csui: {
      fetchFacets : true   //LPAD-85134, LPAD-82929    //It should remove the previous filters when new Search is initiated
    },
    enableSaveSearchTools: true
  }, module.config());

  var defaultOptions = {
    showFacetPanel: true,
    urlParamsList: ['order_by','page']
  };

  var SearchResultsView = Marionette.LayoutView.extend({

    className: 'csui-search-results binf-panel binf-panel-default initialLoading',
    template: layoutTemplate,
    templateHelpers: function () {
      var messages = {
        enableCustomSearch: this.enableCustomSearch,
        sidePanelHeader: lang.searchHeader
      };
      return {
        messages: messages,
        enableCustomSearch: this.enableCustomSearch,
        loadingMessage: this.loadingMessage,
        initialLoadMessage: this.initialLoadMessage,
        showFacetPanel: this.options.showFacetPanel !== false,
      };
    },

    ui: {
      toolBarContainer: '.csui-search-tool-container',
      customSearchContainer: '.csui-search-results-custom',
      facetView: '#facetview',
      searchResultsContent: '.csui-search-results-content',
      searchResultsBody: ".csui-search-results-body",
      searchSidePanelHeader: ".csui-sidepanel-header",
      searchSidePanelHeading: ".csui-sidepanel-heading",
      searchSidePanel: ".csui-search-left-panel",
      loadingEle: '.csui-search-blocking',
      initialLoadingEle:'.csui-serch-reults-initial-load'
    },

    events: {
      'mouseup @ui.toggleDetails': 'onToggleOrChangePageSize',
      'keypress @ui.toggleDetails': 'onToggleOrChangePageSize',
      'mouseup .csui-paging-navbar > ul > li:not(.csui-overflow) > a': 'onChangePage',
      'keypress .csui-paging-navbar > ul > li:not(.csui-overflow) > a': 'onChangePage',
      'mouseup .csui-pagesize-menu ul.csui-dropdown-list a': 'onToggleOrChangePageSize',
      'keypress .csui-pagesize-menu ul.csui-dropdown-list a': 'onToggleOrChangePageSize'
    },

    regions: {
      headerRegion: '#header',
      resultsRegion: '#results',
      paginationRegion: '#pagination',
      standardHeaderRegion: '#csui-standard-header-view',
      customSearchRegion: '#csui-search-custom-container',
      facetBarRegion: '#facetbarview',
      facetRegion: '#facetview',
      tableRowSelectionToolbarRegion: '.csui-table-rowselection-toolbar'
    },

    behaviors: {

      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.csui-result-list',
        suppressScrollX: true,
        // like bottom padding of container, otherwise scrollbar is shown always
        scrollYMarginOffset: 15
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }

    },

    namedLocalStorage: new NamedLocalStorage('PrevSearchDisplayStyle'),

    getPageSize: function() {
      var pageSize = this.namedLocalStorage.get(
          this._createSearchDisplayStyleKey() + '_PrevSRPageSize');
      return pageSize || 10;
    },

    constructor: function SearchResultsView(options) {
      options || (options = {});
      this.options = _.omit(_.defaults(options, options.basicSearchResultsView ? {
        //if basicSearchResultsView = true is passed,
        // it will disable all functionalities enabled via feature flag 
        // unless the feature flags are specified in the options
        //Do not use options.basicSearchResultsView in code in this file.
        //Always use dedicated feature flag
        enableSaveSearchTools: false,
        enableSearchSettings: false,
        enableBackButton: false,
        showFacetPanel: false,
        urlParamsList: ['order_by','page']
      } : defaultOptions), "basicSearchResultsView");
      this.context = options.context;
      options.pageSize = this.getPageSize();
      options.data || (options.data = {});

      this._addUrlParametersSupport(options.context);

      options.toolbarItems || (options.toolbarItems = toolbarItems);
      options.toolbarItemsMasks || (options.toolbarItemsMasks = new ToolbarItemsMasks());
      this.context = options.context;
      this.showFacet = false;
      if (!options.query) {
        if (!(this.context._factories && this.context._factories.searchTemplate && 
          typeof this.context._factories.searchTemplate.property.get('enableSearchForm') === "string")) {
          options.query = this.context.getModel(SearchQueryModelFactory);
        } else {
          options.query = this.context.getModel(SearchFormQueryModelFactory);
        }
      }

      this.largeFileSettingsFactory = this.options.context.getFactory(LargeFileSettingsFactory);
      this.largeFileSettingsModel = this.largeFileSettingsFactory.property;

      //update search_bar_settings from localstorage while reloading
      var storage   = new NamedLocalStorage('search_bar_settings'),
          full_text = storage.get('full_text');
      if (!!full_text && (!options.query.get('modifier') || !options.query.get('lookfor'))) {
        options.query.set('modifier', full_text.modifier, {silent: true});
        options.query.set('lookfor', full_text.lookfor, {silent: true});
      }

      if (options.collection) {
        // If the collection was passed from outside and might be of a limited scope
        if (!options.collection.fetched) {
          // Store the scope to restore later and cancel limiting the scope of the response
          this._originalScope = options.collection.getResourceScope();
        }
      } else {
        options.collection = this.context.getModel(SearchResultsCollectionFactory, options);
      }

      if (!options.collection.fetched) {
        // Ask the server to check for permitted actions V2 - only default actions
        options.collection.setResourceScope(
            SearchResultsCollectionFactory.getDefaultResourceScope());
        options.collection.setDefaultActionCommands(
            defaultActionItems.getAllCommandSignatures(commands));
        options.collection.setEnabledDelayRestCommands(true);
        if (options.collection.delayedActions) {
          this.listenTo(options.collection.delayedActions, 'error',
              function (collection, request, options) {
                var error = new base.Error(request);
                GlobalMessage.showMessage('error', error.message);
              });
        }
      }

      options.collection.isSortOptionSelected = true;

      Marionette.LayoutView.prototype.constructor.call(this, options);

      var doLoadSearchSettings = (this.options.enableSearchSettings !== undefined) ?
                                 this.options.enableSearchSettings : config.enableSearchSettings;

      if (doLoadSearchSettings) {
        var templateId = this.options.query ? this.options.query.get("query_id") : undefined;
        this.loadSearchSettings(templateId);
      }

      this.collection.selectedItems = new Backbone.Collection();
      this.initSelectionMixin(options);
      this.metadata = options.metadata ||
                      this.context.getCollection(SearchMetadataFactory, options);
      this.query = options.query;

      var collectionStateOptions = this.enableViewState ?
                                   this._restoreCollectionOptionsFromViewState() : {};
      
      if (this.enableViewState && collectionStateOptions) {
          this.collection.setLimit(collectionStateOptions.top || 0, collectionStateOptions.skip || 10, false);
          collectionStateOptions.orderBy && this.collection.setOrder(collectionStateOptions.orderBy, false);
      } else {
          this.collection.setLimit(0, options.pageSize, false);
      }

      this._toggleCustomSearch();

      this.commandController = new ToolbarCommandController({commands: commands});
      this.listenTo(this.commandController, 'before:execute:command', this._beforeExecuteCommand);
      this.listenTo(this.commandController, 'after:execute:command', this._toolbarCommandExecuted);

      var PrevSearchDisplayStyle = this.namedLocalStorage.get(this._createSearchDisplayStyleKey());
      this.collection.prevSearchDisplayStyle = PrevSearchDisplayStyle || STANDARD_VIEW;

      this.setSearchHeader();
      var self = this;
      this.listenTo(this.headerView, "go:back", function () {
        self.trigger("go:back");
      });

      this.tableColumns = options.tableColumns ? options.tableColumns : tableColumns.deepClone();

      this.listenTo(this.headerView, "toggle:filter", this._completeCommand);
      this.listenTo(this.headerView, "toggle:search", this._completeCommand);

      this.listenTo(this.headerView, "focus:filter", this._focusFilter);
      this.listenTo(this.headerView, "focus:search", this._focusSearchForm);

      this.listenTo(this.headerView, "open:facet:view", this.openFacetView);
      this.listenTo(this.headerView, "open:custom:view", this.openCustomView);

      this.listenTo(this.headerView, "correct:filter:aria", this.correctFilterAria);
      this.listenTo(this.headerView, "correct:search:aria", this.correctSearchFormAria);

      this.listenTo(this.headerView, "reload:searchForm", this._resetTargetView);
      this.listenTo(this.headerView, "readonly:filters", this._updateReadOnlyFilters);

      //TODO: specific to tb.s.r.v
      this.listenTo(this.headerView, "render:table", _.bind(function () {
        this.columns = this.collection.searching && this.collection.searching.sortedColumns;
        this.getAdditionalColumns();
         this.trigger('update:table');
      }, this));

      this.listenTo(this.headerView, 'toggle:description', function (args) {
        this.trigger('toggle:description', args.showDescriptions);
      });
      //TODO:END.


      //TODO:BEGIN: this code should execute after collection sync.
      if (!options.collection.searchFacets) {
        options.collection.searchFacets = this.context.getModel(SearchResultFacetCollectionFactory,
            {
              options: {
                query: this.options.query,
                /* TODO: need make it zero once RESt Api is fixed for error: limit must be a positive integer.*/
                topCount: 1
              },
              detached: true
            });
      }

      this.facetFilters = options.collection.searchFacets;

      //TODO:END: this code should execute after collection sync.

      if (this.enableCustomSearch) {
        this.setCustomSearchView();
        this.listenTo(this.customSearchView, "change:title", this.updateHeaderTitle);
        this.listenTo(this.customSearchView, 'model:updated', this.showHeaderSaveSearchTools);
      }
      this.loadingText = lang.loadingSearchResultMessage;
      //TODO: blocking view should come from actual s.r.v.
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      var perspective = this.context ? this.context.perspective :
      this.options &&  this.options.context ? this.options.context.perspective : undefined;
      if (perspective && _.isEmpty(perspective.get('options').left) && _.isEmpty(perspective.get('options').right)) {
        this.blockingView.showloadingWheel = true;
      }
      this.loadingMessage = this.blockingView.showloadingWheel ? lang.loadingSearchResultMessage : "";
      this.listenTo(this.settings, 'sync', _.bind(function () {
        var isLocationColumnAvailable = false,
            selectedSettings          = false;

        if (this.settings &&
            this.settings.get("display")) {
          if (this.settings.get("display").display_regions &&
              this.settings.get("display").display_regions.selected) {
            isLocationColumnAvailable = _.findIndex(
                this.settings.get("display").display_regions.selected.models,
                function (column, index) {
                  return column.get("key") === 'OTLocation';
                });
          }

          selectedSettings = this.settings.get("display").summary_description &&
                             this.settings.get("display").summary_description.selected;

        }
        this.collection.isLocationColumnAvailable = isLocationColumnAvailable > -1;
        this.collection.selectedSettings = selectedSettings;
      }, this));

      this.listenTo(this.collection, 'sync', function () {
        this.ui.loadingEle.addClass('binf-hidden');
        if (!this.enableCustomSearch) {
          this.$el.parents(".search-results-container").addClass("csui-global-search");
        }
      });
      this.listenToOnce(this.collection, 'request', _.bind(function () {
        this.ui.initialLoadingEle.addClass('binf-hidden');
        //TODO: Need to check with UX about the loading text and then show the text
        //this.ui.loadingEle.removeClass('binf-hidden');
      }, this));

      // Refresh the search results whenever the search query changes
      // on the same perspective
      this.listenTo(this.query, 'change', function () {
        var ele = this.$el.find(".csui-search-right-header-container > .csui-search-header-action.csui-tabular-view");
        ele && ele.hasClass('csui-toggledView') && ele.removeClass('csui-toggledView');

        //For any query change in search results page, remove previous saved query
        this.previousSavedQuery = null;

        if (this.query.get('forcePerspectiveChange')) {
          // Refreshing of current results is not required since query change enforcing perspective change
          return;
        }
        this.collection.isSortOptionSelected = true;
        this._updatePanels();
        if (doLoadSearchSettings) {
          var templateId = this.query ? this.query.get("query_id") : undefined;
          this.loadSearchSettings(templateId);
        }
        if (this.collection.isFetchable()) {
          var fetchFacets = config.csui && config.csui.fetchFacets;
          //Do not clear read only filters as they are included in the search results
          var removableFilters = _.filter(this.facetFilters.filters, function(filter) {
            return filter.readOnlyFilter === undefined;
          });
          if(this.facetFilters.removeFilter) {
            this.facetFilters.removeFilter(removableFilters, fetchFacets);
            this.facetFilters.fetched = false;
          } else {
            this.facetFilters.clearFilter(fetchFacets);
          }
        //  this.paginationView.nodeChange();
          this.collection.fetch({
            error: _.bind(this.onSearchResultsFailed, this, options)
          });
          this.trigger('query:changed');
          this.trigger('queryTools:update');
          this.resetScrollToTop();
        }
        //reset selected Items
        //confirmation Message
        this.collection.selectedItems.reset([]);
      });

      this.listenTo(this.options.context, 'request', this.blockActions)
          .listenTo(this.options.context, 'sync', this._persistState)
          .listenTo(this.options.context, 'error', this.unblockActions)
          .listenTo(this.collection, "request", this.executePreProcess)
          .listenTo(this.collection, "error", this.unblockActions)
          .listenTo(this.collection, "destroy", this.unblockActions)
          .listenTo(this.collection, "new:page", this.resetScrollToTop)
          .listenTo(this.context.viewStateModel, 'change:state', this.onViewStateChanged)
          .listenTo(this.collection, 'paging:change', this._pagingChanged)
          .listenTo(this.collection, 'limits:change', this._pagingChanged)
          .listenTo(this.collection, 'orderBy:change', this._orderByChanged)
          .listenTo(this.collection, 'orderBy:clear', this._orderByChanged);


      var prevPageSize = this.namedLocalStorage && this.namedLocalStorage.get(
            this._createSearchDisplayStyleKey() + '_PrevSRPageSize');
      this.options.pageSize = (prevPageSize) ? prevPageSize : 10;

      this.setPagination();

      this.listenTo(this.collection, 'sync', this.executeEndProcess);
      this.listenTo(this, 'target:view:changed', this.executeEndProcess);
      this.listenTo(this, "properties:view:destroyed", this.onPropertiesViewDestroyed);
      this.listenTo(this, "permissions:view:destroyed", this.onPropertiesViewDestroyed);

      !base.isMozilla() && this.propagateEventsToRegions();
      this.onWinRefresh = _.bind(this.windowRefresh, this);
      $(window).on("resize.app", this.onWinRefresh);
      if (this.enableCustomSearch) {
        this.showSearch = true;
        this.showFacet = false;
        this.listenToOnce(this, 'dom:refresh', _.bind(function () {
          if (this.$el.width() > 1023) {
            this.ui.searchSidePanel.addClass('csui-is-visible');
            this.ui.searchResultsBody.addClass('csui-search-results-body-right');
          } else {
            this.ui.searchSidePanel.addClass("search-side-panel-overlay");
            this.ui.searchSidePanel.addClass("search-side-panel-auto");
          }
        }, this));
      }
      this.listenTo(this, 'doc:preview:generic:actions', this._highlightRow);
      this.listenToOnce(this.collection, "sync",function(){
        this.$el.removeClass("initialLoading");
       });
       this.initialLoadMessage = options.initialLoadMessage || lang.initialLoadMessage;
    },
    /**
     * This method highlight's the row for which document is getting to be previewed.
     *
     * @param targetRow
     * @private
     */
    _highlightRow: function (targetNode, HIGHLIGHT_CLASS_NAME) {
      $('.' + HIGHLIGHT_CLASS_NAME).removeClass(HIGHLIGHT_CLASS_NAME);
      var rowIndex = _.findIndex(this.collection.models, function (node) {
        return node.get('id') === targetNode.get("id");
      });

      // ensure current viewing document exists in current page, then only high-light the row.
      // if the document exists in previous or next pages, let's do nothing for now.
      if (rowIndex !== -1) {
        var view = this.tableView ||
          this.targetView,
          table = view && view.table ? view.table : undefined,
          targetRow = table === undefined ? table : $(table.row(rowIndex).node());

        targetRow && targetRow.addClass(HIGHLIGHT_CLASS_NAME);
      }
    },

    executePreProcess: function () {
        if (this.$el.is(':visible')) {
      // Begin: set the loading element's position.
      var completeArea = this.el,
          resultsArea  = completeArea.getElementsByClassName('csui-result-list')[0];
      if (resultsArea.getBoundingClientRect().left !== completeArea.getBoundingClientRect().left) {
        // when there is any side panel opened without overlay, then reduce left for loading ele.
        this.ui.loadingEle.addClass('csui-side-panel-exists');
      }

      // Removing loadingEle to avoid white background on collection fetch
      // End: set the loading element's position.
      //this.ui.loadingEle.removeClass('binf-hidden');
      }
      this.blockActions();
    },

    executeEndProcess: function () {
      if (!this.targetView) {
        this.setTargetView();

        this.paginationRegion.show(this.paginationView);
        this.targetView.trigger('set:inline:actionbar:events');
        this._setFacetBarView();
        
        if(this.collection.searching.facets && this.collection.searching.facets.selected) {
          if(this.facetBarView.collection.filters && this.facetBarView.collection.filters.length === 0){
          var selectedFacets = this.collection.searching.facets.selected;
         
          for(var i = 0;i < selectedFacets.length; i++) {
            var facets = selectedFacets[i];
            var filters = [];
            _.each(facets.facet_items, function (item) {
              if (item) {
                filters.push({
                  id: item.value
                });
              }
            });
            var existingFilter = {
              id: facets.name,
              values: filters,
              readOnlyFilter: true
            };
            this.facetFilters.addFilter(existingFilter, false);
          }
            this.facetFilters.ensureFetched();
          }
        }
        if (this.facetBarView && this.options.showFacetPanel !== false) {
          this.facetBarRegion.show(this.facetBarView);
        }
        this.correctSearchFormAria(this);
      }

      if (this.collection.length) {
        this.trigger('render:metadata');
        this.columns = this.collection.searching && this.collection.searching.sortedColumns;
        this.getAdditionalColumns();
        this.targetView.trigger('set:tablerow:assets');
        if((!!this.collection.settings_changed ||
          this.collection.columns.length !== this.collection.searching.sortedColumns.length)
         && this.collection.prevSearchDisplayStyle === 'TabularView') {
          // update only when column settings change
          this.collection.columns = this.collection.searching.sortedColumns;
          this.trigger('update:table');
          this.collection.settings_changed = false;
        }
      }

      this.updateActionToolBar();
      this.updateScrollbar();
      this.unblockSearchResultsActions();
    },

    unblockSearchResultsActions: function () {
      this.ui.loadingEle.removeClass('csui-side-panel-exists');
      this.ui.loadingEle.addClass('binf-hidden');
      this.unblockActions();
    },

    collectionEvents: {'reset': 'updateLayoutView'},

    updateLayoutView: function () {
      //while loading search url directly - page size is set to local storage page size
      var prevPageSize = this.namedLocalStorage && this.namedLocalStorage.get(
              this._createSearchDisplayStyleKey() + '_PrevSRPageSize');
      prevPageSize = (prevPageSize) ? prevPageSize : 10;
      this.paginationView.options.pageSize = prevPageSize;
      this.paginationView.selectedPageSize = prevPageSize;
    },

    setPagination: function () {
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.options.pageSize,
        pageNumber: this.options.pageNumber,
        defaultDDList: [10, 25, 50, 100] // LPAD-48290, to make consistent with classic console
      });

      this.listenTo(this.paginationView, 'pagesize:updated', function (paginationView) {
        this.paginationView.pageSize = paginationView.pageSize;
        this.namedLocalStorage.set(this._createSearchDisplayStyleKey() + '_PrevSRPageSize',
            this.paginationView.pageSize);
      });
      return true;
    },

    onToggleOrChangePageSize: function (event) {
      if ((event.type === 'keypress' && (event.keyCode === 13 || event.keyCode === 32)) ||
          (event.type === 'mouseup')) {
        this.collection.isSortOptionSelected = true;
      }
    },

    onChangePage: function (event) {
      var targetPageTab = $(event.currentTarget),
          pageNum       = parseInt(targetPageTab.attr('data-pageid'), 10);
      if (pageNum + 1 !== this.paginationView.currentPageNum) {
        this.onToggleOrChangePageSize(event);
      }
    },

    //TODO: remove _persistState function.
    _persistState: function () {
      this.unblockActions();
    },

    loadSearchSettings: function (templateId) {
      this.options.templateId = templateId;
      if (this.settings && this.settings.options) {
        this.settings.options.templateId = templateId;
      }
      this.settings = this.options.settings ||
                      this.context.getCollection(SearchSettingsFactory, this.options);
      this.settings.fetch();
    },

    _createSearchDisplayStyleKey: function () {
      var context = this.context || (this.options && this.options.context),
        srcUrl = new Url().getAbsolute(),
        userID = context && context.getModel(UserModelFactory).get('id'), hostname;
      if (srcUrl == "undefined" || srcUrl == "null") {
        hostname = !!srcUrl && !!userID ? (srcUrl + userID) : "defaultSearchDisplayStyle";
      }
      else {
        hostname = srcUrl && srcUrl.split('//')[1] && srcUrl.split('//')[1].split('/')[0].split(':')[0] + userID;
      }
      return hostname;
    },

    setTargetView: function() {
      this.columns = this.collection.searching && this.collection.searching.sortedColumns;
      if (accessibleTable) {
        this.getAdditionalColumns();
      }
      this.collection.columns = (this.columns) ? this.columns : this.tableColumns;
      if (this.settings && this.settings.get('display')) {
        var selectedSummary = this.settings.get('display').summary_description.selected;
        this.showSummaryOnly = (selectedSummary === 'SO') ? true : false;
      }

      var currentTemplate = this.collection.prevSearchDisplayStyle;

      if (currentTemplate === TABULAR_VIEW) {
        this.ui.toolBarContainer.addClass('binf-hidden');
        this.targetView = this.setTabularSearchView();
        this.targetView.trigger('set:tablerow:assets');
        // the selection restoration mixin needs the tableView variable. This mixin
        // is shared by many other widgets.
        this.tableView = this.targetView;
        this.previewInFullMode = false;
      } else {
        this.ui.toolBarContainer.removeClass('binf-hidden');
        this.targetView = this.setStandardSearchView();
        this.tableView = undefined;
        this.previewInFullMode = true;
      }

      this.resultsRegion.show(this.targetView, this);
      if (currentTemplate === STANDARD_VIEW) {
        this.standardHeaderRegion.show(this.targetView.standardHeaderView);
        this.targetView.standardHeaderView._removeAllSelections();
      } else {
        this.trigger('toggle:description', this.headerView.showDescription);
      }

    },

    _updateReadOnlyFilters: function () {
       _.each(this.facetFilters.filters, function(filter) {
        filter.readOnlyFilter = true;
      });
      this.facetFilters.trigger('set:readonly');
    },

    _resetTargetView: function() {
      // BEGIN: destroy existing target view and empty the region.
      this.targetView.trigger('destroy:header:view');
      this.targetView.destroy();
      this.targetView = undefined;
      this.resultsRegion.empty();
      // END: destroy existing target view and empty the region.

      this.setTargetView();
      this.executeEndProcess();
      this.resetScrollToTop();
    },

    setStandardSearchView: function() {
      var args = _.extend(this.options, {
        collection: this.collection,
        originatingView: this,
        headerEle: this.ui.toolBarContainer,
        context: this.context,
        metadata: this.metadata
      });
      return new StandardSearchResultsView(args);
    },

    setTabularSearchView: function() {
      var args = _.extend(this.options, {
        collection: this.collection,
        columns: this.columns,
        tableColumns: this.tableColumns,
        originatingView: this,
        container: this.container,
        defaultActionController: this.defaultActionController,
        config: config,
        customLabels: {
          emptyTableText: lang.noSearchResultMessage
        }
      });
      return new TabularSearchResultsView(args);
    },



    _focusFilter: function (view) {
      !!view && view.headerView.ui.filter.trigger('focus');
      this.correctFilterAria(view);
      var tabElements = this.facetView && this.facetView.$('.csui-facet');
      if (tabElements && tabElements.length > 0) {
        tabElements.prop('tabindex', 0);
      }
      view.headerView.ui.filter
            .attr({
              "tabindex":0
            });
    },
    _focusSearchForm: function (view) {
      !!view && view.headerView.ui.search.trigger('focus');
      this.correctSearchFormAria(view);
      var tabElements = this.customSearchView && this.customSearchView.$('.csui-saved-search-form');
      if (tabElements && tabElements.length > 0) {
        tabElements.prop('tabindex', 0);
      }
      view.headerView.ui.search
            .attr({
              "tabindex":0
            });
    },
    // adapt title, icon, aria-expanded and aria-label
    correctFilterAria: function (view) {
      if (!!view && !!view.headerView) {
        if (this.ui.searchSidePanel.hasClass('csui-is-visible') && !this.showSearch) {
          view.headerView.ui.filter
            .attr({
              "title": lang.filterCollapseTooltip,
              "aria-label": lang.filterCollapseAria,
              "aria-expanded": this.showFacet,
              "tabindex":0
            });
        } else {
          view.headerView.ui.filter
            .attr({
              "title": lang.filterExpandTooltip,
              "aria-label": lang.filterExpandAria,
              "aria-expanded": this.showFacet
            });
        }
      }
    },
    correctSearchFormAria: function (view) {
      if (!!view && !!view.headerView) {
        if (this.ui.searchSidePanel.hasClass('csui-is-visible') && !this.showFacet) {
          view.headerView.ui.search
            .attr({
              "title": lang.searchFormCollapseTooltip,
              "aria-label": lang.searchFormCollapseAria,
              "aria-expanded": this.showSearch,
              "tabindex":0
            });
        } else {
          view.headerView.ui.search
            .attr({
              "title": lang.searchFormExpandTooltip,
              "aria-label": lang.searchFormExpandAria,
              "aria-expanded": this.showSearch
            });
        }
      }
    },
    onSearchResultsFailed: function (model, request, message) {
      var error = new base.RequestErrorMessage(message);
      ModalAlert.showError(error.toString());
    },
    updateScrollbar: function () {
      this.triggerMethod('update:scrollbar', this);
    },

    resetScrollToTop: function () {
      var scrollContainer = this.$('#results');
      scrollContainer.scrollTop(0);
      // if needed: triggerMethod(this, "update:scrollbar");
    },

    updateActionToolBar: function () {
      if (this.collection.length === 0) {
        this.ui.toolBarContainer.addClass('binf-hidden');
        if (!this.enableCustomSearch) {
          this.ui.customSearchContainer.addClass('binf-hidden');
        }
      } else if (this.collection.prevSearchDisplayStyle === "StandardView") {
        this.ui.toolBarContainer.removeClass('binf-hidden');
        if (this.ui.customSearchContainer && this.ui.customSearchContainer.hasClass('binf-active')) {
          this.ui.customSearchContainer.removeClass('binf-hidden');
        }
      }
    },

    openVersionHistory: function (args) {
      var nodes = new NodeCollection();
      nodes.push(args.model);
      var status = {
        nodes: nodes,
        container: args.model.collection.node,
        collection: args.model.collection,
        selectedTab: new Backbone.Model({title: 'Versions'})
      };
      status = _.extend(status, {originatingView: this});
      // view properties of an existing item
      var propertiesCmd = new PropertiesCommand();
      propertiesCmd.execute(status, this.options)
          .always(function (args) {
            //self.cancel();
          });
    },

    onPropertiesViewDestroyed: function () {
      this.onMetadataNavigationViewDestroyed();
      this.headerView.updateHeader();
      var showDescription = this.namedLocalStorage.get(
          this._createSearchDisplayStyleKey() + '_showDescription');
      if (this.collection.prevSearchDisplayStyle === TABULAR_VIEW) {
        this.headerView.updateToggleDescription();
        this.tableView && this.tableView.render();
      }
      this.paginationView && this.paginationView.collectionChange();
    },

    onPermissionViewDestroyed: function () {
      this.onPropertiesViewDestroyed();
    },

    onMetadataNavigationViewDestroyed: function () {
      if (!!this.collection.inMetadataNavigationView && this.isTabularView) {
        this.collection.inMetadataNavigationView = false;
      }
    },

    _toggleCustomSearch: function () {
      this.enableCustomSearch = !!this.options.customSearchViewModel ||
                                !!this.options.customSearchView || this.query.get("query_id") &&
                                                                   Object.keys(
                                                                       this.query.attributes).length >
                                                                   1;
      if (this.enableCustomSearch) {
        this.$el.find("#csui-search-custom-container").addClass('csui-search-custom-container');
        this.$el.find("#csui-search-custom-results").addClass("csui-search-custom-results");
        this.$el.find(".csui-search-custom-tab").addClass('binf-active');
        this.$el.find(".csui-search-custom-tab > a").attr('aria-selected', 'true');
        var tabElements = this.customSearchView && this.customSearchView.$('.csui-saved-search-form');
        if (tabElements && tabElements.length > 0) {
          tabElements.prop('tabindex', -1);
        }
        this.headerView && this.headerView.ui.search.attr({"tabindex":0});
      } else {
        if (this.customSearchView && this.query.get("where")) {
          this.customSearchRegion.empty();
          this.$el.find("#csui-search-custom-container").removeClass(
              'csui-search-custom-container');
          this.$el.find("#csui-search-custom-results").removeClass("csui-search-custom-results");
        }
      }
    },

    _updatePanels: function () {
      this._toggleCustomSearch();
      if (!this.enableCustomSearch) {
        this.headerView._filterStateIsOn = false;
        if (this.ui.searchSidePanel.hasClass('csui-is-visible')) {
          var view = this;
          this.ui.searchSidePanel.one(this._transitionEnd(),
              function () {
                view.$el.find(".csui-search-results-custom").addClass('binf-hidden');
                view.$el.find(".csui-search-left-panel-tabs").addClass('binf-hidden');
                if (!view.ui.searchSidePanel.hasClass('csui-is-visible')) {
                  view.ui.loadingEle.removeClass('csui-side-panel-exists');
                  view.ui.searchSidePanel.addClass('csui-is-hidden');
                }
                view.ui.facetView.removeClass('binf-hidden');
              });
          this.ui.searchResultsBody.removeClass("csui-search-results-body-right");
          this.ui.searchSidePanel.removeClass("csui-is-visible");
        } else {
          this.$el.find(".csui-search-results-custom").addClass('binf-hidden');
          this.$el.find(".csui-search-left-panel-tabs").addClass('binf-hidden');
          this.ui.facetView.removeClass('binf-hidden');
        }
      } else {
        this.headerView._filterStateIsOn = false;
        this.headerView._searchStateIsOn = true;
        this.$el.find(".csui-search-results-custom").removeClass('binf-hidden');
        this.$el.find(".csui-search-left-panel-tabs").removeClass('binf-hidden');
        this.ui.searchResultsBody.addClass("csui-search-results-body-right");
      }
      if (this.headerView) {
        this.headerView.options.useCustomTitle = this.enableCustomSearch;
      }
      if (this.facetView) {
        this.facetView.options.data.showTitle = !this.enableCustomSearch;
        //re-render facetView to show title
        this.facetView.render();
      }
    },

    openCustomView: function (e) {
      //Show custom search panel, hide search facet
      if (this.enableCustomSearch) {
          this.ui.facetView.addClass('binf-hidden');
          this.$el.find(".csui-search-results-custom").removeClass('binf-hidden');
          this.$el.find(".csui-search-facet-tab").removeClass('binf-active');
          this.$el.find(".csui-search-facet-tab > a").removeAttr('aria-selected');
          this.$el.find(".csui-search-custom-tab").addClass('binf-active');
          this.$el.find(".csui-search-custom-tab > a").attr('aria-selected', 'true');
      }
    },

    openFacetView: function (e) {
      //Show search facet panel, hide custom search panel
      if (this.enableCustomSearch) {
        this.facetFilters.ensureFetched();
        this._ensureFacetPanelViewDisplayed();
          this.$el.find(".csui-search-results-custom").addClass('binf-hidden');
          this.ui.facetView.removeClass('binf-hidden');
          this.$el.find(".csui-search-custom-tab").removeClass('binf-active');
          this.$el.find(".csui-search-custom-tab > a").removeAttr('aria-selected');
          this.$el.find(".csui-search-facet-tab").addClass('binf-active');
          this.$el.find(".csui-search-facet-tab > a").attr('aria-selected', 'true');
          this.facetView.triggerMethod('dom:refresh');
      }
    },

    onDestroy: function () {
      $(window).off("resize.app", this.onWinRefresh);
      // If the collection was passed from outside and might be of a limited scope
      if (this._originalScope) {
        // Restore the scope of the response
        this.options.collection.setResourceScope(this._originalScope);
      }
      this.tableView && this.tableView.destroy();
    },

    // bubble to regions
    //Dom refresh currently only needed for the Pagination view. When a refresh is called
    //on the searchresultview, it causes the results to constantly expand its length without cause.
    windowRefresh: function () {
      // Window resizing can be triggered between the constructor and rendering;
      // sub-views of this view are not created before the min view is rendered
      this.facetView && this.facetView.triggerMethod('dom:refresh');
      this.targetView && this.targetView.triggerMethod('dom:refresh');
      var panelPosition = this.ui.searchSidePanel.css("position");
      if (panelPosition != "absolute") {
        if (this.$el.width() > 1023 &&
            this.ui.searchSidePanel.hasClass("search-side-panel-overlay")) {
          //Entered from width <1024 to width >1024
          this.ui.searchSidePanel.removeClass("search-side-panel-overlay");
          if (this.ui.searchSidePanel.hasClass("search-side-panel-auto")) {
            //open search facet
            this.ui.searchSidePanel.removeClass("search-side-panel-auto");
            this._completeCommand(this, true);
          }
        }
      } else if (!this.ui.searchSidePanel.hasClass("search-side-panel-auto") &&
                 !this.ui.searchSidePanel.hasClass("search-side-panel-overlay")) {
        //Entered from width >1024 to width <1024
        this.ui.searchSidePanel.addClass("search-side-panel-overlay");
        if (this.ui.searchSidePanel.hasClass("csui-is-visible")) {
          //should be opened automatically once width >1024
          this.ui.searchSidePanel.addClass("search-side-panel-auto");
          //close search facet
          this._completeCommand(this, true);
        }
      }
    },

    setSearchHeader: function () {
      var showSearchSettingsButton = (this.options.enableSearchSettings !== undefined) ?
                                     this.options.enableSearchSettings :
                                     config.enableSearchSettings,
          saveSearchTools = (this.options.enableSaveSearchTools !== undefined) ?
                            this.options.enableSaveSearchTools :
                            config.enableSaveSearchTools;
      
      this.headerView = new HeaderView({
        collection: this.collection,
        filter: this.options.searchString,
        context: this.options.context,
        enableBackButton: this.options.enableBackButton,
        backButtonToolTip: this.options.backButtonToolTip,
        enableFacetFilter: config.enableFacetFilter && this.options.showFacetPanel, // LPAD-60082: Enable/disable facets
        useCustomTitle: this.enableCustomSearch,
        commands: commands,
        originatingView: this,
        titleView: this.options.titleView,
        localStorage: this.namedLocalStorage,
        enableSearchSettings: showSearchSettingsButton,
        settings: !!this.settings ? this.settings : false,
        saveSearchTools: saveSearchTools
      });
      return true;
    },

    //setStandardSearchHeaderView: function () {
    //  this.standardHeaderView = new StandardSearchResultsHeaderView({
    //    collection: this.collection,
    //    view: this.resultsView,
    //    options: this.options,
    //    selectedItems: this.collection.selectedItems
    //  });
    //  return true;
    //},


    getSettings: function() {
      return this.settings;
    },

    setCustomSearchView: function () {
      if (!this.query.get('enableSearchForm')) {
        this.customSearchView = this.options.customSearchView || new SearchObjectView({
              context: this.options.context,
              savedSearchQueryId: this.query.get("query_id"),
              customValues: this.query,
              parentView: this,
              query: this.query,
              model: this.options.customSearchViewModel
            });
      } else {
        this.customSearchView = this.options.customSearchView || new SearchFormView({
          context: this.options.context,
          searchFormId: this.query.get("query_id"),
          customValues: this.query,
          parentView: this,
          query: this.query,
          model: this.options.customSearchViewModel
        });
      }
      return true;
    },

    getAdditionalColumns: function () {
      if (accessibleTable) {
        var selectedSettings = this.headerView && this.headerView.selectedSettings;
        selectedSettings = (selectedSettings) ? selectedSettings :
                           this.settings && this.settings.get(
                               'display').summary_description.selected;
        switch (selectedSettings) {
        case 'SD' :
        case 'SP' :
        case 'DP' :
        {
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'description'}) ||
              !this.columns.findWhere({column_key: 'description'})) {
            this.getDescriptionColumn();
          }
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'summary'}) ||
              !this.columns.findWhere({column_key: 'summary'})) {
            this.getSummaryColumn();
          }
          break;
        }
        case 'SO' :
        {
          this.removeDescriptionColumn();
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'summary'}) ||
              !this.columns.findWhere({column_key: 'summary'})) {
            this.getSummaryColumn();
          }
          break;
        }
        case 'DO' :
        {
          this.removeSummaryColumn();
          if (this.tableView && !this.tableView.columns.findWhere({column_key: 'description'}) ||
              !this.columns.findWhere({column_key: 'description'})) {
            this.getDescriptionColumn();
          }
          break;
        }
        case 'NONE' :
        {
          this.removeSummaryColumn();
          this.removeDescriptionColumn();
        }
        }
      }
    },

    getDescriptionColumn: function () {
      this.columns.push(new NodeChildrenColumnModel({
        column_key: 'description',
        name: lang.descriptionColumnTitle,
        sortable: false,
        permanentColumn: true,
        type: -1,
        definitions_order: 505
      }));
    },

    getSummaryColumn: function () {
      this.columns.push(new NodeChildrenColumnModel({
        column_key: 'summary',
        name: lang.summaryColumnTitle,
        sortable: false,
        permanentColumn: true,
        type: -1,
        definitions_order: 506
      }));
    },

    removeDescriptionColumn: function () {
      if (this.tableView && this.tableView.columns.findWhere({column_key: 'description'})) {
        this.tableView.columns.findWhere({column_key: 'description'}).destroy();
      }
    },

    removeSummaryColumn: function () {
      if (this.tableView && this.tableView.columns.findWhere({column_key: 'summary'})) {
        this.tableView.columns.findWhere({column_key: 'summary'}).destroy();
      }
    },

    _beforeExecuteCommand: function (args) {
      // before executing action, keep the collection properties (like, commands, expands, etc.)
      !!this.collection.selectedItems && this.collection.selectedItems.each(function (model) {
        model.collection = args.status.collection;
      });

      if(args.commandSignature === 'Properties' || (args.commandSignature === 'permissions')){
        args.status.originatingView.blockActions();
      }
    },

    // controller for the toolbar actions
    _toolbarCommandExecuted: function (context) {
      if (context && context.commandSignature) {

        this.targetView && this.targetView.trigger('update:tool:items');

        // reducing performance to somewhat extent,
        // such that collection will be refetched if it meets the following conditions:
        // 1) if the current command allows to refetch from it's own implementation
        // 2) if the total count is > current page size.
        if (!!context.command && !!context.command.allowCollectionRefetch &&
            this.collection.totalCount > this.collection.topCount) {
          this.collection.fetch();
        }
        switch (context.commandSignature) {
          case 'Move':
          case 'RemoveCollectedItems':
          case 'Delete':
            //after move, delete operations, the selected nodes collection gets cleared.
            this.collection.selectedItems.remove(this.collection.selectedItems.models);
            var collectionData = this.collection;
            // when last document is deleted in pagination then url need to update to update skipCount
            if (collectionData.skipCount !== 0 && collectionData.totalCount ===
                collectionData.skipCount) {
              this.collection.setLimit(collectionData.skipCount - collectionData.topCount,
                  this.collection.topCount, false);
              this.collection.fetch();
            }else if(collectionData.totalCount < collectionData.topCount){
              this.collection.sync();
            }
            break;
        }
      }
    },

    _updateToolbarActions: function () {
      this.targetView && this.targetView.trigger('set:tablerow:assets');
    },

    _showInlineActionBar: function (args) {
      if (!!args) {
        this._savedHoverEnterArgs = null;

        var parentId = args.node.get('parent_id');
        if (parentId instanceof Object) {
          parentId = args.node.get('parent_id').id;
        }
        var parentNode = new NodeModel({id: parentId},
            {connector: args.node.connector});

        this.inlineToolbarView = new TableActionBarView(_.extend({
              context: this.options.context,
              commands: commands,
              delayedActions: this.collection.delayedActions,
              collection: this.options.toolbarItems.inlineToolbar || [],
              toolItemsMask: this.options.toolbarItemsMasks.toolbars.inlineToolbar,
              container: parentNode,
              containerCollection: this.collection,
              model: args.node,
              originatingView: this,
              notOccupiedSpace: 0
            }, this.options.toolbarItems.inlineToolbar &&
               this.options.toolbarItems.inlineToolbar.options)
        );

        this.listenTo(this.inlineToolbarView, 'after:execute:command',
            this._toolbarCommandExecuted);
        this.inlineToolbarView.render();
        this.listenTo(this.inlineToolbarView, 'destroy', function () {
          this.inlineToolbarView = undefined;
          if (this._savedHoverEnterArgs) {
            this._showInlineActionBarWithDelay(this._savedHoverEnterArgs);
          }
        }, this);
        $(args.target).append(this.inlineToolbarView.$el);
        this.inlineToolbarView.triggerMethod("show");
      }
    },

    _showInlineActionBarWithDelay: function (_view, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
      }
      var self = this;
      this._showInlineActionbarTimeout = setTimeout(function () {
        self._showInlineActionbarTimeout = undefined;
        //if (!self.targetView.lockedForOtherContols) {
          // don't show the action bar control if the searchresult view is locked because a different
          // control is already open
          self._showInlineActionBar.call(self, args);
        //}
      }, 200);
    },

    _actionBarShouldDestroy: function (_view, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
        this._showInlineActionbarTimeout = undefined;
      }
      if (this.inlineToolbarView) {
        //this.inlineToolbarView.updateForSelectedChildren(args.node);
        this.inlineToolbarView.destroy();
      }
    },

    _destroyInlineActionBar: function () {
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
        this.inlineToolbarView = undefined;
      }
    },

    
    _getQueryPermissions: function (queryId) {
      var deferred = $.Deferred(),
          self = this,
          searchQueryNode = new NodeModel({id: queryId});

      var nodePermission = this.context.getObject(UserNodePermissionFactory, {
        node: searchQueryNode
      }).fetch();
      
      nodePermission.done(function (result) {
        var permissionsForQuery = result.results.data.permissions.permissions;
        self.hasEditPermsForSearchQuery = permissionsForQuery && _.isArray(permissionsForQuery) && _.contains(permissionsForQuery, 'reserve');
      }).fail(function (resp) {
        deferred.reject(resp);
      });
    },

    onRender: function () {
      var self = this;
      this.headerRegion.show(this.headerView);

      this.options.query.get("query_id") && this._getQueryPermissions(this.options.query.get("query_id"));
      
      if (this.enableCustomSearch) {
        this.headerView._filterStateIsOn = false;
        this.headerView._searchStateIsOn = true;
        this.customSearchRegion.show(this.customSearchView);
        this.ui.facetView.addClass('binf-hidden');
        this.ui.searchSidePanel.removeClass('csui-is-hidden');
        this.ui.searchSidePanelHeader.removeClass("binf-hidden");
        //update searchFilter icon&tooltip at initial load of CSV/adding related widget - LPAD-85188
        this.ui.searchSidePanel.addClass('csui-is-visible');
        this.correctSearchFormAria(this);
      } else {
        this.headerView._filterStateIsOn = false;
        this.ui.searchSidePanel.removeClass('csui-is-visible');
        this.ui.searchSidePanelHeader.addClass("binf-hidden");
        var view = this;
        this.ui.searchSidePanel.one(this._transitionEnd(),
            function () {
              if (!view.ui.searchSidePanel.hasClass('csui-is-visible')) {
                view.ui.searchSidePanel.addClass('csui-is-hidden');
              }
            });
      }
      this._toggleCustomSearch();

      // perfect scrollbar stops 'scroll' event propagation, trigger it for elements to listen to
      this.$('.csui-result-list').on('scroll', function () {
        self.trigger('scroll');
      });
    },

    _ensureFacetPanelViewDisplayed: function () {
      if (this.facetView === undefined && this.options.showFacetPanel !== false) {
        this._setFacetPanelView();
        this.facetRegion.show(this.facetView);
      }
    },

    _setFacetPanelView: function () {
      this.facetView = new FacetPanelView({
        collection: this.facetFilters,
        blockingLocal: true,
        showTitle: !this.enableCustomSearch,
        context: this.options.context
      });
      this.listenTo(this.facetView, 'remove:filter', this._removeFacetFilter)
          .listenTo(this.facetView, 'remove:all', this._removeAll)
          .listenTo(this.facetView, 'apply:filter', this._checkSelectionAndApplyFilter);
    },

    _removeFacetPanelView: function () {
      this.facetRegion.empty();
      this.facetView = undefined;
    },

    _setFacetBarView: function () {
      this.facetBarView = new FacetBarView({
        collection: this.facetFilters,
        showSaveFilter: false
      });
      this.listenTo(this.facetBarView, 'remove:filter', this._removeFacetFilter)
          .listenTo(this.facetBarView, 'remove:all', this._removeAll)
          .listenTo(this.facetBarView, 'facet:bar:visible', this._handleFacetBarVisible)
          .listenTo(this.facetBarView, 'facet:bar:hidden', this._handleFacetBarHidden);
    },

    _checkSelectionAndApplyFilter: function (filter) {
      if (this.collection.selectedItems.length) {
        ModalAlert.confirmQuestion(
            _.str.sformat(lang.dialogTemplate, lang.dialogTitle), lang.dialogTitle, {})
            .done(_.bind(function () {
              this.collection.selectedItems.reset([]);
              this._addToFacetFilter(filter);
            }, this));
      }
      else {
        this._addToFacetFilter(filter);
      }
    },

    _addToFacetFilter: function (filter) {
      // Update filters, but avoid fecet fetch as fecets will be fetched with search collection
      this.facetFilters.addFilter(filter, false);
      this.collection.setDefaultPageNum();
      this._fetchCollectionAfterFilterUpdate();
      this.resetScrollToTop();
    },

    _removeFacetFilter: function (filter) {
      // Update filters, but avoid fecet fetch as fecets will be fetched with search collection
      this.facetFilters.removeFilter(filter, false);
      this.collection.setDefaultPageNum();
      this._fetchCollectionAfterFilterUpdate();
      this.resetScrollToTop();
    },

    _removeAll: function () {
      // Update filters, but avoid fecet fetch as fecets will be fetched with search collection
      this.facetFilters.clearFilter(false);
      this.collection.setDefaultPageNum();
      this._fetchCollectionAfterFilterUpdate();
      this.resetScrollToTop();
    },

    _fetchCollectionAfterFilterUpdate: function () {
      this.collection.fetch({
          fetchFacets: true,
          success: _.bind(function () {
            this.trigger('queryTools:update');
          }, this)
        });
    },

    _completeCommand: function (view, flag) {
      var panelPosition = view.ui.searchSidePanel.css("position"),
        self = this;
      if (panelPosition === "absolute" && flag === undefined) {
        view.ui.searchSidePanel.removeClass("search-side-panel-auto");
        view.ui.searchSidePanel.addClass("search-side-panel-overlay");
      }
      view.showSidePanel = !view.ui.searchSidePanel.hasClass("csui-is-visible");
      this.showSearch = this.headerView.searchinit && !this.showSearch;
      this.showFacet = this.headerView.filterinit && !this.showFacet;
      if (this.showSearch || this.showFacet || view.showSidePanel) {

        view.facetFilters.ensureFetched();
        view._ensureFacetPanelViewDisplayed();
        view.ui.searchSidePanel.removeClass('csui-is-hidden');
        this.ui.searchSidePanelHeading.text(this.showSearch ? lang.searchHeader : lang.filterHeader);
        view.ui.searchSidePanel.one(view._transitionEnd(),
          function () {
            if (base.isMSBrowser()) {
              if (view.ui.searchSidePanel.hasClass('csui-is-visible')) {
                view.ui.searchResultsBody.addClass('csui-search-results-body-right');
              }
            }
            view.triggerMethod('dom:refresh');
            if (view.paginationView) {
              view.paginationView.triggerMethod('dom:refresh');
            }
            self.targetView && self.targetView.triggerMethod("dom:refresh");
            view.facetView && view.facetView.triggerMethod('dom:refresh');
            self.targetView && self.targetView.trigger('facet:opened', true);
          }).addClass('csui-is-visible');
        if (!base.isMSBrowser()) {
          if (view.ui.searchSidePanel.hasClass('csui-is-visible')) {
            view.ui.searchResultsBody.addClass('csui-search-results-body-right');
          }
        }
        self.headerView.setFacetOpened(this.showFacet);
        self.headerView.setSearchOpened(this.showSearch);
      } else {
        this.showFacet = false;
        this.showSearch = false;
        view.ui.searchSidePanel.one(view._transitionEnd(),
          function () {
            if (!view.ui.searchSidePanel.hasClass('csui-is-visible')) {
              view.ui.searchSidePanel.addClass('csui-is-hidden');
            }
            view.triggerMethod('dom:refresh');
            view._removeFacetPanelView();
            if (view.paginationView) {
              view.paginationView.triggerMethod('dom:refresh');
            }
            self.targetView && self.targetView.triggerMethod("dom:refresh");
            self.headerView.currentlyFocusedElement();
            self.headerView.setFacetOpened(this.showFacet);
            self.headerView.setSearchOpened(this.showSearch);
            self.headerView
              .trigger(self.headerView.searchinit ? 'focus:search' : 'focus:filter', self);
            self.targetView && self.targetView.trigger('facet:opened', false);
          }).removeClass('csui-is-visible');
        view.ui.searchResultsBody.removeClass('csui-search-results-body-right');
      }
      this.ui
        .searchSidePanelHeader[this.enableCustomSearch ? 'removeClass' : 'addClass']("binf-hidden");
      this.facetView && this.facetView.triggerMethod('dom:refresh');
      this.listenTo(this.facetView, 'dom:refresh', function () {
        this.headerView.currentlyFocusedElement();
        this.headerView
          .trigger(this.headerView.searchinit ? 'focus:search' : 'focus:filter', this);
      });
      if (!!this.facetView && !!this.facetView.facets) {
        this.listenTo(this.facetView.facets, 'sync', function () {
          this.headerView
          .trigger(this.headerView.searchinit ? 'focus:search' : 'focus:filter', this);
        });
      }
    },
    _transitionEnd: _.once(
      function () {
        var transitions = {
          transition: 'transitionend',
          WebkitTransition: 'webkitTransitionEnd',
          MozTransition: 'transitionend',
          OTransition: 'oTransitionEnd otransitionend'
        },
          element = document.createElement('div'),
          transition;
        for (transition in transitions) {
          if (typeof element.style[transition] !== 'undefined') {
            return transitions[transition];
          }
        }
      }
    ),

    updateHeaderTitle: function () {
      this.headerView.setCustomSearchTitle(this.options.title);
    },

    showHeaderSaveSearchTools: function () {
      // The custom search has been updated with
      // custom values, so enable the option 'save'.
      this.headerView.toggleSaveSearchTools(true);
    },

    _handleFacetBarVisible: function () {
      this.ui.searchResultsContent.addClass('csui-facetbarviewOpened');
      this.ui.searchResultsContent.find(".csui-facet-list-bar .csui-facet-item:last a").trigger(
        'focus');
      if (this.$el.find(".csui-table-rowselection-toolbar-visible").length > 0) {
        this.$(".csui-selected-counter-region").attr('tabindex', 0);
      }
    },

    _handleFacetBarHidden: function () {
      this.ui.searchResultsContent.removeClass('csui-facetbarviewOpened');
      this.headerView.trigger("refresh:tabindexes");
      if(this.$el.find(".csui-table-rowselection-toolbar-visible").length > 0){
        this.$(".csui-selected-counter-region").attr('tabindex',0);
      }
    },

    onViewStateChanged: function () {
      if (!this.enableViewState) {
        return;
      }

      var viewStateModel = this.context.viewStateModel;
      if (viewStateModel.getCurrentRouterName() === 'Search') {
        var pageInfo = this.getViewStatePage() || this.getDefaultViewStatePage();

        if (pageInfo) {
          if (pageInfo.top !== undefined && pageInfo.skip !== undefined &&
              (pageInfo.top !== this.collection.topCount ||
               pageInfo.skip !== this.collection.skipCount)) {
            this.collection.setLimit(pageInfo.skip, pageInfo.top);
          }
        } else {
          this.collection.setLimit(0, this.getPageSize());
        }
      }
    },

    _pagingChanged: function () {
      if (this.enableViewState &&
          this.collection.topCount !== undefined && this.collection.skipCount !== undefined) {
        return this.setViewStatePage(this.collection.topCount,
            this.collection.skipCount,
            {default: this.collection.skipCount === 0});
      }
    },

    _orderByChanged: function () {
      this.enableViewState && this.setViewStateOrderBy([this.collection.orderBy]);
    },

    _addUrlParametersSupport: function (context) {
      var viewStateModel = context && context.viewStateModel,
          urlParamsList = this.getUrlParameters();
      this.enableViewState = viewStateModel && urlParamsList &&
                             viewStateModel.addUrlParameters(urlParamsList, context);
    },

    getDefaultUrlParameters: function () {
      return this.options.urlParamsList;
    },

    getUrlParameters: function () {
      return this.getDefaultUrlParameters();
    }

  }, {
    RowStatesSelectedRows: 'selected'
  });

  _.extend(SearchResultsView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(SearchResultsView.prototype, NodeViewStateMixin);
  _.extend(SearchResultsView.prototype, NodeSelectionRestoreMixin);
  _.extend(SearchResultsView.prototype, MultiNodeFetchMixin);

  return SearchResultsView;
});


csui.define('json!csui/widgets/search.custom/search.custom.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "tile",
  "schema": {
    "type": "object",
    "properties": {
      "savedSearchQueryId": {
        "title": "{{savedSearchQueryTitle}}",
        "description": "{{savedSearchQueryDescription}}",
        "type": "string"
      }
    },
    "required": [
      "savedSearchQueryId"
    ]
  },
  "options": {
    "fields": {
      "savedSearchQueryId": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": [258]
          }
        }
      }
    }
  }
}
);


csui.define('json!csui/widgets/search.results/search.results.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "fullpage",
  "schema": {},
  "options": {},
  "actions": [
    {
      "toolItems": "csui/widgets/search.results/toolbaritems",
      "toolItemMasks": "csui/widgets/search.results/toolbaritems.masks",
      "toolbars": [
        {
          "id": "otherToolbar",
          "title": "{{otherToolbarTitle}}",
          "description": "{{otherToolbarDescription}}"
        },
        {
          "id": "inlineToolbar",
          "title": "{{inlineToolbarTitle}}",
          "description": "{{inlineToolbarDescription}}"
        }
      ]
    }
  ]
}
);


csui.define('json!csui/widgets/search.results.tile/search.results.tile.manifest.json',{
    "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
    "title": "{{widgetTitle}}",
    "description": "{{widgetDescription}}",
    "kind": "tile",
    "schema": {
      "type": "object",
      "properties": {
        "savedSearchQueryId": {
          "title": "{{savedSearchQueryTitle}}",
          "description": "{{savedSearchQueryDescription}}",
          "type": "string"
        },
        "displayName": {
          "title": "{{displayNameTitle}}",
          "type": "string"
        }
      },
      "required": [
        "savedSearchQueryId"
      ]
    },
    "options": {
      "fields": {
        "savedSearchQueryId": {
          "type": "otcs_node_picker",
          "type_control": {
            "parameters": {
              "select_types": [258]
            }
          }
        }
      }
    }
  }
  );

csui.define('csui/widgets/search.custom/impl/nls/search.custom.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.custom/impl/nls/root/search.custom.manifest',{
  "widgetTitle": "Custom View Search",
  "widgetDescription": "Shows custom view search form for the given saved search query.",
  "savedSearchQueryTitle": "Search query",
  "savedSearchQueryDescription": "An existing saved search query object"
});


csui.define('csui/widgets/search.results/impl/nls/search.results.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/search.results/impl/nls/root/search.results.manifest',{
  "widgetTitle": "Search Results",
  "widgetDescription": "Shows objects found by a full-text search query and offers the most important actions for them.",
  "otherToolbarTitle": "List Header Toolbar",
  "otherToolbarDescription": "Toolbar, which is activated in the list header, once a list item is selected.",
  "inlineToolbarTitle": "Inline Toolbar",
  "inlineToolbarDescription": "Toolbar, which is displayed on the right side of a list item, when the mouse cursor is moving above it."
});


csui.define('csui/widgets/search.results.tile/impl/nls/search.results.tile.manifest',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });
  
csui.define('csui/widgets/search.results.tile/impl/nls/root/search.results.tile.manifest',{
    "widgetTitle": "Search Query Results",
    "widgetDescription": "Shows search results for the given saved search query.",
    "savedSearchQueryTitle": "Search query",
    "savedSearchQueryDescription": "An existing saved search query object",
    "displayNameTitle": "Display name",
    "title": "Search Query Results",
    "description": "Shows search results for the given saved search query.",
    "tableHeaderToolbarTitle": "Table Header Toolbar",
    "tableHeaderToolbarDescription": "Toolbar, which is activated in the table header, once a table row is selected.",
    "inlineActionbarTitle": "Inline Action Bar",
    "inlineActionbarDescription": "Toolbar, which is displayed inside a table row, when the mouse cursor is moving above it."  
  });
  

csui.define('bundles/csui-search',[
  // Models
  'csui/models/widget/search.results/facet.server.adaptor.mixin',
  'csui/models/widget/search.results/search.facets',
  'csui/utils/contexts/factories/search.results.facets.factory',
  'csui/models/widget/search.results/object.to.model',

  // Application widgets
  'csui/widgets/search.custom/search.custom.view',
  'csui/widgets/search.custom/impl/search.object.view',
  'csui/widgets/search.custom/impl/search.customquery.factory',
  'csui/widgets/search.forms/search.form.view',
  'csui/widgets/search.forms/search.form.model',
  'csui/widgets/search.forms/search.form.factory',
  'csui/widgets/search.results/search.results.view',

  // Application widgets manifests
  'json!csui/widgets/search.custom/search.custom.manifest.json',
  'json!csui/widgets/search.results/search.results.manifest.json',
  'json!csui/widgets/search.results.tile/search.results.tile.manifest.json',
  'i18n!csui/widgets/search.custom/impl/nls/search.custom.manifest',
  'i18n!csui/widgets/search.results/impl/nls/search.results.manifest',
  'i18n!csui/widgets/search.results.tile/impl/nls/search.results.tile.manifest',

  // Tool items and tool item masks
  'csui/widgets/search.results/impl/toolbaritems',
  'csui/widgets/search.results/toolbaritems',
  'csui/widgets/search.results/toolbaritems.masks'
], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-search', true);
});

