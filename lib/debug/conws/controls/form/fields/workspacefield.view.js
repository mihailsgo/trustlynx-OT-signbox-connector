csui.define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/utils/log',
  'csui/utils/contexts/factories/connector',
  'csui/models/widget/search.results/search.results.model',
  'csui/controls/form/fields/base/csformfield.view',
  'csui/controls/form/fields/typeaheadfield.view.mixin',
  'conws/controls/form/impl/fields/workspacefield/lqlsearch.util',
  'conws/utils/workspaces/workspace.model',
  'i18n!conws/controls/form/impl/nls/lang',
  'css!conws/controls/typeaheadpicker/impl/typeaheadpicker'
], function (module, _, $,
    Backbone, Log,
    ConnectorFactory, SearchResultsModel,
    FormFieldView, TypeaheadFieldViewMixin,
    SearchUtil, WorkspaceModel, lang ) {

  var log = new Log(module.id);

  var minLength = 3;

  function connectSearchFilterAndQuery( searchResultsModel, options ) {
    searchResultsModel.options.query.listenTo(searchResultsModel,"filter:change",function(){
      var fieldOptions = options.model && options.model.get('options');
      var parameters = fieldOptions && fieldOptions.type_control && fieldOptions.type_control.parameters;
      var wksptypes = parameters && parameters.workspace_types;
      var name = searchResultsModel.filters && searchResultsModel.filters["name"];
      var where, phrases, phrase;

      if (wksptypes && wksptypes.length>0) {
        where = '[QLREGION "XECMWkspLinkRefTypeID"] IN ('+ wksptypes.toString() +')'
      } else {
        where = '[QLREGION "OTSubType"] 848'
      }
      if (name) {
        var searchtype = parameters && parameters.search_type || "contains";
        if (searchtype==="contains") {
          phrases = SearchUtil.makePhrasesForContainsSearch(name);
        } else if (searchtype==="startsWith") {
          phrases = SearchUtil.makePhrasesForStartsWithSearch(name);
        } else {
          throw new Error("workspacefield ("+options.dataId+"): invalid search_type '"+searchtype+"'");
        }
        if (phrases) {
          phrase = SearchUtil.makeLQLFromPhrases('[QLREGION "OTName"]',phrases)
        }

        where = phrase ? where + ' AND ' + phrase : where;
      }

      // restrict to workspace instances, avoiding templates.
      where = where + ' AND [QLREGION "XECMWkspDocTemplateID"] > 0';

      var significance = SearchUtil.getSignificanceForPhrases(phrases);
      log.debug("WkspField search {0}, {1}, '{2}'", significance, minLength, where) && console.log(log.last);
      searchResultsModel.options.query.set({ "queryable": significance>=minLength, "where": where });
    });
  }

  var WorkspaceSearchResultsModel = SearchResultsModel.extend({

    model: WorkspaceModel,

    constructor: function WorkspaceSearchResultsModel(models,options) {
      $.extend(options,{
        skip: 0, top: options.top, orderBy: "OTName asc",
        query: new Backbone.Model({select:["OTName","OTSubType"]})
      });
      SearchResultsModel.prototype.constructor.apply(this,arguments);
    },

    fetch: function() {
      // avoid query be sent to the server, if it's not restrictive enough.
      var queryable = this.options && this.options.query && this.options.query.get("queryable");
      if (queryable) {
        return SearchResultsModel.prototype.fetch.apply(this,arguments);
      } else {
        // if condition is not queryable, then we have no results. we reset the collection.
        this.reset();
        // reject the promise, so typeahead is silent and doesn't show "no results found".
        return $.Deferred().reject().promise();
      }
    }

  });

  var WorkspaceFieldView = FormFieldView.extend({

    constructor: function WorkspaceFieldView(options) {

      var fieldOptions = options.model && options.model.get('options');
      var parameters = fieldOptions && fieldOptions.type_control && fieldOptions.type_control.parameters;
      var pagesize = parameters && parameters.page_size || 7;

      var searchResultCollection = new WorkspaceSearchResultsModel( undefined, {
        connector: options.context.getObject(ConnectorFactory),
        top: pagesize
      });

      connectSearchFilterAndQuery(searchResultCollection,options);

      options = $.extend(true,options,{
        css: {
          customImage: 'wksp-type-custom-image',
          defaultIcon: 'csui-icon csui-nodesprites'
        },
        lang: {
          alpacaPlaceholder: lang.alpacaPlaceholderOTWorkspacePicker
        },
        pickerOptions: {
          collection: searchResultCollection,
          titleSearchIcon: lang.titleWorkspaceSearchIcon,
          itemOptions: {
            css: {
              customImage: 'csui-icon wksp-type-custom-image',
              defaultIcon: 'csui-icon csui-nodesprites'
            }
          },
          enableInfiniteScrolling: true,
          fetchMoreItemsThreshold: 85,
          showAllOnClickIcon: false,
          items: pagesize,
          typeaheadOptions: {
            minLength: minLength
          }
        }
      });

      FormFieldView.apply(this, arguments);
      this.makeTypeaheadFieldView(options);
    }

  });

  TypeaheadFieldViewMixin.mixin(WorkspaceFieldView.prototype);

  return WorkspaceFieldView;
});
