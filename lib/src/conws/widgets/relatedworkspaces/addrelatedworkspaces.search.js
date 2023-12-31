/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([ 'csui/lib/jquery',
    'csui/lib/underscore',
    'csui/lib/marionette',
    'csui/lib/handlebars',
    'csui/controls/toolbar/toolitems.factory',
    'conws/utils/overlay/conwsoverlay',
    'csui/widgets/search.results/search.results.view',
    'conws/widgets/relatedworkspaces/impl/relatedworkspaces.searchresult.model',
    'conws/widgets/relatedworkspaces/impl/relatedworkspaces.searchform.model',
    'csui/utils/contexts/factories/search.query.factory',
    'i18n!conws/widgets/relatedworkspaces/impl/nls/lang'
], function ( $, _,
    Marionette,
    Handlebars,
    ToolItemsFactory,
    ConwsOverlay,
    SearchResultsView,
    RelatedWorkspacesSearchResultModel,
    RelatedWorkspacesSearchFormModel,
    SearchQueryModelFactory,
    lang
) {
    'use strict';

    var AddRelatedWorkspacesSearch = Marionette.Controller.extend({
    
        constructor: function AddRelatedWorkspacesSearch() {
          Marionette.Controller.prototype.constructor.apply(this, arguments);

          var status = this.options.status;
          var query = $.extend(true, {}, status.collection.options.query);
          query.where_workspace_type_ids = encodeURIComponent("{"+query.where_workspace_type_id+"}");
          query.where_rel_type = query.where_relationtype;
          delete query.where_workspace_type_id;
          delete query.where_relationtype;
          var fields = query.fields && decodeURIComponent(query.fields).replace(/^properties{|}$/g,"").split(",");
          query.fields = encodeURIComponent("properties{" + _.union(fields||[],["description"]).join(",") + "}");

          var searchquery = (new SearchQueryModelFactory(status.context)).property;

          var searchResultCollection = new RelatedWorkspacesSearchResultModel([], {
              node: status.collection.node,
              query: query,
              search: searchquery,
              connector: status.collection.connector,
              autofetch:true,
              autoreset:true,
              stateEnabled: true,
              columns: status.collection.columns,
              workspace: status.collection.workspace,
              orderBy: status.collection.orderBy
          });

          var tableColumns = status.originatingView.tableColumns && status.originatingView.tableColumns.deepClone();
          
          var searchFormModel = new RelatedWorkspacesSearchFormModel({},{
            columns: searchResultCollection.columns,
            tableColumns: tableColumns
          });

          var toolItemsFactory = new ToolItemsFactory({
            main: [{
              signature: this.options.signature,
              commandData: { submit: true },
              name: lang.ToolbarItemAddRelationSubmit
              }]
            }, {
            maxItemsShown: 1,
            dropDownText: lang.ToolbarItemMore,
            dropDownIconName: "csui_action_more32",
            addGroupSeparators: false
          });

          var toolbarItems = {
            otherToolbar: toolItemsFactory,
            inlineToolbar: [],
            tableHeaderToolbar: toolItemsFactory
          };

          var titleView = new Marionette.ItemView({
            tagName: 'div',
            template: Handlebars.compile('<span><h2 class="csui-custom-search-title">{{title}}</h2><span class="headerCount"/></span>')({
              title: this.options.title
            })
          });
  
          var searchView = new SearchResultsView({
            basicSearchResultsView: true,
            enableBackButton: true,
            enableSearchSettings: false,
            showFacetPanel: false,
            context: status.context,
            query: searchquery,
            collection: searchResultCollection,
            customSearchViewModel: searchFormModel,
            toolbarItems: toolbarItems,
            titleView: titleView,
            tableColumns: tableColumns,
            initialLoadMessage: lang.initialSearchLoadMessage
          });

          searchView.on("render",function() {
            searchView.$el.addClass('conws-searchview');
          });

          this.searchView = searchView;
          this.on("destroy",function(){
            searchView.destroy();
          });
        },

        show: function() {
          var resized;
          function handleResize() {
            resized = true;
          }
          addEventListener("resize",handleResize,{once:true});
          this.on("destroy",function(){
            removeEventListener("resize",handleResize);
          });

          var overlay = new ConwsOverlay({
            onShowOtherView: _.bind(function() {
              resized && this.options.status.originatingView.triggerMethod('dom:refresh');
              removeEventListener("resize",handleResize);
            },this),
            presentationRoot: this.options.status.originatingView.$el.parent(),
            presentationView: this.searchView
          });
          this.searchView.on("go:back", function() {
            overlay.close();
            overlay.destroy();
          });
          this._overlay = overlay;
          this._overlay.show();
        },

        close: function() {
          this._overlay.close();
        }

      });
    
      return AddRelatedWorkspacesSearch;
    

});
    